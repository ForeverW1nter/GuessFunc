import { create } from 'zustand';
import { temporal } from 'zundo';
import type { RouteData, ChapterData, LevelData, FileData } from '../../../types/story';

interface EditorState {
  storyData: { routes: RouteData[] };
  
  // Actions
  setStoryData: (data: { routes: RouteData[] }) => void;
  updateRoute: (routeIndex: number, field: keyof RouteData, value: unknown) => void;
  addRoute: (newRoute: RouteData) => void;
  deleteRoute: (routeIndex: number) => void;
  
  addChapter: (routeIndex: number, newChapter: ChapterData) => void;
  updateChapter: (routeIndex: number, chapterIndex: number, field: keyof ChapterData, value: unknown) => void;
  deleteChapter: (routeIndex: number, chapterIndex: number) => void;
  mergeChaptersById: (routeIndex: number, chaptersToMerge: ChapterData[]) => void;
  
  addLevel: (routeIndex: number, chapterIndex: number, newLevel: LevelData) => void;
  updateLevel: (routeIndex: number, chapterIndex: number, levelIndex: number, field: keyof LevelData, value: unknown) => void;
  deleteLevel: (routeIndex: number, chapterIndex: number, levelIndex: number) => void;
  
  addFile: (routeIndex: number, chapterIndex: number, newFile: FileData) => void;
  updateFile: (routeIndex: number, chapterIndex: number, fileIndex: number, field: keyof FileData, value: unknown) => void;
  deleteFile: (routeIndex: number, chapterIndex: number, fileIndex: number) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      storyData: {
        routes: [
          {
            id: 'newRoute',
            title: 'New Route',
            description: 'A new adventure',
            showToBeContinued: true,
            showInPlayInterface: true,
            modId: 'local_workspace',
            chapters: []
          }
        ]
      },
      
      setStoryData: (data) => set({ storyData: data }),
      
      updateRoute: (routeIndex, field, value) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        newRoutes[routeIndex] = { ...newRoutes[routeIndex], [field]: value };
        return { storyData: { routes: newRoutes } };
      }),
      
      addRoute: (newRoute) => set((state) => {
        return { storyData: { routes: [...state.storyData.routes, newRoute] } };
      }),
      
      deleteRoute: (routeIndex) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        newRoutes.splice(routeIndex, 1);
        if (newRoutes.length === 0) {
          newRoutes.push({
            id: 'newRoute',
            title: 'New Route',
            description: 'A new adventure',
            showToBeContinued: true,
            showInPlayInterface: true,
            modId: 'local_workspace',
            chapters: []
          });
        }
        return { storyData: { routes: newRoutes } };
      }),

      addChapter: (routeIndex, newChapter) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        route.chapters = [...route.chapters, newChapter];
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      updateChapter: (routeIndex, chapterIndex, field, value) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        chapters[chapterIndex] = { ...chapters[chapterIndex], [field]: value };
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      deleteChapter: (routeIndex, chapterIndex) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        chapters.splice(chapterIndex, 1);
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      mergeChaptersById: (routeIndex, chaptersToMerge) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const targetRoute = { ...newRoutes[routeIndex] };
        const targetChapters = [...targetRoute.chapters];

        chaptersToMerge.forEach((incomingChapter) => {
          const existingChapterIndex = targetChapters.findIndex(c => c.id === incomingChapter.id);
          if (existingChapterIndex === -1) {
            targetChapters.push(incomingChapter);
          } else {
            const existingChapter = { ...targetChapters[existingChapterIndex] };
            existingChapter.levels = [...existingChapter.levels, ...incomingChapter.levels];
            if (incomingChapter.files) {
              existingChapter.files = [...(existingChapter.files || []), ...incomingChapter.files];
            }
            targetChapters[existingChapterIndex] = existingChapter;
          }
        });

        targetRoute.chapters = targetChapters;
        newRoutes[routeIndex] = targetRoute;
        return { storyData: { routes: newRoutes } };
      }),

      addLevel: (routeIndex, chapterIndex, newLevel) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        const chapter = { ...chapters[chapterIndex] };
        chapter.levels = [...chapter.levels, newLevel];
        chapters[chapterIndex] = chapter;
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      updateLevel: (routeIndex, chapterIndex, levelIndex, field, value) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        const chapter = { ...chapters[chapterIndex] };
        const levels = [...chapter.levels];
        levels[levelIndex] = { ...levels[levelIndex], [field]: value };
        chapter.levels = levels;
        chapters[chapterIndex] = chapter;
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      deleteLevel: (routeIndex, chapterIndex, levelIndex) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        const chapter = { ...chapters[chapterIndex] };
        const levels = [...chapter.levels];
        levels.splice(levelIndex, 1);
        chapter.levels = levels;
        chapters[chapterIndex] = chapter;
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      addFile: (routeIndex, chapterIndex, newFile) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        const chapter = { ...chapters[chapterIndex] };
        chapter.files = [...(chapter.files || []), newFile];
        chapters[chapterIndex] = chapter;
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      updateFile: (routeIndex, chapterIndex, fileIndex, field, value) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        const chapter = { ...chapters[chapterIndex] };
        const files = [...(chapter.files || [])];
        files[fileIndex] = { ...files[fileIndex], [field]: value };
        chapter.files = files;
        chapters[chapterIndex] = chapter;
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      }),

      deleteFile: (routeIndex, chapterIndex, fileIndex) => set((state) => {
        const newRoutes = [...state.storyData.routes];
        const route = { ...newRoutes[routeIndex] };
        const chapters = [...route.chapters];
        const chapter = { ...chapters[chapterIndex] };
        const files = [...(chapter.files || [])];
        files.splice(fileIndex, 1);
        chapter.files = files;
        chapters[chapterIndex] = chapter;
        route.chapters = chapters;
        newRoutes[routeIndex] = route;
        return { storyData: { routes: newRoutes } };
      })
    }),
    { limit: 50 } // Max 50 undo states
  )
);
