import type { ReactNode } from 'react';

/**
 * The unified event bus interface for communication between 
 * the Terminal (host) and the Game Engine (guest).
 */
export interface IEngineEventBus {
  emit(event: string, payload?: unknown): void;
  on(event: string, callback: (payload?: unknown) => void): () => void;
}

/**
 * The standard protocol that all Game Engines (e.g., MathEngine, GateEngine) 
 * must implement to be hosted inside the Universal Creator Terminal.
 */
export interface IGameProtocol {
  /**
   * Unique identifier for the engine (e.g., 'guessfunc', 'gatefunc')
   */
  readonly id: string;
  
  /**
   * Display name of the engine
   */
  readonly name: string;
  
  /**
   * Version of the engine implementation
   */
  readonly version: string;

  /**
   * Initialize the engine with the provided event bus.
   * This is called once when the engine is loaded.
   */
  init(eventBus: IEngineEventBus): Promise<void>;

  /**
   * Returns the main canvas/renderer component to be mounted in the left panel.
   */
  getRenderer(): ReactNode;

  /**
   * Returns the control panel component to be mounted in the right panel.
   */
  getControlPanel(): ReactNode;

  /**
   * Cleanup resources when the engine is unmounted.
   */
  destroy(): void;
}
