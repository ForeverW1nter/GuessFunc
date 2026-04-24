import { create } from 'zustand';

interface GuessFuncState {
  expression: string;
  params: Record<string, number>;
  setExpression: (expr: string) => void;
  setParam: (key: string, value: number) => void;
  reset: () => void;
}

const DEFAULT_EXPRESSION = 'a * sin(x) + b';
const DEFAULT_PARAMS = { a: 1, b: 0 };

export const useGuessFuncStore = create<GuessFuncState>((set) => ({
  expression: DEFAULT_EXPRESSION,
  params: DEFAULT_PARAMS,
  setExpression: (expr) => set({ expression: expr }),
  setParam: (key, value) => 
    set((state) => ({ params: { ...state.params, [key]: value } })),
  reset: () => set({ expression: DEFAULT_EXPRESSION, params: DEFAULT_PARAMS })
}));
