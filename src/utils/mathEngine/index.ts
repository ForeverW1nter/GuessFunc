export * from './types';
export * from './utils';

// We now export async wrappers for evaluateEquivalence and generateFunctionByDifficulty
// to ensure the heavy @cortex-js/compute-engine is loaded in a Web Worker.

import type { ValidationResult } from './types';
import type { GeneratedFunction, GeneratorOptions } from './generator';

let worker: Worker | null = null;
let messageIdCounter = 0;
const pendingRequests = new Map<number, { resolve: (val: unknown) => void; reject: (err: unknown) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./mathEngine.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const req = pendingRequests.get(id);
      if (req) {
        if (error) req.reject(new Error(error));
        else req.resolve(result);
        pendingRequests.delete(id);
      }
    };
  }
  return worker;
}

export async function evaluateEquivalence(
  targetLatex: string, 
  playerLatex: string, 
  params: Record<string, number> = {}
): Promise<ValidationResult> {
  return dispatchToWorker('EVALUATE', { targetLatex, playerLatex, params }) as Promise<ValidationResult>;
}

export async function generateFunctionByDifficulty(
  optionsOrDifficulty: number | GeneratorOptions,
  legacyWithParams: boolean = false
): Promise<GeneratedFunction> {
  return dispatchToWorker('GENERATE', { options: optionsOrDifficulty, legacyWithParams }) as Promise<GeneratedFunction>;
}

function dispatchToWorker(type: string, payload: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ id, type, payload });
  });
}

