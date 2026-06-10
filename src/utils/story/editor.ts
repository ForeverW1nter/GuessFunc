import type { RouteData } from '../../types/story';

/**
 * 导出 StoryJSON 数据为文件
 */
export const exportStoryJSON = (storyData: { routes: RouteData[] }) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "story.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

/**
 * 处理导入的 JSON 并在本地执行合并逻辑
 * 这是一个纯函数，返回合并后的新 routes 数组
 */
export const mergeStoryData = (currentRoutes: RouteData[], importedRoutes: RouteData[]): RouteData[] => {
  const newRoutes = [...currentRoutes];
  importedRoutes.forEach((importedRoute) => {
    const existingRouteIndex = newRoutes.findIndex(r => r.id === importedRoute.id);
    if (existingRouteIndex !== -1) {
      const existingRoute = newRoutes[existingRouteIndex];
      importedRoute.chapters.forEach(importedChapter => {
        const existingChapterIndex = existingRoute.chapters.findIndex(
          c => c.id === importedChapter.id && c.title === importedChapter.title
        );
        if (existingChapterIndex !== -1) {
          const existingChapter = existingRoute.chapters[existingChapterIndex];
          existingChapter.levels = [...existingChapter.levels, ...importedChapter.levels];
          if (importedChapter.files) {
            existingChapter.files = [...(existingChapter.files || []), ...importedChapter.files];
          }
        } else {
          existingRoute.chapters.push(importedChapter);
        }
      });
    } else {
      newRoutes.push(importedRoute);
    }
  });
  return newRoutes;
};