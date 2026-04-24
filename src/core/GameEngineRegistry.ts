import type { IGameProtocol } from './IGameProtocol';

export class GameEngineRegistry {
  private static engines = new Map<string, () => IGameProtocol>();

  /**
   * Register a new game engine factory.
   * This should be called by the module's initialization script.
   */
  static registerEngine(id: string, factory: () => IGameProtocol): void {
    if (this.engines.has(id)) {
      console.warn(`[GameEngineRegistry] Engine [${id}] is already registered. Overwriting.`);
    }
    this.engines.set(id, factory);
    console.log(`[GameEngineRegistry] Registered engine: ${id}`);
  }

  /**
   * Create a new instance of a registered game engine.
   */
  static createEngine(id: string): IGameProtocol {
    const factory = this.engines.get(id);
    if (!factory) {
      throw new Error(`[GameEngineRegistry] Engine [${id}] not found. Ensure it is loaded and registered.`);
    }
    return factory();
  }

  /**
   * Get all available engine IDs.
   */
  static getAvailableEngines(): string[] {
    return Array.from(this.engines.keys());
  }
}
