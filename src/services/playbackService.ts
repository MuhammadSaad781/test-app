// playbackService.ts
// For expo-av, we handle playback events directly in your audioService
// Background playback is configured via Audio.setAudioModeAsync

import { Audio } from 'expo-av';
import { MusicChallenge } from '../types';
import { addTrack, playTrack, pauseTrack, seekToPosition } from './audioService';

// Optional: helper to handle remote-like events in-app
export const setupPlaybackEvents = () => {
  // Example: you can use button presses or custom events
  // since expo-av does not have native remote events like TrackPlayer

  // Play
  const onPlay = async () => {
    await playTrack();
  };

  // Pause
  const onPause = async () => {
    await pauseTrack();
  };

  // Seek (seconds)
  const onSeek = async (position: number) => {
    await seekToPosition(position);
  };

  return { onPlay, onPause, onSeek };
};
