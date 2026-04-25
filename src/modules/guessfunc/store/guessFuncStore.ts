import { create } from 'zustand';
import { MathEngine } from '../engine/MathEngine';

export interface PlayerFunction {
  id: string; // e.g. "f", "g", "h"
  expression: string;
}

interface GuessFuncState {
  level: {
    targetExpression: string;
  } | null;
  // Support multiple reference functions
  functions: PlayerFunction[];
  params: Record<string, number>;
  isVerifying: boolean;
  isSuccess: boolean;
  verifyError: string | null;
  
  // Actions
  loadLevelData: (payload: { targetExpression: string; initialExpression: string; params: Record<string, number> }) => void;
  setExpression: (id: string, expr: string) => void;
  addFunction: () => void;
  removeFunction: (id: string) => void;
  setParam: (key: string, value: number) => void;
  verify: () => void;
  reset: () => void;
}

const SIMULATED_VERIFY_DELAY_MS = 400;

const getNextFunctionId = (existingFuncs: PlayerFunction[]) => {
  const ids = ['f', 'g', 'h', 'p', 'q', 'u', 'v', 'w'];
  const used = new Set(existingFuncs.map(f => f.id));
  return ids.find(id => !used.has(id)) || `f${existingFuncs.length}`;
};

export const useGuessFuncStore = create<GuessFuncState>((set, get) => ({
  level: null,
  functions: [],
  params: {},
  isVerifying: false,
  isSuccess: false,
  verifyError: null,

  loadLevelData: (payload) => {
    set({
      level: {
        targetExpression: payload.targetExpression
      },
      functions: [
        { id: 'f', expression: payload.initialExpression }
      ],
      params: { ...payload.params },
      isVerifying: false,
      isSuccess: false,
      verifyError: null,
    });
  },

  setExpression: (id, expr) => {
    set((state) => ({
      functions: state.functions.map(f => f.id === id ? { ...f, expression: expr } : f),
      verifyError: null,
      isSuccess: false
    }));
  },

  addFunction: () => {
    set((state) => {
      const nextId = getNextFunctionId(state.functions);
      return {
        functions: [...state.functions, { id: nextId, expression: '' }],
        verifyError: null,
        isSuccess: false
      };
    });
  },

  removeFunction: (id) => {
    set((state) => {
      // Don't remove the last function, or specifically 'f' if it's the only one
      if (state.functions.length <= 1) return state;
      return {
        functions: state.functions.filter(f => f.id !== id),
        verifyError: null,
        isSuccess: false
      };
    });
  },

  setParam: (key, value) => {
    set((state) => ({ params: { ...state.params, [key]: value } }));
  },

  verify: () => {
    const { functions, params, level } = get();
    if (!level || functions.length === 0) return;

    set({ isVerifying: true, verifyError: null });

    setTimeout(() => {
      const paramKeys = Object.keys(params);
      
      try {
        // The main expression is always the first one, or 'f'
        // Others are reference functions
        const mainFunc = functions.find(f => f.id === 'f') || functions[0];
        const refFuncs = functions.filter(f => f.id !== mainFunc.id);

        const isMatch = MathEngine.verifyEquivalenceWithRefs(
          mainFunc.expression, 
          level.targetExpression, 
          refFuncs,
          paramKeys
        );
        
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
    functions: [],
    params: {},
    isVerifying: false,
    isSuccess: false,
    verifyError: null,
  })
}));
