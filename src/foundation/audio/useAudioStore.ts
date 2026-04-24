import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Re-export or import actual paths if necessary
const DEFAULT_BGM_PATH = '/audio/Gymnopedie_1_Erik_Satie.mp3';

interface AudioState {
  volume: number;
  isMuted: boolean;
  currentBgmId: string;
  unlockedBgms: string[];

  // Actions
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setCurrentBgmId: (id: string) => void;
  unlockBgm: (id: string) => void;
}

const DEFAULT_VOLUME = 0.5;

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      isMuted: false,
      currentBgmId: DEFAULT_BGM_PATH,
      unlockedBgms: [DEFAULT_BGM_PATH],

      setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setCurrentBgmId: (id) => set({ currentBgmId: id }),
      unlockBgm: (id) => set((state) => ({ 
        unlockedBgms: state.unlockedBgms.includes(id) ? state.unlockedBgms : [...state.unlockedBgms, id] 
      })),
    }),
    {
      name: 'system-core-audio',
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
          if (typeof state.volume !== 'number') state.volume = DEFAULT_VOLUME;
        }
        return state;
      },
    }
  )
);
