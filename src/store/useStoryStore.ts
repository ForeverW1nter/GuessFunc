import { create } from 'zustand';
import storyData from '../assets/data/story.json';
import type { StoryJSON, RouteData, ChapterData, LevelData } from '../types/story';

interface StoryState {
  storyJSON: StoryJSON;
  currentRouteId: string | null;
  
  // Actions
  setRoute: (routeId: string) => void;
  getRoute: (routeId: string) => RouteData | undefined;
  getChapter: (routeId: string, chapterId: string) => ChapterData | undefined;
  getLevel: (routeId: string, chapterId: string, levelId: string) => LevelData | undefined;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  storyJSON: storyData as StoryJSON,
  currentRouteId: null,

  setRoute: (routeId: string) => set({ currentRouteId: routeId }),

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
