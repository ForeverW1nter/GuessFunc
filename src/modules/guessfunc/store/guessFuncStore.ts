import { create } from 'zustand';
import { GUESS_FUNC_LEVELS, type GuessFuncLevel } from '../data/levels';
import { MathEngine } from '../engine/MathEngine';

interface GuessFuncState {
  currentLevelIndex: number;
  level: GuessFuncLevel | null;
  expression: string;
  params: Record<string, number>;
  similarity: number;
  isSuccess: boolean;
  
  // Actions
  loadLevel: (index: number) => void;
  nextLevel: () => void;
  setExpression: (expr: string) => void;
  setParam: (key: string, value: number) => void;
  calculateSimilarity: () => void;
  reset: () => void;
}

const SIMILARITY_MAX = 100;
const DOMAIN_MIN = -10;
const DOMAIN_MAX = 10;
const DOMAIN_STEPS = 200;

export const useGuessFuncStore = create<GuessFuncState>((set, get) => ({
  currentLevelIndex: 0,
  level: null,
  expression: '',
  params: {},
  similarity: 0,
  isSuccess: false,

  loadLevel: (index) => {
    if (index >= GUESS_FUNC_LEVELS.length || index < 0) return;
    const level = GUESS_FUNC_LEVELS[index];
    set({
      currentLevelIndex: index,
      level,
      expression: level.initialExpression,
      params: { ...level.initialParams },
      similarity: 0,
      isSuccess: false,
    });
    get().calculateSimilarity();
  },

  nextLevel: () => {
    const nextIdx = get().currentLevelIndex + 1;
    if (nextIdx < GUESS_FUNC_LEVELS.length) {
      get().loadLevel(nextIdx);
    }
  },

  setExpression: (expr) => {
    set({ expression: expr });
    get().calculateSimilarity();
  },

  setParam: (key, value) => {
    set((state) => ({ params: { ...state.params, [key]: value } }));
    get().calculateSimilarity();
  },

  calculateSimilarity: () => {
    const { expression, params, level } = get();
    if (!level) return;

    const currentFn = MathEngine.compileFunction(expression, params);
    const targetFn = MathEngine.compileFunction(level.targetExpression, level.targetParams);

    const mse = MathEngine.calculateMSE(currentFn, targetFn, DOMAIN_MIN, DOMAIN_MAX, DOMAIN_STEPS);
    
    // Map MSE to a percentage similarity (rough heuristic for UX)
    // If mse is 0, it's 100%. If mse is large, it approaches 0%.
    const similarity = Math.max(0, Math.min(SIMILARITY_MAX, SIMILARITY_MAX / (1 + mse)));
    
    // Success if MSE is within tolerance
    const isSuccess = mse <= level.tolerance;

    set({ similarity, isSuccess });
  },

  reset: () => set({
    currentLevelIndex: 0,
    level: null,
    expression: '',
    params: {},
    similarity: 0,
    isSuccess: false,
  })
}));
