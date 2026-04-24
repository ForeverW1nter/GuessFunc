import { useMemo } from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import 'mafs/core.css';
import { MathEngine } from '../engine/MathEngine';

export interface GraphRendererProps {
  /** The mathematical expression (e.g., "sin(x) + a") */
  expression: string;
  /** Parameters to inject into the expression (e.g., { a: 1, b: 2 }) */
  parameters?: Record<string, number>;
  /** The target mathematical expression to match */
  targetExpression?: string;
  /** The target parameters */
  targetParameters?: Record<string, number>;
  /** The color of the plotted function line */
  lineColor?: string;
  /** Control width/height, default is taking full container */
  height?: number;
  /** Initial coordinate bounds */
  viewBox?: { x: [number, number]; y: [number, number] };
}

/**
 * A controlled UI component that renders a mathematical function
 * using Mafs and MathEngine. Completely decoupled from external logic.
 */
const DEFAULT_HEIGHT = 500;
const PARAM_MIN = -10;
const PARAM_MAX = 10;

export const GraphRenderer = ({
  expression,
  parameters = {},
  targetExpression,
  targetParameters = {},
  lineColor = Theme.indigo,
  height = DEFAULT_HEIGHT,
  viewBox = { x: [PARAM_MIN, PARAM_MAX], y: [PARAM_MIN, PARAM_MAX] },
}: GraphRendererProps) => {
  // Compile the expression into a fast native JS function whenever it or params change
  const plottedFunction = useMemo(() => {
    return MathEngine.compileFunction(expression, parameters);
  }, [expression, parameters]);

  const targetFunction = useMemo(() => {
    if (!targetExpression) return null;
    return MathEngine.compileFunction(targetExpression, targetParameters);
  }, [targetExpression, targetParameters]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)]">
      <Mafs height={height} viewBox={viewBox} pan={true} zoom={true}>
        <Coordinates.Cartesian />
        
        {/* Draw target function first so it's behind the player's line */}
        {targetFunction && (
          <Plot.OfX y={targetFunction} color={Theme.red} style="dashed" weight={2} opacity={0.5} />
        )}
        
        <Plot.OfX y={plottedFunction} color={lineColor} weight={3} />
      </Mafs>
    </div>
  );
};
