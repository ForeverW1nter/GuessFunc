import { useMemo } from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import 'mafs/core.css';
import { MathEngine } from '../engine/MathEngine';
import type { PlayerFunction } from '../store/guessFuncStore';

export interface GraphRendererProps {
  /** The list of player defined functions */
  functions?: PlayerFunction[];
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

// Color palette for reference functions to distinguish them visually
const REF_COLORS = [
  Theme.indigo,
  Theme.blue,
  Theme.orange,
  Theme.yellow,
  Theme.pink
];

export const GraphRenderer = ({
  functions = [],
  parameters = {},
  targetExpression,
  targetParameters = {},
  lineColor = Theme.green,
  height = DEFAULT_HEIGHT,
  viewBox = { x: [PARAM_MIN, PARAM_MAX], y: [PARAM_MIN, PARAM_MAX] },
}: GraphRendererProps) => {
  
  // Compile all player functions
  const plottedFunctions = useMemo(() => {
    // Separate main function 'f' from references
    const mainFunc = functions.find(f => f.id === 'f') || functions[0];
    if (!mainFunc) return [];

    const refFuncs = functions.filter(f => f.id !== mainFunc.id);
    
    return functions.map((func, index) => {
      // For each function, we must substitute references before compiling
      // Note: We substitute using other functions, avoiding self-reference for simplicity here
      const otherRefs = functions.filter(f => f.id !== func.id);
      const substituted = MathEngine.substituteReferencesForRender(func.expression, otherRefs);
      
      return {
        id: func.id,
        isMain: func.id === mainFunc.id,
        fn: MathEngine.compileFunction(substituted, parameters),
        color: func.id === mainFunc.id ? lineColor : REF_COLORS[index % REF_COLORS.length]
      };
    });
  }, [functions, parameters, lineColor]);

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
        
        {/* Draw reference functions (dimmed) */}
        {plottedFunctions.filter(pf => !pf.isMain).map((pf) => (
          <Plot.OfX key={pf.id} y={pf.fn} color={pf.color} weight={2} opacity={0.6} />
        ))}

        {/* Draw main function (prominent) */}
        {plottedFunctions.filter(pf => pf.isMain).map((pf) => (
          <Plot.OfX key={pf.id} y={pf.fn} color={pf.color} weight={3} />
        ))}
      </Mafs>
    </div>
  );
};
