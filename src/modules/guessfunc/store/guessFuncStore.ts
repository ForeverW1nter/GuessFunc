import { create } from 'zustand';
import { MathEngine } from '../engine/MathEngine';

interface GuessFuncState {
  level: {
    targetExpression: string;
  } | null;
  expression: string;
  params: Record<string, number>;
  isVerifying: boolean;
  isSuccess: boolean;
  verifyError: string | null;
  
  // Actions
  loadLevelData: (payload: { targetExpression: string; initialExpression: string; params: Record<string, number> }) => void;
  setExpression: (expr: string) => void;
  setParam: (key: string, value: number) => void;
  verify: () => void;
  reset: () => void;
}

const SIMULATED_VERIFY_DELAY_MS = 400;

export const useGuessFuncStore = create<GuessFuncState>((set, get) => ({
  level: null,
  expression: '',
  params: {},
  isVerifying: false,
  isSuccess: false,
  verifyError: null,

  loadLevelData: (payload) => {
    set({
      level: {
        targetExpression: payload.targetExpression
      },
      expression: payload.initialExpression,
      params: { ...payload.params },
      isVerifying: false,
      isSuccess: false,
      verifyError: null,
    });
  },

  setExpression: (expr) => {
    set({ expression: expr, verifyError: null, isSuccess: false });
  },

  setParam: (key, value) => {
    set((state) => ({ params: { ...state.params, [key]: value } }));
  },

  verify: () => {
    const { expression, params, level } = get();
    if (!level) return;

    set({ isVerifying: true, verifyError: null });

    // In a real app, this might be a worker. Here we just simulate a tiny delay for UX.
    setTimeout(() => {
      const paramKeys = Object.keys(params);
      
      try {
        const isMatch = MathEngine.verifyEquivalence(expression, level.targetExpression, paramKeys);
        
        if (isMatch) {
          set({ isSuccess: true, isVerifying: false });
        } else {
          set({ isSuccess: false, isVerifying: false, verifyError: 'guessFunc.errors.mismatch' });
        }
      } catch (err) {
        console.warn('[GuessFunc] Verification failed:', err);
        set({ isSuccess: false, isVerifying: false, verifyError: 'guessFunc.errors.syntax' });
      }
    }, SIMULATED_VERIFY_DELAY_MS);
  },

  reset: () => set({
    level: null,
    expression: '',
    params: {},
    isVerifying: false,
    isSuccess: false,
    verifyError: null,
  })
}));
