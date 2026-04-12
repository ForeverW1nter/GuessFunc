import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { GAME_CONSTANTS } from '../utils/constants';
import { hexToRgb, getPrimaryForeground } from '../utils/colorUtils';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isExiting?: boolean;
}

export interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isSettingsOpen: boolean;
  isRandomChallengeOpen: boolean;
  theme: 'light' | 'dark';
  customPrimaryColor: string | null;
  isAssistMode: boolean;
  isDebugMode: boolean;
  toasts: ToastMessage[];
  
  // Font settings
  storyFontSize: number;
  storyFontFamily: string;
  storyFontUrl: string | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  
  toggleSettings: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
  
  setRandomChallengeOpen: (isOpen: boolean) => void;

  setTheme: (theme: 'light' | 'dark') => void;
  setCustomPrimaryColor: (color: string | null) => void;
  
  toggleAssistMode: () => void;
  toggleDebugMode: () => void;
  
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  setStoryFontSize: (size: number) => void;
  setStoryFontFamily: (family: string, url?: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      isSidebarCollapsed: false,
      isSettingsOpen: false,
      isRandomChallengeOpen: false,
      theme: 'dark',
      customPrimaryColor: null,
      isAssistMode: false,
      isDebugMode: false,
      toasts: [],
      storyFontSize: 100,
      storyFontFamily: GAME_CONSTANTS.FONTS.DEFAULT_STORY_FONT,
      storyFontUrl: null,
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
      
      toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (isCollapsed: boolean) => set({ isSidebarCollapsed: isCollapsed }),
      
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setSettingsOpen: (isOpen: boolean) => set({ isSettingsOpen: isOpen }),

      setRandomChallengeOpen: (isOpen: boolean) => set({ isRandomChallengeOpen: isOpen }),

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      setCustomPrimaryColor: (color) => {
        set({ customPrimaryColor: color });
        if (color) {
          // Convert hex to rgb
          const hex = color.replace('#', '');
          const { r, g, b } = hexToRgb(color);
          document.documentElement.style.setProperty('--primary', `${r} ${g} ${b}`);
          
          const primaryForeground = getPrimaryForeground(r, g, b);
          document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
          document.documentElement.style.setProperty('--chat-primary-foreground', primaryForeground);
          
          // Update favicon color dynamically
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#${hex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>`;
          const encodedSvg = btoa(svgContent);
          const favicon = document.getElementById('favicon') as HTMLLinkElement;
          if (favicon) {
            favicon.href = `data:image/svg+xml;base64,${encodedSvg}`;
          }
        } else {
          document.documentElement.style.removeProperty('--primary');
          document.documentElement.style.removeProperty('--primary-foreground');
          document.documentElement.style.removeProperty('--chat-primary-foreground');
          const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00BCD4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>`;
          const favicon = document.getElementById('favicon') as HTMLLinkElement;
          if (favicon) {
            favicon.href = `data:image/svg+xml;base64,${btoa(defaultSvg)}`;
          }
        }
      },
      
      toggleAssistMode: () => set((state) => ({ isAssistMode: !state.isAssistMode })),
      toggleDebugMode: () => set((state) => ({ isDebugMode: !state.isDebugMode })),
      
      addToast: (message: string, type: ToastMessage['type'] = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }));
        // Auto mark as exiting after 3 seconds
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.map(t => t.id === id ? { ...t, isExiting: true } : t)
          }));
          // Actually remove after animation completes
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter(t => t.id !== id)
            }));
          }, 300);
        }, 3000);
      },
      
      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.map(t => t.id === id ? { ...t, isExiting: true } : t)
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
          }));
        }, 300);
      },

      setStoryFontSize: (size) => set({ storyFontSize: size }),
      setStoryFontFamily: (family, url = null) => {
        set({ storyFontFamily: family, storyFontUrl: url });
        document.documentElement.style.setProperty('--story-font-family', family);
      },
    }),
    {
      name: 'guess-func-ui-storage',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<UIState>;
        if (!state) return state;
        if (version === 0) {
          if (typeof state.theme !== 'string') state.theme = 'dark';
          if (typeof state.storyFontSize !== 'number') state.storyFontSize = 100;
        }
        return state;
      },
      partialize: (state) => ({ 
        theme: state.theme,
        isAssistMode: state.isAssistMode,
        isDebugMode: state.isDebugMode,
        isSidebarCollapsed: state.isSidebarCollapsed,
        customPrimaryColor: state.customPrimaryColor,
        storyFontSize: state.storyFontSize,
        storyFontFamily: state.storyFontFamily,
        storyFontUrl: state.storyFontUrl
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme);
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          if (state.customPrimaryColor) {
            const color = state.customPrimaryColor;
            const hex = color.replace('#', '');
            const { r, g, b } = hexToRgb(color);
            document.documentElement.style.setProperty('--primary', `${r} ${g} ${b}`);
            
            const primaryForeground = getPrimaryForeground(r, g, b);
            document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
            document.documentElement.style.setProperty('--chat-primary-foreground', primaryForeground);
            
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#${hex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>`;
            const encodedSvg = btoa(svgContent);
            const favicon = document.getElementById('favicon') as HTMLLinkElement;
            if (favicon) {
              favicon.href = `data:image/svg+xml;base64,${encodedSvg}`;
            }
          }
          if (state.storyFontUrl) {
             const style = document.createElement('style');
             style.innerHTML = `
               @font-face {
                 font-family: '${GAME_CONSTANTS.FONTS.CUSTOM_FONT_NAME}';
                 src: url('${state.storyFontUrl}');
               }
             `;
             document.head.appendChild(style);
          }
          if (state.storyFontFamily) {
            document.documentElement.style.setProperty('--story-font-family', state.storyFontFamily);
          }
        }
      }
    }
  )
);
