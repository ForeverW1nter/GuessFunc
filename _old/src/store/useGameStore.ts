import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStoryStore } from './useStoryStore';
import { evaluateEquivalence } from '../utils/mathEngine';
import { GAME_CONSTANTS } from '../utils/constants';
import i18n from '../i18n';

export type GameMode = 'story' | 'random' | 'custom' | 'share' | 'idle';

// Default values for game state
const DEFAULTS = {
  GAME_MODE: 'random' as GameMode,
  TARGET_FUNCTION: 'x^2',
  PLAYER_INPUT: 'x',
  DOMAIN: GAME_CONSTANTS.DEFAULT_DOMAIN,
  RANDOM_DIFFICULTY: 0,
  RANDOM_WITH_PARAMS: false,
} as const;

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
  setTargetFunction: (func: string, params?: Record<string, number>, mode?: GameMode, levelName?: string | null) => void;
  setPlayerInput: (input: string, params?: Record<string, number>) => void;
  setDomain: (domain: [number, number]) => void;
  evaluateInput: () => Promise<{ isMatch: boolean; reason?: string }>;
  loadLevel: (routeId: string, chapterId: string, levelId: string) => void;
  nextLevel: () => void;
  markChapterSeen: (routeId: string, chapterId: string) => void;
  markFileRead: (routeId: string, chapterId: string, fileId: string) => void;
  isLevelCompleted: (routeId: string, chapterId: string, levelId: string) => boolean;
  setRandomConfig: (difficulty: number, withParams: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentRoute: null,
      currentChapter: null,
      currentLevel: null,
      gameMode: DEFAULTS.GAME_MODE,
      targetFunction: DEFAULTS.TARGET_FUNCTION,
      levelParams: {},
      playerInput: DEFAULTS.PLAYER_INPUT,
      playerParams: {},
      isLevelCleared: false,
      domain: DEFAULTS.DOMAIN,
      randomDifficulty: DEFAULTS.RANDOM_DIFFICULTY,
      randomWithParams: DEFAULTS.RANDOM_WITH_PARAMS,

      completedLevels: [],
      seenChapters: [],
      readFiles: [],

      setTargetFunction: (func: string, params: Record<string, number> = {}, mode: GameMode = 'idle', levelName: string | null = null) =>
        set({
          targetFunction: func,
          levelParams: params,
          isLevelCleared: false,
          gameMode: mode,
          playerInput: DEFAULTS.PLAYER_INPUT,
          playerParams: {},
          currentLevel: levelName
        }),
      
      setPlayerInput: (input: string, params: Record<string, number> = {}) => 
        set({ playerInput: input, playerParams: params }),
      
      setDomain: (domain: [number, number]) => set({ domain }),

      setRandomConfig: (difficulty: number, withParams: boolean) => 
        set({ randomDifficulty: difficulty, randomWithParams: withParams }),

      evaluateInput: async () => {
        const state = get();
        if (!state.targetFunction || !state.playerInput) {
          return { isMatch: false, reason: i18n.t('game.mathEngine.emptyInput') };
        }

        // 合并 levelParams 和 playerParams，确保目标函数和玩家函数的所有可能参数都被提取并随机化
        const allParams = { ...state.levelParams, ...state.playerParams };
        const result = await evaluateEquivalence(state.targetFunction, state.playerInput, allParams);
        
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
            playerInput: DEFAULTS.PLAYER_INPUT,
            isLevelCleared: false,
            gameMode: 'story',
            domain: DEFAULTS.DOMAIN
          });
        }
      },

      nextLevel: () => {
        set({ isLevelCleared: false, playerInput: '' });
      },

      markChapterSeen: (routeId: string, chapterId: string) => {
        const currentSeen = get().seenChapters;
        const globalChapterId = `${routeId}/${chapterId}`;
        if (!currentSeen.includes(globalChapterId)) {
          set({ seenChapters: [...currentSeen, globalChapterId] });
        }
      },

      markFileRead: (routeId: string, chapterId: string, fileId: string) => {
        const currentRead = get().readFiles || [];
        const globalFileId = `${routeId}/${chapterId}/${fileId}`;
        if (!currentRead.includes(globalFileId)) {
          set({ readFiles: [...currentRead, globalFileId] });
        }
      },

      isLevelCompleted: (routeId: string, chapterId: string, levelId: string) => {
        return get().completedLevels.includes(`${routeId}/${chapterId}/${levelId}`);
      }
    }),
    {
      name: 'guess-func-storage', // 对应旧版的 StorageManager.STORAGE_KEY
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<GameState>;
        if (!state) return state;
        if (version === 0) {
          // If migrating from version 0 to 1, ensure arrays exist
          state.completedLevels = state.completedLevels || [];
          state.seenChapters = state.seenChapters || [];
          state.readFiles = state.readFiles || [];
        }
        return state;
      },
      // 只持久化通关进度和看过的剧情，不要持久化当前正在玩的关卡状态
      partialize: (state) => ({ 
        completedLevels: state.completedLevels,
        seenChapters: state.seenChapters,
        readFiles: state.readFiles || []
      }),
    }
  )
);
