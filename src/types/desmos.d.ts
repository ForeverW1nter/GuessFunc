// src/types/desmos.d.ts

declare namespace Desmos {
  interface CalculatorOptions {
    language?: string;
    expressions?: boolean;
    settingsMenu?: boolean;
    zoomButtons?: boolean;
    lockViewport?: boolean;
    keypad?: boolean;
    graphpaper?: boolean;
    showGrid?: boolean;
    showXAxis?: boolean;
    showYAxis?: boolean;
  }

  interface ExpressionState {
    id: string;
    latex?: string;
    type?: string;
    color?: string;
    lineStyle?: string;
    lineWidth?: number;
    hidden?: boolean;
    secret?: boolean; // If true, hides from expression list
    sliderBounds?: { min: string; max: string; step?: string };
  }

  interface Calculator {
    setExpression(state: ExpressionState): void;
    setExpressions(states: ExpressionState[]): void;
    removeExpression(state: { id: string }): void;
    getExpressions(): ExpressionState[];
    destroy(): void;
    observeEvent(eventName: string, callback: () => void): void;
    unobserveEvent(eventName: string): void;
    resize(): void;
  }

  const Colors: {
    RED: string;
    BLUE: string;
    GREEN: string;
    ORANGE: string;
    PURPLE: string;
    BLACK: string;
  };

  function GraphingCalculator(
    element: HTMLElement,
    options?: CalculatorOptions
  ): Calculator;
}

interface Window {
  Desmos: typeof Desmos;
}
