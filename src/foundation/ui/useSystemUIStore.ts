import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemUIState {
  language: string;
  fontFamily: string;
  fontSizeMultiplier: number;
  
  // Actions
  setLanguage: (lang: string) => void;
  setFontFamily: (font: string) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
}

export const useSystemUIStore = create<SystemUIState>()(
  persist(
    (set) => ({
      language: 'zh',
      fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
      fontSizeMultiplier: 1,

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
