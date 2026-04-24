import { compile, evaluate } from 'mathjs';

/**
 * A safe and controlled wrapper around mathjs.
 * Encapsulated specifically for the GuessFunc module to avoid eval() risks.
 */
const DEFAULT_DOMAIN_MIN = -10;
const DEFAULT_DOMAIN_MAX = 10;
const DEFAULT_STEPS = 100;
const INVALID_POINT_PENALTY = 100;

export class MathEngine {
  /**
   * Evaluates a mathematical expression safely with given parameters.
   * @param expression The mathematical string (e.g., 'sin(x) + a')
   * @param scope Variables map (e.g., { x: 1, a: 2 })
   * @returns The numeric result or NaN if invalid
   */
  static evaluate(expression: string, scope: Record<string, number>): number {
    if (!expression || expression.trim() === '') return NaN;
    try {
      const result = evaluate(expression, scope);
      return typeof result === 'number' ? result : NaN;
    } catch {
      return NaN;
    }
  }

  /**
   * Compiles an expression into an optimized executable function.
   * Best for rendering where the same function is called hundreds of times (e.g., drawing).
   * @param expression The mathematical string (e.g., 'sin(x) + a')
   * @param parameters Fixed parameters (e.g., { a: 2 })
   * @returns A fast JS function (x: number) => number
   */
  static compileFunction(
    expression: string,
    parameters: Record<string, number> = {}
  ): (x: number) => number {
    if (!expression || expression.trim() === '') {
      return () => NaN;
    }

    try {
      const compiled = compile(expression);
      return (x: number) => {
        try {
          const result = compiled.evaluate({ ...parameters, x });
          return typeof result === 'number' ? result : NaN;
        } catch {
          return NaN;
        }
      };
    } catch {
      // Return a dummy function that always produces NaN if compilation fails
      return () => NaN;
    }
  }

  /**
   * Calculates the Mean Squared Error (MSE) between two compiled functions over a domain.
   */
  static calculateMSE(
    f1: (x: number) => number,
    f2: (x: number) => number,
    domainMin: number = DEFAULT_DOMAIN_MIN,
    domainMax: number = DEFAULT_DOMAIN_MAX,
    steps: number = DEFAULT_STEPS
  ): number {
    let sumSquaredError = 0;
    let validPoints = 0;
    const stepSize = (domainMax - domainMin) / steps;

    for (let x = domainMin; x <= domainMax; x += stepSize) {
      const y1 = f1(x);
      const y2 = f2(x);
      
      // If both are valid numbers, calculate error
      if (!isNaN(y1) && !isNaN(y2) && isFinite(y1) && isFinite(y2)) {
        const diff = y1 - y2;
        sumSquaredError += diff * diff;
        validPoints++;
      } else if (isNaN(y1) !== isNaN(y2)) {
        // Penalty if one is undefined and the other is not
        sumSquaredError += INVALID_POINT_PENALTY;
        validPoints++;
      }
    }

    if (validPoints === 0) return Infinity; // Cannot compare
    return sumSquaredError / validPoints;
  }
}
