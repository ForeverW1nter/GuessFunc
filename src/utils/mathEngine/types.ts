export interface ValidationResult {
  isMatch: boolean;
  reason?: string;
  method?: 'ast' | 'simplify' | 'sampling';
}

export interface GeneratedFunction {
  target: string;
  params: Record<string, number>;
}

export type FunctionType = 'polynomial' | 'absolute' | 'rational' | 'radical' | 'trigonometric' | 'inverse_trigonometric' | 'hyperbolic' | 'inverse_hyperbolic' | 'exponential';

export interface GeneratorOptions {
  targetDifficulty: number;
  withParams?: boolean;
  allowedTypes?: FunctionType[];
}
