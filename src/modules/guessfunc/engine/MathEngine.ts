import { compile, evaluate } from 'mathjs';

/**
 * A safe and controlled wrapper around mathjs.
 * Encapsulated specifically for the GuessFunc module to avoid eval() risks.
 */
const DEFAULT_DOMAIN_MIN = -10;
const DEFAULT_DOMAIN_MAX = 10;
const DEFAULT_STEPS = 100;
const INVALID_POINT_PENALTY = 100;

// Verification Constants
const RANDOM_PARAM_MIN = -5;
const RANDOM_PARAM_MAX = 5;
const RANDOM_PARAM_AVOID_ZERO_THRESHOLD = 0.05;
const RANDOM_PARAM_AVOID_ZERO_FALLBACK = 0.5;

const RANDOM_TEST_POINTS_COUNT = 42;
const RANDOM_TEST_MIN = -5;
const RANDOM_TEST_MAX = 5;
const RANDOM_TEST_AVOID_ZERO_THRESHOLD = 0.01;
const RANDOM_TEST_AVOID_ZERO_FALLBACK = 0.02;

const COMPLEX_IMAGINARY_TOLERANCE = 1e-10;
const DOMAIN_MISMATCH_TOLERANCE = 6;
const ERROR_TOLERANCE = 1e-5;
const DISCRETE_JUMP_EPSILON = 1e-12;
const MIN_MATCH_COUNT_REQUIRED = 15;
const HIGH_MATCH_COUNT_THRESHOLD = 35;
const HIGH_MATCH_MISMATCH_TOLERANCE = 2;

// Base points for testing
const BASE_TEST_POINTS = [
  -4.12, // eslint-disable-line @typescript-eslint/no-magic-numbers
  -1, 
  -0.5, // eslint-disable-line @typescript-eslint/no-magic-numbers
  0.1, // eslint-disable-line @typescript-eslint/no-magic-numbers
  0.5, 
  1, 
  2.5, // eslint-disable-line @typescript-eslint/no-magic-numbers
  4.12 // eslint-disable-line @typescript-eslint/no-magic-numbers
];

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
   * Generates a random number in range, avoiding a small threshold around 0.
   */
  private static getRandomValue(min: number, max: number, avoidZeroThreshold: number, avoidZeroFallback: number): number {
    // eslint-disable-next-line sonarjs/pseudo-random
    let val = (Math.random() * (max - min)) + min;
    if (Math.abs(val) < avoidZeroThreshold) {
      val = avoidZeroFallback;
    }
    return val;
  }

  /**
   * Generates randomized parameters for testing.
   */
  private static generateRandomParams(paramKeys: string[]): Record<string, number> {
    const randomParams: Record<string, number> = {};
    for (const key of paramKeys) {
      randomParams[key] = this.getRandomValue(
        RANDOM_PARAM_MIN, 
        RANDOM_PARAM_MAX, 
        RANDOM_PARAM_AVOID_ZERO_THRESHOLD, 
        RANDOM_PARAM_AVOID_ZERO_FALLBACK
      );
    }
    return randomParams;
  }

  /**
   * Generates test points (base points + random points).
   */
  private static generateTestPoints(): number[] {
    const points = [...BASE_TEST_POINTS];
    for (let i = 0; i < RANDOM_TEST_POINTS_COUNT; i++) {
      points.push(this.getRandomValue(
        RANDOM_TEST_MIN,
        RANDOM_TEST_MAX,
        RANDOM_TEST_AVOID_ZERO_THRESHOLD,
        RANDOM_TEST_AVOID_ZERO_FALLBACK
      ));
    }
    return points;
  }

  /**
   * Cleans complex objects returned by Math.js to real numbers if the imaginary part is negligible.
   */
  private static extractReal(val: unknown): number {
    if (val && typeof val === 'object' && 're' in val) {
      const complexVal = val as { re: number; im: number };
      return Math.abs(complexVal.im) < COMPLEX_IMAGINARY_TOLERANCE ? complexVal.re : NaN;
    }
    return typeof val === 'number' ? val : NaN;
  }

  private static processTestPoint(
    compiledExp: ReturnType<typeof compile>,
    compiledTarget: ReturnType<typeof compile>,
    randomParams: Record<string, number>,
    x: number,
    state: { matchCount: number; mismatchCount: number; domainMismatchCount: number }
  ): boolean {
    const scope = { ...randomParams, x };
    let yExp, yTarget;
    try {
      yExp = this.extractReal(compiledExp.evaluate(scope));
      yTarget = this.extractReal(compiledTarget.evaluate(scope));
    } catch {
      yExp = NaN;
      yTarget = NaN;
    }

    const isExpValid = !isNaN(yExp) && isFinite(yExp);
    const isTargetValid = !isNaN(yTarget) && isFinite(yTarget);

    if (!isExpValid && !isTargetValid) return true; // Both undefined, fine, continue

    if (isExpValid !== isTargetValid) {
      state.domainMismatchCount++;
      return state.domainMismatchCount <= DOMAIN_MISMATCH_TOLERANCE;
    }

    const diff = Math.abs(yExp - yTarget);
    if (diff < ERROR_TOLERANCE || (Math.abs(yTarget) > 1 && diff / Math.abs(yTarget) < ERROR_TOLERANCE)) {
      state.matchCount++;
    } else {
      if (this.checkDiscreteJump(compiledExp, compiledTarget, randomParams, x)) {
        state.matchCount++;
      } else {
        state.mismatchCount++;
      }
    }
    return true; // continue processing
  }

  /**
   * Mathematically verifies if two expressions are equivalent across arbitrary parameters.
   * Uses Monte Carlo numerical sampling similar to the old evaluate.ts rules.
   */
  static verifyEquivalence(
    expression: string,
    targetExpression: string,
    paramKeys: string[] = []
  ): boolean {
    if (!expression || !targetExpression) return false;

    let compiledExp, compiledTarget;
    try {
      compiledExp = compile(expression);
      compiledTarget = compile(targetExpression);
    } catch {
      return false; // Syntax error in player expression
    }

    const randomParams = this.generateRandomParams(paramKeys);
    const testPoints = this.generateTestPoints();

    const state = { matchCount: 0, mismatchCount: 0, domainMismatchCount: 0 };

    for (const x of testPoints) {
      if (!this.processTestPoint(compiledExp, compiledTarget, randomParams, x, state)) {
        return false;
      }
    }

    return state.matchCount >= MIN_MATCH_COUNT_REQUIRED && 
           state.mismatchCount <= (state.matchCount > HIGH_MATCH_COUNT_THRESHOLD ? HIGH_MATCH_MISMATCH_TOLERANCE : 0);
  }

  private static checkDiscreteJump(
    compiledExp: ReturnType<typeof compile>,
    compiledTarget: ReturnType<typeof compile>,
    randomParams: Record<string, number>,
    x: number
  ): boolean {
    try {
      const scopePlus = { ...randomParams, x: x + DISCRETE_JUMP_EPSILON };
      const scopeMinus = { ...randomParams, x: x - DISCRETE_JUMP_EPSILON };
      const yExpPlus = this.extractReal(compiledExp.evaluate(scopePlus));
      const yExpMinus = this.extractReal(compiledExp.evaluate(scopeMinus));
      const yTargetPlus = this.extractReal(compiledTarget.evaluate(scopePlus));
      const yTargetMinus = this.extractReal(compiledTarget.evaluate(scopeMinus));

      return (
        Math.abs(yExpPlus - yTargetPlus) < ERROR_TOLERANCE ||
        Math.abs(yExpMinus - yTargetMinus) < ERROR_TOLERANCE ||
        Math.abs(yExpPlus - yTargetMinus) < ERROR_TOLERANCE ||
        Math.abs(yExpMinus - yTargetPlus) < ERROR_TOLERANCE
      );
    } catch {
      return false;
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
