import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  isLevelSelectOpen: boolean;
  isRandomChallengeOpen: boolean;
  isAiChatOpen: boolean;
  theme: 'light' | 'dark';
  customPrimaryColor: string | null;
  isSpeedrunMode: boolean;
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
  
  setLevelSelectOpen: (isOpen: boolean) => void;
  
  setRandomChallengeOpen: (isOpen: boolean) => void;

  setAiChatOpen: (isOpen: boolean) => void;

  setTheme: (theme: 'light' | 'dark') => void;
  setCustomPrimaryColor: (color: string | null) => void;
  
  toggleSpeedrunMode: () => void;
  
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
      isLevelSelectOpen: false,
      isRandomChallengeOpen: false,
      isAiChatOpen: false,
      theme: 'dark',
      customPrimaryColor: '#00BCD4',
      isSpeedrunMode: false,
      toasts: [],
      storyFontSize: 100,
      storyFontFamily: 'system-ui, -apple-system, sans-serif',
      storyFontUrl: null,
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
      
      toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (isCollapsed: boolean) => set({ isSidebarCollapsed: isCollapsed }),
      
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setSettingsOpen: (isOpen: boolean) => set({ isSettingsOpen: isOpen }),
      
      setLevelSelectOpen: (isOpen: boolean) => set({ isLevelSelectOpen: isOpen }),

      setRandomChallengeOpen: (isOpen: boolean) => set({ isRandomChallengeOpen: isOpen }),

      setAiChatOpen: (isOpen: boolean) => set({ isAiChatOpen: isOpen }),

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
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          document.documentElement.style.setProperty('--primary-color', color);
          document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
        } else {
          document.documentElement.style.removeProperty('--primary-color');
          document.documentElement.style.removeProperty('--primary-color-rgb');
        }
      },
      
      toggleSpeedrunMode: () => set((state) => ({ isSpeedrunMode: !state.isSpeedrunMode })),
      
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
      setStoryFontFamily: (family, url = null) => set({ storyFontFamily: family, storyFontUrl: url }),
    }),
    {
      name: 'guess-func-ui-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        isSpeedrunMode: state.isSpeedrunMode, 
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
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
          }
          if (state.storyFontUrl) {
             const style = document.createElement('style');
             style.innerHTML = `
               @font-face {
                 font-family: 'CustomStoryFont';
                 src: url('${state.storyFontUrl}');
               }
             `;
             document.head.appendChild(style);
          }
        }
      }
    }
  )
);
