import { create } from 'zustand';
import { MathEngine } from '../engine/MathEngine';

interface GuessFuncState {
  level: {
    targetExpression: string;
    passSimilarity: number;
  } | null;
  expression: string;
  params: Record<string, number>;
  similarity: number;
  isSuccess: boolean;
  
  // Actions
  loadLevelData: (payload: { targetExpression: string; initialExpression: string; params: Record<string, number>; passSimilarity: number }) => void;
  setExpression: (expr: string) => void;
  setParam: (key: string, value: number) => void;
  calculateSimilarity: () => void;
  reset: () => void;
}

const SIMILARITY_MAX = 100;
const DOMAIN_MIN = -10;
const DOMAIN_MAX = 10;
const DOMAIN_STEPS = 200;
const TEST_PARAM_1 = 5;
const TEST_PARAM_2 = -5;

export const useGuessFuncStore = create<GuessFuncState>((set, get) => ({
  level: null,
  expression: '',
  params: {},
  similarity: 0,
  isSuccess: false,

  loadLevelData: (payload) => {
    set({
      level: {
        targetExpression: payload.targetExpression,
        passSimilarity: payload.passSimilarity
      },
      expression: payload.initialExpression,
      params: { ...payload.params },
      similarity: 0,
      isSuccess: false,
    });
    get().calculateSimilarity();
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

    // Calculate current similarity using current parameters
    // This allows the player to use sliders to match the curves visually
    const currentFn = MathEngine.compileFunction(expression, params);
    const targetFn = MathEngine.compileFunction(level.targetExpression, params);

    const currentMse = MathEngine.calculateMSE(currentFn, targetFn, DOMAIN_MIN, DOMAIN_MAX, DOMAIN_STEPS);
    const currentSimilarity = Math.max(0, Math.min(SIMILARITY_MAX, SIMILARITY_MAX / (1 + currentMse)));
    
    let isSuccess = false;
    
    // Only check global success if current similarity is very close to pass threshold
    if (currentSimilarity >= level.passSimilarity - 1) {
      const paramKeys = Object.keys(params);
      
      // We must verify that the user's expression is mathematically equivalent 
      // regardless of what the parameter values are (testing generalization).
      const testCases = [
        params, // Current user state
        Object.fromEntries(paramKeys.map(k => [k, 1])),
        Object.fromEntries(paramKeys.map(k => [k, -1])),
        Object.fromEntries(paramKeys.map(k => [k, TEST_PARAM_1])),
        Object.fromEntries(paramKeys.map(k => [k, TEST_PARAM_2])),
        Object.fromEntries(paramKeys.map(k => [k, Math.PI])),
      ];

      let allPass = true;
      let totalSim = 0;

      for (const tc of testCases) {
        const testF1 = MathEngine.compileFunction(expression, tc);
        const testF2 = MathEngine.compileFunction(level.targetExpression, tc);
        const mse = MathEngine.calculateMSE(testF1, testF2, DOMAIN_MIN, DOMAIN_MAX, DOMAIN_STEPS);
        const sim = Math.max(0, Math.min(SIMILARITY_MAX, SIMILARITY_MAX / (1 + mse)));
        
        totalSim += sim;
        if (sim < level.passSimilarity) {
          allPass = false;
          break; // Fail fast
        }
      }

      if (allPass && (totalSim / testCases.length) >= level.passSimilarity) {
        isSuccess = true;
      }
    }

    set({ similarity: currentSimilarity, isSuccess });
  },

  reset: () => set({
    level: null,
    expression: '',
    params: {},
    similarity: 0,
    isSuccess: false,
  })
}));
