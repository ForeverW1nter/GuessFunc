import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStoryStore } from './useStoryStore';
import { evaluateEquivalence } from '../utils/mathEngine';
import { GAME_CONSTANTS } from '../utils/constants';
import i18n from '../i18n';

export type GameMode = 'story' | 'random' | 'custom' | 'share' | 'idle';

interface GameState {
  currentRoute: string | null;
  currentChapter: string | null;
  currentLevel: string | null;
  gameMode: GameMode;
  targetFunction: string;
  levelParams: Record<string, number>;
  playerInput: string;
  playerParams: Record<string, number>;
  isLevelCleared: boolean;
  domain: [number, number];
  randomDifficulty: number;
  randomWithParams: boolean;
  
  // 持久化存储的数据：已通关关卡和已观看剧情
  completedLevels: string[];
  seenChapters: string[];
  readFiles: string[]; // 记录已阅读的文件ID
  
  // Actions
  setTargetFunction: (func: string, params?: Record<string, number>, mode?: GameMode) => void;
  setPlayerInput: (input: string, params?: Record<string, number>) => void;
  setDomain: (domain: [number, number]) => void;
  evaluateInput: () => { isMatch: boolean; reason?: string };
  loadLevel: (routeId: string, chapterId: string, levelId: string) => void;
  nextLevel: () => void;
  markChapterSeen: (chapterId: string) => void;
  markFileRead: (fileId: string) => void;
  isLevelCompleted: (routeId: string, chapterId: string, levelId: string) => boolean;
  setRandomConfig: (difficulty: number, withParams: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentRoute: null,
      currentChapter: null,
      currentLevel: null,
      gameMode: 'random',
      targetFunction: 'x^2',
      levelParams: {},
      playerInput: 'x',
      playerParams: {},
      isLevelCleared: false,
      domain: GAME_CONSTANTS.DEFAULT_DOMAIN,
      randomDifficulty: 0,
      randomWithParams: false,
      
      completedLevels: [],
      seenChapters: [],
      readFiles: [],

      setTargetFunction: (func: string, params: Record<string, number> = {}, mode: GameMode = 'idle') => 
        set({ targetFunction: func, levelParams: params, isLevelCleared: false, gameMode: mode, playerInput: 'x', playerParams: {} }),
      
      setPlayerInput: (input: string, params: Record<string, number> = {}) => 
        set({ playerInput: input, playerParams: params }),
      
      setDomain: (domain: [number, number]) => set({ domain }),

      setRandomConfig: (difficulty: number, withParams: boolean) => set({ randomDifficulty: difficulty, randomWithParams: withParams }),

      evaluateInput: () => {
        const state = get();
        if (!state.targetFunction || !state.playerInput) {
          return { isMatch: false, reason: i18n.t('game.mathEngine.emptyInput') };
        }

        // 合并 levelParams 和 playerParams，确保目标函数和玩家函数的所有可能参数都被提取并随机化
        const allParams = { ...state.levelParams, ...state.playerParams };
        const result = evaluateEquivalence(state.targetFunction, state.playerInput, allParams);
        
        if (result.isMatch) {
          // 如果是剧情模式通关，记录通关状态
          if (state.gameMode === 'story' && state.currentLevel && state.currentChapter && state.currentRoute) {
            const currentCompleted = state.completedLevels;
            const globalLevelId = `${state.currentRoute}/${state.currentChapter}/${state.currentLevel}`;
            if (!currentCompleted.includes(globalLevelId)) {
              set({ 
                isLevelCleared: true,
                completedLevels: [...currentCompleted, globalLevelId]
              });
            } else {
              set({ isLevelCleared: true });
            }
          } else {
            set({ isLevelCleared: true });
          }
        }
        
        return result;
      },

      loadLevel: (routeId: string, chapterId: string, levelId: string) => {
        const storyStore = useStoryStore.getState();
        const levelData = storyStore.getLevel(routeId, chapterId, levelId);
        
        if (levelData) {
          set({
            currentRoute: routeId,
            currentChapter: chapterId,
            currentLevel: levelId,
            targetFunction: levelData.targetFunction || 'x',
            levelParams: levelData.params || {},
            playerInput: 'x',
            isLevelCleared: false,
            gameMode: 'story',
            domain: GAME_CONSTANTS.DEFAULT_DOMAIN 
          });
        }
      },

      nextLevel: () => {
        set({ isLevelCleared: false, playerInput: '' });
      },

      markChapterSeen: (chapterId: string) => {
        const currentSeen = get().seenChapters;
        if (!currentSeen.includes(chapterId)) {
          set({ seenChapters: [...currentSeen, chapterId] });
        }
      },

      markFileRead: (fileId: string) => {
        const currentRead = get().readFiles || [];
        if (!currentRead.includes(fileId)) {
          set({ readFiles: [...currentRead, fileId] });
        }
      },

      isLevelCompleted: (routeId: string, chapterId: string, levelId: string) => {
        return get().completedLevels.includes(`${routeId}/${chapterId}/${levelId}`);
      }
    }),
    {
      name: 'guess-func-storage', // 对应旧版的 StorageManager.STORAGE_KEY
      // 只持久化通关进度和看过的剧情，不要持久化当前正在玩的关卡状态
      partialize: (state) => ({ 
        completedLevels: state.completedLevels,
        seenChapters: state.seenChapters,
        readFiles: state.readFiles || []
      }),
    }
  )
);
