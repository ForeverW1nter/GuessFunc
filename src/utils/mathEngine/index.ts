export * from './types';
export * from './utils';

// We now export async wrappers for evaluateEquivalence and generateFunctionByDifficulty
// to ensure the heavy @cortex-js/compute-engine is loaded in a Web Worker.

import type { ValidationResult } from './types';
import type { GeneratedFunction, GeneratorOptions } from './generator';

// Type-safe worker message types
interface WorkerMessage {
  id: number;
  type: 'EVALUATE' | 'GENERATE';
  payload: EvaluatePayload | GeneratePayload;
}

interface EvaluatePayload {
  targetLatex: string;
  playerLatex: string;
  params: Record<string, number>;
}

interface GeneratePayload {
  options: number | GeneratorOptions;
  legacyWithParams: boolean;
}

interface WorkerResponse {
  id: number;
  result?: ValidationResult | GeneratedFunction;
  error?: string;
}

type RequestHandler = {
  resolve: (value: ValidationResult | GeneratedFunction) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let messageIdCounter = 0;
const pendingRequests = new Map<number, RequestHandler>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./mathEngine.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, result, error } = e.data;
      const req = pendingRequests.get(id);
      if (req) {
        if (error) req.reject(new Error(error));
        else req.resolve(result as ValidationResult | GeneratedFunction);
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
  const payload: EvaluatePayload = { targetLatex, playerLatex, params };
  return dispatchToWorker('EVALUATE', payload) as Promise<ValidationResult>;
}

export async function generateFunctionByDifficulty(
  optionsOrDifficulty: number | GeneratorOptions,
  legacyWithParams: boolean = false
): Promise<GeneratedFunction> {
  const payload: GeneratePayload = { options: optionsOrDifficulty, legacyWithParams };
  return dispatchToWorker('GENERATE', payload) as Promise<GeneratedFunction>;
}

function dispatchToWorker(type: WorkerMessage['type'], payload: EvaluatePayload | GeneratePayload): Promise<ValidationResult | GeneratedFunction> {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    pendingRequests.set(id, { resolve: resolve as (value: ValidationResult | GeneratedFunction) => void, reject });
    getWorker().postMessage({ id, type, payload });
  });
}

