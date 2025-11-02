// src/services/audioService.ts
import { Audio, AVPlaybackStatus } from 'expo-av';
import { MusicChallenge } from '../types';

let sound: Audio.Sound | null = null;

// Setup Audio configuration
export const setupAudio = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 2,
    });
    console.log('Audio setup complete');
  } catch (error: unknown) {
    console.error('Audio setup error:', error);
    throw error;
  }
};

// Reset / unload player
export const resetAudio = async (): Promise<void> => {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error: unknown) {
    console.error('Reset audio error:', error);
  }
};

// Add / load track
export const addTrack = async (track: MusicChallenge): Promise<void> => {
  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: track.audioUrl },
      { shouldPlay: false }
    );

    sound = newSound;
  } catch (error: unknown) {
    console.error('Add track error:', error);
    throw error;
  }
};

// Play current track
export const playTrack = async (): Promise<void> => {
  try {
    if (sound) await sound.playAsync();
  } catch (error: unknown) {
    console.error('Play track error:', error);
    throw error;
  }
};

// Pause current track
export const pauseTrack = async (): Promise<void> => {
  try {
    if (sound) await sound.pauseAsync();
  } catch (error: unknown) {
    console.error('Pause track error:', error);
    throw error;
  }
};

// Seek to a specific position (in seconds)
export const seekToPosition = async (seconds: number): Promise<void> => {
  try {
    if (sound) await sound.setPositionAsync(seconds * 1000);
  } catch (error: unknown) {
    console.error('Seek error:', error);
    throw error;
  }
};

// Get current position (in seconds)
export const getCurrentPosition = async (): Promise<number> => {
  try {
    if (!sound) return 0;
    const status = await sound.getStatusAsync();

    // Type narrowing
    if ('positionMillis' in status) {
      return status.positionMillis / 1000; // convert to seconds
    }

    return 0; // if status is an error
  } catch (error) {
    console.error('Get position error:', error);
    return 0;
  }
};

// Get track duration (in seconds)
export const getTrackDuration = async (): Promise<number> => {
  try {
    if (!sound) return 0;
    const status = await sound.getStatusAsync();

    if ('durationMillis' in status && status.durationMillis != null) {
      return status.durationMillis / 1000; // convert to seconds
    }

    return 0;
  } catch (error) {
    console.error('Get duration error:', error);
    return 0;
  }
};

// Handle playback errors
export const handlePlaybackError = (error: unknown) => {
  console.error('Playback error:', error);
  return {
    message: error instanceof Error ? error.message : 'Unknown playback error',
    code: 'UNKNOWN_ERROR',
  };
};

// Cleanup function
export const cleanupAudio = async (): Promise<void> => {
  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error: unknown) {
    console.error('Cleanup error:', error);
  }
};
