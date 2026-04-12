import { evaluateEquivalence } from './evaluate';
import { generateFunctionByDifficulty } from './generator';

self.onmessage = (e: MessageEvent) => {
  const { id, type, payload } = e.data;
  
  try {
    if (type === 'EVALUATE') {
      const result = evaluateEquivalence(payload.targetLatex, payload.playerLatex, payload.params);
      self.postMessage({ id, result });
    } else if (type === 'GENERATE') {
      const result = generateFunctionByDifficulty(payload.options, payload.legacyWithParams);
      self.postMessage({ id, result });
    }
  } catch (error: unknown) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
