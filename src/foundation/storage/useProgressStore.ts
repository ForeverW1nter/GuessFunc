import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  completedLevels: string[];
  seenChapters: string[];
  readFiles: string[];

  // Actions
  markLevelCompleted: (globalLevelId: string) => void;
  markChapterSeen: (globalChapterId: string) => void;
  markFileRead: (globalFileId: string) => void;
  
  isLevelCompleted: (globalLevelId: string) => boolean;
  isChapterSeen: (globalChapterId: string) => boolean;
  isFileRead: (globalFileId: string) => boolean;

  clearProgress: () => void;
}

const STORAGE_KEY = 'system-core-progress';

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLevels: [],
      seenChapters: [],
      readFiles: [],

      markLevelCompleted: (globalLevelId: string) => {
        const { completedLevels } = get();
        if (!completedLevels.includes(globalLevelId)) {
          set({ completedLevels: [...completedLevels, globalLevelId] });
        }
      },

      markChapterSeen: (globalChapterId: string) => {
        const { seenChapters } = get();
        if (!seenChapters.includes(globalChapterId)) {
          set({ seenChapters: [...seenChapters, globalChapterId] });
        }
      },

      markFileRead: (globalFileId: string) => {
        const { readFiles } = get();
        if (!readFiles.includes(globalFileId)) {
          set({ readFiles: [...readFiles, globalFileId] });
        }
      },

      isLevelCompleted: (globalLevelId: string) => get().completedLevels.includes(globalLevelId),
      isChapterSeen: (globalChapterId: string) => get().seenChapters.includes(globalChapterId),
      isFileRead: (globalFileId: string) => get().readFiles.includes(globalFileId),

      clearProgress: () => {
        set({ completedLevels: [], seenChapters: [], readFiles: [] });
      }
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<ProgressState>;
        if (!state) return state;
        // Migration logic for future schema changes
        if (version === 0) {
          state.completedLevels = state.completedLevels || [];
          state.seenChapters = state.seenChapters || [];
          state.readFiles = state.readFiles || [];
        }
        return state;
      }
    }
  )
);
