import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import gymnopedieAudio from '../assets/audio/Gymnopedie_1_Erik_Satie.mp3';
import epicCinematicAudio from '../assets/audio/Epic_Cinematic.mp3';

export const AVAILABLE_BGMS = [
  { id: 'gymnopedie', name: 'Gymnopedie No.1', path: gymnopedieAudio },
  { id: 'epic', name: 'Epic Cinematic', path: epicCinematicAudio },
];

interface AudioState {
  volume: number;
  isMuted: boolean;
  currentBgmId: string;
  unlockedBgms: string[];
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setCurrentBgmId: (id: string) => void;
  unlockBgm: (id: string) => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      volume: 0.5,
      isMuted: false,
      currentBgmId: 'gymnopedie',
      unlockedBgms: ['gymnopedie'],
      setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setCurrentBgmId: (id) => set({ currentBgmId: id }),
      unlockBgm: (id) => set((state) => ({ 
        unlockedBgms: state.unlockedBgms.includes(id) ? state.unlockedBgms : [...state.unlockedBgms, id] 
      })),
    }),
    {
      name: 'guess-func-audio-storage',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        currentBgmId: state.currentBgmId,
        unlockedBgms: state.unlockedBgms,
      }),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<AudioState>;
        if (!state) return state;
        if (version === 0) {
          if (typeof state.isMuted !== 'boolean') state.isMuted = false;
          if (typeof state.volume !== 'number') state.volume = 0.5;
        }
        return state;
      },
    }
  )
);
