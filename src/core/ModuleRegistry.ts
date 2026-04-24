import type { RouteObject } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

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
  isRoot?: boolean; // Flag to indicate if this module should be the index route
  // Hub Integration Metadata
  icon?: LucideIcon;
  color?: string; // e.g. "var(--accent-guessfunc)"
  titleKey?: string; // i18n key for the title
  subtitleKey?: string; // i18n key for the subtitle
  descKey?: string; // i18n key for the description
}

class ModuleRegistryClass {
  private modules = new Map<string, GameModule>();
  private registering = new Set<string>();
  private routeListeners: (() => void)[] = [];

  /**
   * Register a new game module. Ensures compatibility and updates dynamic routes.
   */
  async register(mod: GameModule) {
    if (this.modules.has(mod.id) || this.registering.has(mod.id)) {
      console.warn(
        `[ModuleRegistry] Module ${mod.id} is already registered or registering.`,
      );
      return;
    }

    this.registering.add(mod.id);

    try {
      // Call init lifecycle method if present
      if (mod.init) {
        await mod.init();
      }

      this.modules.set(mod.id, mod);
      this.notifyRouteListeners();
      console.log(`[ModuleRegistry] Module ${mod.id} registered successfully.`);
    } finally {
      this.registering.delete(mod.id);
    }
  }

  getModules() {
    return Array.from(this.modules.values());
  }

  getModuleRoutes(): RouteObject[] {
    const allRoutes: RouteObject[] = [];
    const rootRoutes: RouteObject[] = [];

    this.modules.forEach((mod) => {
      if (mod.isRoot) {
        rootRoutes.push(...mod.routes);
      } else {
        allRoutes.push(...mod.routes);
      }
    });
    
    // Root routes should generally be placed at the top so that the index route matches properly
    return [...rootRoutes, ...allRoutes];
  }

  subscribeToRoutes(listener: () => void) {
    this.routeListeners.push(listener);
    return () => {
      this.routeListeners = this.routeListeners.filter((l) => l !== listener);
    };
  }

  private notifyRouteListeners() {
    this.routeListeners.forEach((listener) => listener());
  }
}

export const ModuleRegistry = new ModuleRegistryClass();
