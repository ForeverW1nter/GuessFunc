import { create } from 'zustand';
import type { StoryJSON, RouteData, ChapterData, LevelData } from '../types/story';

// Vite Glob Import to load all JSON files in the data directory
const dataFiles = import.meta.glob('../assets/data/*.json', { eager: true });

// Combine all route arrays from multiple JSON files into one StoryJSON object
const combinedRoutes: RouteData[] = [];

// Ensure charmYouTomorrow.json is placed first so it becomes the default route
const defaultRoutePath = Object.keys(dataFiles).find(p => p.includes('charmYouTomorrow.json'));
if (defaultRoutePath) {
  const module = dataFiles[defaultRoutePath] as { routes?: RouteData[] };
  if (module.routes && Array.isArray(module.routes)) {
    combinedRoutes.push(...module.routes);
  }
}

for (const path in dataFiles) {
  if (path === defaultRoutePath) continue;
  const module = dataFiles[path] as { routes?: RouteData[] };
  if (module.routes && Array.isArray(module.routes)) {
    combinedRoutes.push(...module.routes);
  }
}

const combinedStoryData: StoryJSON = {
  routes: combinedRoutes.filter(route => route.id !== 'charmYouTomorrow' && route.id !== 'poemOfTheBorder')
};

interface StoryState {
  storyJSON: StoryJSON;
  currentRouteId: string | null;
  
  // Actions
  setRoute: (routeId: string) => void;
  setModRoutes: (routes: RouteData[]) => void;
  getRoute: (routeId: string) => RouteData | undefined;
  getChapter: (routeId: string, chapterId: string) => ChapterData | undefined;
  getLevel: (routeId: string, chapterId: string, levelId: string) => LevelData | undefined;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  storyJSON: combinedStoryData,
  currentRouteId: null,

  setRoute: (routeId: string) => set({ currentRouteId: routeId }),
  
  setModRoutes: (modRoutes: RouteData[]) => set((state) => {
    // 过滤掉原有的 mod 路由，保留原生路由，然后再追加新的 mod 路由
    const nativeRoutes = state.storyJSON.routes.filter(r => !r.modId);
    return {
      storyJSON: {
        ...state.storyJSON,
        routes: [...nativeRoutes, ...modRoutes]
      }
    };
  }),

  getRoute: (routeId: string) => {
    return get().storyJSON.routes.find(r => r.id === routeId);
  },

  getChapter: (routeId: string, chapterId: string) => {
    const route = get().getRoute(routeId);
    return route?.chapters.find(c => c.id === chapterId);
  },

  getLevel: (routeId: string, chapterId: string, levelId: string) => {
    const chapter = get().getChapter(routeId, chapterId);
    return chapter?.levels.find(l => l.id === levelId);
  }
}));
