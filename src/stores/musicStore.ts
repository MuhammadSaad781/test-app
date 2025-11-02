// Zustand store for music playback and challenges
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { MusicChallenge } from '../types';
import { SAMPLE_CHALLENGES } from '../constants/theme';
import { useUserStore } from './userStore';

// Module-level sound reference to persist across store updates
let soundInstance: Audio.Sound | null = null;

interface MusicStore {
  // State
  challenges: MusicChallenge[];
  currentTrack: MusicChallenge | null;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  loading: boolean;
  error: string | null;

  // Basic Actions
  loadChallenges: () => void;
  setCurrentTrack: (track: MusicChallenge) => void;
  updateProgress: (challengeId: string, progress: number) => void;
  markChallengeComplete: (challengeId: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;

  // Player Actions
  loadTrack: (track: MusicChallenge) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (positionSeconds: number) => Promise<void>;
  cleanup: () => Promise<void>;
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      // Initial state
      challenges: SAMPLE_CHALLENGES,
      currentTrack: null,
      isPlaying: false,
      currentPosition: 0,
      duration: 0,
      loading: false,
      error: null,

      // Basic Actions
      loadChallenges: () => set({ challenges: SAMPLE_CHALLENGES }),

      setCurrentTrack: (track: MusicChallenge) => set({ currentTrack: track }),

      updateProgress: (challengeId: string, progress: number) => {
        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? { ...challenge, progress: Math.min(progress, 100) }
              : challenge
          ),
        }));
      },

      markChallengeComplete: (challengeId: string) => {
        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  completed: true,
                  progress: 100,
                  completedAt: new Date().toISOString(),
                }
              : challenge
          ),
        }));
      },

      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
      setCurrentPosition: (position: number) => set({ currentPosition: position }),

      // Player Actions
      loadTrack: async (track: MusicChallenge) => {
        try {
          set({ loading: true, error: null });

          if (soundInstance) {
            try {
              await soundInstance.stopAsync();
              await soundInstance.unloadAsync();
            } catch (e) {
              console.warn('Error unloading previous track:', e);
            }
            soundInstance = null;
          }

          set({ currentTrack: track });
          console.log('Loading track:', track.title);

          const { sound } = await Audio.Sound.createAsync(
            { uri: track.audioUrl },
            { shouldPlay: true },
            (playbackStatus: AVPlaybackStatus) => {
              if (!playbackStatus.isLoaded) return;

              const ps = playbackStatus as AVPlaybackStatusSuccess;

              set({
                currentPosition: ps.positionMillis / 1000,
                duration: ps.durationMillis ? ps.durationMillis / 1000 : 0,
                isPlaying: ps.isPlaying,
              });

              if (ps.durationMillis) {
                const progress = (ps.positionMillis / ps.durationMillis) * 100;
                get().updateProgress(track.id, progress);
              }

              if (ps.didJustFinish) {
                console.log('Track finished');
                get().markChallengeComplete(track.id);

                const { completeChallenge, addPoints } = useUserStore.getState();
                completeChallenge(track.id);
                addPoints(track.points ?? 10);

                set((state) => ({
                  currentTrack: state.currentTrack
                    ? { ...state.currentTrack, completed: true, progress: 100 }
                    : state.currentTrack,
                  isPlaying: false,
                }));
              }
            }
          );

          soundInstance = sound;
          set({ isPlaying: true, loading: false });
          console.log('Track loaded successfully');
        } catch (err) {
          console.error('Failed to load track:', err);
          set({
            error: 'Failed to load track: ' + (err instanceof Error ? err.message : 'Unknown error'),
            loading: false,
          });
        }
      },

      play: async () => {
        if (!soundInstance) return console.warn('No sound instance to play');
        await soundInstance.playAsync();
        set({ isPlaying: true });
      },

      pause: async () => {
        if (!soundInstance) return console.warn('No sound instance to pause');
        await soundInstance.pauseAsync();
        set({ isPlaying: false });
      },

      resume: async () => {
        if (!soundInstance) return console.warn('No sound instance to resume');
        await soundInstance.playAsync();
        set({ isPlaying: true });
      },

      stop: async () => {
        if (!soundInstance) return console.warn('No sound instance to stop');
        await soundInstance.stopAsync();
        set({ isPlaying: false });
      },

      seekTo: async (positionSeconds: number) => {
        if (!soundInstance) return console.warn('No sound instance to seek');
        await soundInstance.setPositionAsync(Math.max(0, positionSeconds * 1000));
      },

      cleanup: async () => {
        if (soundInstance) {
          await soundInstance.unloadAsync();
          soundInstance = null;
        }
      },
    }),
    {
      name: 'music-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ challenges: state.challenges }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { challenges?: MusicChallenge[] } | undefined;
        return {
          ...currentState,
          challenges: persisted?.challenges?.length
            ? persisted.challenges
            : SAMPLE_CHALLENGES,
        };
      },
    }
  )
);

// Selector functions for performance
export const selectCurrentTrack = (state: MusicStore) => state.currentTrack;
export const selectIsPlaying = (state: MusicStore) => state.isPlaying;
export const selectChallenges = (state: MusicStore) => state.challenges;
export const selectCurrentPosition = (state: MusicStore) => state.currentPosition;
export const selectDuration = (state: MusicStore) => state.duration;
export const selectLoading = (state: MusicStore) => state.loading;
export const selectError = (state: MusicStore) => state.error;
