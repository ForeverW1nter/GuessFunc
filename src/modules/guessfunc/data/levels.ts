export interface GuessFuncLevel {
  id: string;
  titleKey: string;
  descKey: string;
  targetExpression: string; // The mathematical formula to guess (e.g. "sin(x) + a")
  initialExpression: string; // The starting input for the player
  params: Record<string, number>; // The initial values for the sliders
  passSimilarity: number; // Required similarity percentage to pass (e.g. 99 for exact, 90 for approximate)
}

export const GUESS_FUNC_LEVELS: GuessFuncLevel[] = [
  {
    id: "gf-1",
    titleKey: "guessFunc.levels.1.title",
    descKey: "guessFunc.levels.1.desc",
    targetExpression: "sin(x) + a",
    initialExpression: "x",
    params: { a: 2 },
    passSimilarity: 99,
  },
  {
    id: "gf-2",
    titleKey: "guessFunc.levels.2.title",
    descKey: "guessFunc.levels.2.desc",
    targetExpression: "a * x^2 + b",
    initialExpression: "x^2",
    params: { a: 1, b: 0 },
    passSimilarity: 99,
  },
  {
    id: "gf-3",
    titleKey: "guessFunc.levels.3.title",
    descKey: "guessFunc.levels.3.desc",
    targetExpression: "a * sin(b * x)",
    initialExpression: "sin(x)",
    params: { a: 1, b: 1 },
    passSimilarity: 99,
  }
];