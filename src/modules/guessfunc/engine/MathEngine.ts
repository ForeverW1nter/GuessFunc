import { compile, evaluate } from 'mathjs';

/**
 * A safe and controlled wrapper around mathjs.
 * Encapsulated specifically for the GuessFunc module to avoid eval() risks.
 */
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
}
