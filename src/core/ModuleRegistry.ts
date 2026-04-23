import { RouteObject } from 'react-router-dom';

export interface GameModule {
  id: string;
  name: string;
  description: string;
  version: string;
  coreApiVersion: string;
  entryRoute: string; // The base path of the module (e.g. /guessfunc)
  routes: RouteObject[]; // The routes to be dynamically appended
  init?: () => Promise<void> | void; // Lifecycle method on load
  i18n?: Record<string, Record<string, string>>; // Translations namespaced by id
}

class ModuleRegistryClass {
  private modules = new Map<string, GameModule>();
  private routeListeners: (() => void)[] = [];

  /**
   * Register a new game module. Ensures compatibility and updates dynamic routes.
   */
  async register(mod: GameModule) {
    if (this.modules.has(mod.id)) {
      console.warn(`[ModuleRegistry] Module ${mod.id} is already registered.`);
      return;
    }

    // Call init lifecycle method if present
    if (mod.init) {
      await mod.init();
    }

    this.modules.set(mod.id, mod);
    this.notifyRouteListeners();
    console.log(`[ModuleRegistry] Module ${mod.id} registered successfully.`);
  }

  getModules() {
    return Array.from(this.modules.values());
  }

  getModuleRoutes(): RouteObject[] {
    const allRoutes: RouteObject[] = [];
    this.modules.forEach(mod => {
      allRoutes.push(...mod.routes);
    });
    return allRoutes;
  }

  subscribeToRoutes(listener: () => void) {
    this.routeListeners.push(listener);
    return () => {
      this.routeListeners = this.routeListeners.filter(l => l !== listener);
    };
  }

  private notifyRouteListeners() {
    this.routeListeners.forEach(listener => listener());
  }
}

export const ModuleRegistry = new ModuleRegistryClass();
