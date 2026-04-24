export interface GuessFuncLevel {
  id: string;
  titleKey: string;
  descKey: string;
  targetExpression: string;
  targetParams: Record<string, number>;
  initialExpression: string;
  initialParams: Record<string, number>;
  tolerance: number; // MSE tolerance for success
}

export const GUESS_FUNC_LEVELS: GuessFuncLevel[] = [
  {
    id: "gf-1",
    titleKey: "guessFunc.levels.1.title",
    descKey: "guessFunc.levels.1.desc",
    targetExpression: "sin(x) + a",
    targetParams: { a: 2 },
    initialExpression: "sin(x) + a",
    initialParams: { a: 0 },
    tolerance: 0.1,
  },
  {
    id: "gf-2",
    titleKey: "guessFunc.levels.2.title",
    descKey: "guessFunc.levels.2.desc",
    targetExpression: "a * x^2 + b",
    targetParams: { a: 0.5, b: -2 },
    initialExpression: "a * x^2 + b",
    initialParams: { a: 1, b: 0 },
    tolerance: 0.2,
  },
  {
    id: "gf-3",
    titleKey: "guessFunc.levels.3.title",
    descKey: "guessFunc.levels.3.desc",
    targetExpression: "a * sin(b * x)",
    targetParams: { a: 3, b: 2 },
    initialExpression: "a * sin(b * x)",
    initialParams: { a: 1, b: 1 },
    tolerance: 0.5,
  }
];