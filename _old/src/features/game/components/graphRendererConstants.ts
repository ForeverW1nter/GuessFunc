// Desmos expression IDs used in GraphRenderer component
export const DESMOS_IDS = {
  USER_GUESS: 'user-guess',
  TARGET_PLOT: 'target-plot',
  TARGET_FUNCTION: 'target-function',
  PARAM_PREFIX: 'param-',
} as const;

// Default user input expression for initialization
export const DEFAULT_USER_GUESS = 'x';
export const DEFAULT_RELATION_GUESS = 'x^2+y^2=1';
