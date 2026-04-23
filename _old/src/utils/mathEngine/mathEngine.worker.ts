import { evaluateEquivalence } from './evaluate';
import { generateFunctionByDifficulty } from './generator';
import type { ValidationResult, GeneratedFunction, GeneratorOptions } from './types';

interface WorkerMessage {
  id: number;
  type: 'EVALUATE' | 'GENERATE';
  payload: {
    targetLatex?: string;
    playerLatex?: string;
    params?: Record<string, number>;
    options?: number | GeneratorOptions;
    legacyWithParams?: boolean;
  };
}

export interface WorkerResponse {
  id: number;
  result?: ValidationResult | GeneratedFunction;
  error?: string;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'EVALUATE') {
      const result = evaluateEquivalence(payload.targetLatex!, payload.playerLatex!, payload.params || {});
      self.postMessage({ id, result });
    } else if (type === 'GENERATE') {
      const result = generateFunctionByDifficulty(payload.options!, payload.legacyWithParams);
      self.postMessage({ id, result });
    }
  } catch (error: unknown) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
