// src/hooks/useMusicPlayer.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import { useMusicStore } from '../stores/musicStore';
import { MusicChallenge } from '../types';
import type { AVPlaybackStatus } from 'expo-av';

export function useMusicPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs for store functions to avoid stale closures
  const setCurrentTrack = useMusicStore((state) => state.setCurrentTrack);
  const setIsPlaying = useMusicStore((state) => state.setIsPlaying);
  const updateProgress = useMusicStore((state) => state.updateProgress);
  const markChallengeComplete = useMusicStore((state) => state.markChallengeComplete);
  
  // Use refs for store functions to prevent closure issues
  const setCurrentTrackRef = useRef(setCurrentTrack);
  const setIsPlayingRef = useRef(setIsPlaying);
  const updateProgressRef = useRef(updateProgress);
  const markChallengeCompleteRef = useRef(markChallengeComplete);
  
  // Keep refs up to date
  useEffect(() => {
    setCurrentTrackRef.current = setCurrentTrack;
    setIsPlayingRef.current = setIsPlaying;
    updateProgressRef.current = updateProgress;
    markChallengeCompleteRef.current = markChallengeComplete;
  }, [setCurrentTrack, setIsPlaying, updateProgress, markChallengeComplete]);

  // Get state values separately to avoid triggering callback recreation
  const currentTrack = useMusicStore((state) => state.currentTrack);
  const isPlaying = useMusicStore((state) => state.isPlaying);

  // Status update callback - use refs to avoid stale closures
  const handlePlaybackStatusUpdate = useCallback((playbackStatus: AVPlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      console.log('Track not loaded yet');
      return;
    }

    const ps = playbackStatus as AVPlaybackStatusSuccess;
    setStatus(ps);
    setCurrentPosition(ps.positionMillis / 1000);
    setDuration(ps.durationMillis ? ps.durationMillis / 1000 : 0);

    // Update playing state from actual playback
    setIsPlayingRef.current(ps.isPlaying);

    // Update progress percentage
    const track = useMusicStore.getState().currentTrack;
    if (ps.durationMillis && track) {
      const progress = (ps.positionMillis / ps.durationMillis) * 100;
      updateProgressRef.current(track.id, progress);
    }

    // Mark challenge complete if track finished
    if (ps.didJustFinish && track) {
      console.log('Track finished');
      markChallengeCompleteRef.current(track.id);
      setIsPlayingRef.current(false);
    }
  }, []); // Empty deps - we use refs instead

  // Load and play a track
  const loadTrack = useCallback(
    async (track: MusicChallenge) => {
      try {
        setLoading(true);
        setError(null);

        // Stop and unload previous player
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (e) {
            console.warn('Error unloading previous track:', e);
          }
          soundRef.current = null;
        }

        // Set current track in store
        setCurrentTrackRef.current(track);
        console.log('Loading track:', track.title);
        
        // Create new player
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { shouldPlay: true },
          handlePlaybackStatusUpdate
        );
        
        // Store sound instance
        soundRef.current = sound;
        console.log('Sound loaded and stored in ref:', soundRef.current !== null);
        setIsPlayingRef.current(true);
      } catch (err) {
        console.error('Failed to load track:', err);
        setError('Failed to load track: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [handlePlaybackStatusUpdate]
  );

  const play = useCallback(async () => {
    try {
      console.log('play() called, soundRef.current:', soundRef.current !== null);
      if (!soundRef.current) {
        console.warn('No sound instance to play');
        return;
      }
      console.log('Playing...');
      await soundRef.current.playAsync();
      setIsPlayingRef.current(true);
    } catch (err) {
      console.error('Failed to play:', err);
      setError('Failed to play: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      console.log('pause() called, soundRef.current:', soundRef.current !== null);
      if (!soundRef.current) {
        console.warn('No sound instance to pause');
        return;
      }
      console.log('Pausing...');
      await soundRef.current.pauseAsync();
      setIsPlayingRef.current(false);
      console.log('Paused successfully');
    } catch (err) {
      console.error('Failed to pause:', err);
      setError('Failed to pause: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      console.log('resume() called, soundRef.current:', soundRef.current !== null);
      if (!soundRef.current) {
        console.warn('No sound instance to resume');
        return;
      }
      console.log('Resuming...');
      await soundRef.current.playAsync();
      setIsPlayingRef.current(true);
    } catch (err) {
      console.error('Failed to resume:', err);
      setError('Failed to resume: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      console.log('stop() called, soundRef.current:', soundRef.current !== null);
      if (!soundRef.current) {
        console.warn('No sound instance to stop');
        return;
      }
      console.log('Stopping...');
      await soundRef.current.stopAsync();
      setIsPlayingRef.current(false);
    } catch (err) {
      console.error('Failed to stop:', err);
      setError('Failed to stop: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  const seekTo = useCallback(async (positionSeconds: number) => {
    try {
      console.log('seekTo() called, soundRef.current:', soundRef.current !== null);
      if (!soundRef.current) {
        console.warn('No sound instance to seek');
        return;
      }
      
      const positionMillis = Math.max(0, positionSeconds * 1000);
      console.log('Seeking to:', positionSeconds, 'seconds');
      await soundRef.current.setPositionAsync(positionMillis);
    } catch (err) {
      console.error('Failed to seek:', err);
      setError('Failed to seek: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        console.log('Cleaning up sound on unmount');
        soundRef.current.unloadAsync().catch(e => 
          console.warn('Error during cleanup:', e)
        );
        soundRef.current = null;
      }
    };
  }, []);

  return {
    currentTrack,
    isPlaying,
    currentPosition,
    duration,
    status,
    loadTrack,
    play,
    pause,
    resume,
    stop,
    seekTo,
    loading,
    error,
  };
}