import { useMemo } from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import 'mafs/core.css';
import { MathEngine } from '../engine/MathEngine';

export interface GraphRendererProps {
  /** The mathematical expression (e.g., "sin(x) + a") */
  expression: string;
  /** Parameters to inject into the expression (e.g., { a: 1, b: 2 }) */
  parameters?: Record<string, number>;
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
export const GraphRenderer = ({
  expression,
  parameters = {},
  lineColor = Theme.indigo,
  height = 500,
  viewBox = { x: [-10, 10], y: [-10, 10] },
}: GraphRendererProps) => {
  // Compile the expression into a fast native JS function whenever it or params change
  const plottedFunction = useMemo(() => {
    return MathEngine.compileFunction(expression, parameters);
  }, [expression, parameters]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)]">
      <Mafs height={height} viewBox={viewBox} pan={true} zoom={true}>
        <Coordinates.Cartesian />
        <Plot.OfX y={plottedFunction} color={lineColor} weight={3} />
      </Mafs>
    </div>
  );
};
