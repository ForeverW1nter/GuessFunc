import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemUIState {
  isControlCenterOpen: boolean;
  language: string;
  fontFamily: string;
  fontSizeMultiplier: number;
  
  // Actions
  toggleControlCenter: () => void;
  setControlCenterOpen: (isOpen: boolean) => void;
  setLanguage: (lang: string) => void;
  setFontFamily: (font: string) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
}

export const useSystemUIStore = create<SystemUIState>()(
  persist(
    (set) => ({
      isControlCenterOpen: false,
      language: 'zh',
      fontFamily: 'system-ui',
      fontSizeMultiplier: 1,

      toggleControlCenter: () => set((state) => ({ isControlCenterOpen: !state.isControlCenterOpen })),
      setControlCenterOpen: (isOpen) => set({ isControlCenterOpen: isOpen }),
      setLanguage: (lang) => set({ language: lang }),
      setFontFamily: (font) => set({ fontFamily: font }),
      setFontSizeMultiplier: (multiplier) => set({ fontSizeMultiplier: multiplier }),
    }),
    {
      name: 'system-core-ui-settings',
      partialize: (state) => ({
        language: state.language,
        fontFamily: state.fontFamily,
        fontSizeMultiplier: state.fontSizeMultiplier,
      }),
      version: 1,
    }
  )
);
