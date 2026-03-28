import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStoryStore } from './useStoryStore';
import { evaluateEquivalence } from '../utils/mathEngine';
import { GAME_CONSTANTS } from '../utils/constants';

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
  
  // 持久化存储的数据：已通关关卡和已观看剧情
  completedLevels: string[];
  seenChapters: string[];
  
  // Actions
  setTargetFunction: (func: string, params?: Record<string, number>, mode?: GameMode) => void;
  setPlayerInput: (input: string, params?: Record<string, number>) => void;
  setDomain: (domain: [number, number]) => void;
  evaluateInput: () => { isMatch: boolean; reason?: string };
  loadLevel: (routeId: string, chapterId: string, levelId: string) => void;
  nextLevel: () => void;
  markChapterSeen: (chapterId: string) => void;
  isLevelCompleted: (levelId: string) => boolean;
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
      
      completedLevels: [],
      seenChapters: [],

      setTargetFunction: (func: string, params: Record<string, number> = {}, mode: GameMode = 'idle') => 
        set({ targetFunction: func, levelParams: params, isLevelCleared: false, gameMode: mode, playerInput: 'x', playerParams: {} }),
      
      setPlayerInput: (input: string, params: Record<string, number> = {}) => 
        set({ playerInput: input, playerParams: params }),
      
      setDomain: (domain: [number, number]) => set({ domain }),

      evaluateInput: () => {
        const state = get();
        if (!state.targetFunction || !state.playerInput) {
          return { isMatch: false, reason: "请输入函数表达式" };
        }

        const result = evaluateEquivalence(state.targetFunction, state.playerInput, state.playerParams);
        
        if (result.isMatch) {
          // 如果是剧情模式通关，记录通关状态
          if (state.gameMode === 'story' && state.currentLevel) {
            const currentCompleted = state.completedLevels;
            if (!currentCompleted.includes(state.currentLevel)) {
              set({ 
                isLevelCleared: true,
                completedLevels: [...currentCompleted, state.currentLevel]
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

      isLevelCompleted: (levelId: string) => {
        return get().completedLevels.includes(levelId);
      }
    }),
    {
      name: 'guess-func-storage', // 对应旧版的 StorageManager.STORAGE_KEY
      // 只持久化通关进度和看过的剧情，不要持久化当前正在玩的关卡状态
      partialize: (state) => ({ 
        completedLevels: state.completedLevels,
        seenChapters: state.seenChapters
      }),
    }
  )
);
