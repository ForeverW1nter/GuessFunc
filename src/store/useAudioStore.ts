import { create } from 'zustand';

interface AudioState {
  volume: number;
  isMuted: boolean;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  volume: 0.5,
  isMuted: false,
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));
