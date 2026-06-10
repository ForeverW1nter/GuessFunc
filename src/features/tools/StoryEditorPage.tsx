import React, { useState, useEffect, useRef } from 'react';
import type { RouteData, FileData, LevelData, ChapterData } from '../../types/story';
import { useTranslation } from 'react-i18next';
import { LevelEditor } from './components/LevelEditor';
import { FileEditor } from './components/FileEditor';
import { Sidebar } from './components/Sidebar';
import { ChapterEditorView } from './components/ChapterEditorView';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { useUIStore } from '../../store/useUIStore';
import { exportStoryJSON, mergeStoryData } from '../../utils/story/editor';

interface GlobalViewState {
  routeIndex: number;
  chapterIndex: number | null;
}

interface ChapterState {
  mode: 'chapter' | 'level' | 'file';
  levelIndex: number | null;
  fileIndex: number | null;
}

export const StoryEditorPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [activeApp, setActiveApp] = useState<'story-editor' | 'level-tester'>('story-editor');
  
  const [storyData, setStoryData] = useState<{ routes: RouteData[] }>(() => {
    const cachedData = localStorage.getItem('storyEditorData');
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        console.error("Failed to parse cached story data", e);
      }
    }
    return {
      routes: [
        {
          id: 'newRoute',
          title: t('tools.storyEditor.newRoute', 'New Route'),
          description: t('tools.storyEditor.newRouteDesc', 'Route description...'),
          showToBeContinued: true,
          chapters: []
        }
      ]
    };
  });

  const [viewState, setViewState] = useState<GlobalViewState>({
    routeIndex: 0,
    chapterIndex: null,
  });

  // Maintain state per chapter to preserve opened file/level
  const [chapterStates, setChapterStates] = useState<Record<string, ChapterState>>({});
  const scrollPositions = useRef<Record<string, number>>({});

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isBatchGeneratorOpen, setIsBatchGeneratorOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('storyEditorData', JSON.stringify(storyData));
  }, [storyData]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeRoute = storyData.routes[viewState.routeIndex];
  const activeChapter = viewState.chapterIndex !== null ? activeRoute.chapters[viewState.chapterIndex] : null;
  const chapterId = activeChapter?.id || '';

  const currentChapterState = chapterId 
    ? (chapterStates[chapterId] || { mode: 'chapter', levelIndex: null, fileIndex: null }) 
    : null;

  const setChapterState = (newState: Partial<ChapterState>) => {
    if (!chapterId) return;
    setChapterStates(prev => ({
      ...prev,
      [chapterId]: {
        ...(prev[chapterId] || { mode: 'chapter', levelIndex: null, fileIndex: null }),
        ...newState
      }
    }));
  };

  const activeLevel = (activeChapter && currentChapterState?.levelIndex !== null && currentChapterState?.levelIndex !== undefined) 
    ? activeChapter.levels[currentChapterState.levelIndex] : null;
  const activeFile = (activeChapter && currentChapterState?.fileIndex !== null && currentChapterState?.fileIndex !== undefined) 
    ? activeChapter.files?.[currentChapterState.fileIndex] : null;

  const handleExport = () => {
    exportStoryJSON(storyData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          
          useUIStore.getState().openDialog({
            type: 'confirm',
            message: t('tools.storyEditor.confirmMerge', 'Do you want to merge the imported data with the existing story? Cancel will overwrite it.'),
            onConfirm: () => {
              const newRoutes = mergeStoryData(storyData.routes, json.routes);
              setStoryData({ ...storyData, routes: newRoutes });
            },
            onCancel: () => {
              setStoryData(json);
              setViewState({ routeIndex: 0, chapterIndex: null });
            }
          });
        } catch (err: unknown) {
          useUIStore.getState().openDialog({ 
            type: 'alert', 
            message: t('tools.storyEditor.parseError', 'Failed to parse JSON file') 
          });
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const addRoute = () => {
    const newRoutes = [...storyData.routes];
    const newRouteId = `route_${newRoutes.length + 1}`;
    newRoutes.push({
      id: newRouteId,
      title: t('tools.storyEditor.newRoute', 'New Route'),
      description: t('tools.storyEditor.newRouteDesc', 'Route description...'),
      showToBeContinued: true,
      chapters: []
    });
    setStoryData({ ...storyData, routes: newRoutes });
    setViewState({ routeIndex: newRoutes.length - 1, chapterIndex: null });
  };

  const addChapter = () => {
    const newRoutes = [...storyData.routes];
    const newChapterId = `ch${newRoutes[viewState.routeIndex].chapters.length}`;
    newRoutes[viewState.routeIndex].chapters.push({
      id: newChapterId,
      title: t('tools.storyEditor.newChapterTitle', { id: newChapterId, defaultValue: `Chapter ${newChapterId}` }),
      levels: [],
      files: []
    });
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const handleGenerateChapters = (generatedChapters: ChapterData[]) => {
    const newRoutes = [...storyData.routes];
    const targetRoute = newRoutes[viewState.routeIndex];
    
    generatedChapters.forEach((generatedChapter: ChapterData) => {
      const existingChapterIndex = targetRoute.chapters.findIndex(
        (c: ChapterData) => c.id === generatedChapter.id && c.title === generatedChapter.title
      );
      if (existingChapterIndex !== -1) {
        targetRoute.chapters[existingChapterIndex].levels.push(...generatedChapter.levels);
      } else {
        targetRoute.chapters.push(generatedChapter);
      }
    });
    
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const addLevel = () => {
    if (viewState.chapterIndex === null) return;
    const newRoutes = [...storyData.routes];
    const chapter = newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex];
    const newLevelId = `${chapter.levels.length + 1}`;
    chapter.levels.push({
      id: newLevelId,
      title: t('tools.storyEditor.newLevel', { id: newLevelId, defaultValue: `Level ${newLevelId}` }),
      targetFunction: 'x',
      params: null,
      domain: null,
      type: 'normal',
      unlockConditions: null,
      tip: ''
    });
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const addFile = () => {
    if (viewState.chapterIndex === null) return;
    const newRoutes = [...storyData.routes];
    const chapter = newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex];
    const newFileId = `f${chapter.files?.length ? chapter.files.length + 1 : 1}`;
    
    if (!chapter.files) chapter.files = [];
    
    chapter.files.push({
      id: newFileId,
      title: t('tools.storyEditor.newFile', 'New File'),
      extension: 'md',
      content: t('tools.storyEditor.fileContent', 'File content...'),
      unlockConditions: []
    });
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const updateRoute = (field: keyof RouteData, value: unknown) => {
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex][field] = value as never;
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const updateChapter = (field: keyof ChapterData, value: unknown) => {
    if (viewState.chapterIndex === null) return;
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex][field] = value as never;
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const updateLevelData = (field: keyof LevelData, value: unknown) => {
    if (viewState.chapterIndex === null || currentChapterState?.levelIndex == null) return;
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex].levels[currentChapterState.levelIndex][field] = value as never;
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const updateFileData = (field: keyof FileData, value: unknown) => {
    if (viewState.chapterIndex === null || currentChapterState?.fileIndex == null) return;
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex].files![currentChapterState.fileIndex][field] = value as never;
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const deleteRoute = (index: number) => {
    const newRoutes = [...storyData.routes];
    newRoutes.splice(index, 1);
    if (newRoutes.length === 0) {
      newRoutes.push({
        id: 'newRoute',
        title: t('tools.storyEditor.newRoute', 'New Route'),
        description: t('tools.storyEditor.newRouteDesc', 'Route description...'),
        showToBeContinued: true,
        chapters: []
      });
    }
    setStoryData({ ...storyData, routes: newRoutes });
    if (viewState.routeIndex === index) {
      setViewState({ routeIndex: Math.max(0, index - 1), chapterIndex: null });
    } else if (viewState.routeIndex > index) {
      setViewState({ ...viewState, routeIndex: viewState.routeIndex - 1 });
    }
  };

  const deleteChapter = (index: number) => {
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex].chapters.splice(index, 1);
    setStoryData({ ...storyData, routes: newRoutes });
    if (viewState.chapterIndex === index) {
      setViewState({ routeIndex: viewState.routeIndex, chapterIndex: null });
    } else if (viewState.chapterIndex !== null && viewState.chapterIndex > index) {
      setViewState({ ...viewState, chapterIndex: viewState.chapterIndex - 1 });
    }
  };

  const deleteLevel = (index: number) => {
    if (viewState.chapterIndex === null) return;
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex].levels.splice(index, 1);
    setStoryData({ ...storyData, routes: newRoutes });
    setChapterState({ mode: 'chapter', levelIndex: null });
  };

  const deleteFile = (index: number) => {
    if (viewState.chapterIndex === null) return;
    const newRoutes = [...storyData.routes];
    newRoutes[viewState.routeIndex].chapters[viewState.chapterIndex].files!.splice(index, 1);
    setStoryData({ ...storyData, routes: newRoutes });
    setChapterState({ mode: 'chapter', fileIndex: null });
  };

  // Convert setViewState calls from Sidebar
  const handleSetViewState = (state: { mode: 'route' | 'chapter' | 'level' | 'file'; routeIndex: number; chapterIndex: number | null; levelIndex: number | null; fileIndex: number | null }) => {
    setViewState({ routeIndex: state.routeIndex, chapterIndex: state.chapterIndex });
    // Mode, levelIndex, fileIndex is handled per-chapter now. Sidebar only switches chapter/route.
  };

  const { storyFontFamily } = useUIStore();

  return (
    <div 
      className="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden"
      style={{
        '--story-font-family': storyFontFamily === 'CustomStoryFont' ? 'CustomStoryFont, serif' : storyFontFamily,
      } as React.CSSProperties}
    >
      {/* Main Workspace */}
      <div className="flex-1 relative flex overflow-hidden">
        <Sidebar 
          isMobile={isMobile}
          activeApp={activeApp}
          setActiveApp={setActiveApp}
          activeRoute={activeRoute}
          viewState={{ routeIndex: viewState.routeIndex, chapterIndex: viewState.chapterIndex }}
          setViewState={handleSetViewState}
          updateRoute={updateRoute}
          addRoute={addRoute}
          deleteRoute={deleteRoute}
          addChapter={addChapter}
          deleteChapter={deleteChapter}
          routes={storyData.routes}
          onFileUpload={handleFileUpload}
          onExport={handleExport}
          onOpenBatchGenerator={() => setIsBatchGeneratorOpen(true)}
        />

        <div className={`
          ${isMobile ? (viewState.chapterIndex !== null ? 'w-full' : 'hidden') : 'flex-1 min-w-0'} 
          flex flex-col h-full bg-white dark:bg-zinc-900 relative shadow-inner
        `}>
          {isBatchGeneratorOpen ? (
            <BatchGeneratorModal 
              onClose={() => setIsBatchGeneratorOpen(false)}
              onGenerate={handleGenerateChapters}
            />
          ) : currentChapterState?.mode === 'level' && activeLevel && currentChapterState.levelIndex !== null ? (
            <LevelEditor 
              level={activeLevel}
              levelIndex={currentChapterState.levelIndex}
              onUpdate={updateLevelData}
              onDelete={deleteLevel}
              onBack={() => setChapterState({ mode: 'chapter', levelIndex: null })}
            />
          ) : currentChapterState?.mode === 'file' && activeFile && currentChapterState.fileIndex !== null ? (
            <FileEditor 
              file={activeFile}
              fileIndex={currentChapterState.fileIndex}
              onUpdate={updateFileData}
              onDelete={deleteFile}
              onBack={() => setChapterState({ mode: 'chapter', fileIndex: null })}
            />
          ) : activeChapter && viewState.chapterIndex !== null ? (
            <ChapterEditorView 
              route={activeRoute}
              chapter={activeChapter}
              chapterIndex={viewState.chapterIndex}
              updateChapter={updateChapter}
              deleteChapter={deleteChapter}
              deleteLevel={deleteLevel}
              deleteFile={deleteFile}
              addLevel={addLevel}
              addFile={addFile}
              onSelectLevel={(idx) => setChapterState({ mode: 'level', levelIndex: idx })}
              onSelectFile={(idx) => setChapterState({ mode: 'file', fileIndex: idx })}
              onClose={() => setViewState({ ...viewState, chapterIndex: null })}
              isMobile={isMobile}
              getScrollTop={() => scrollPositions.current[chapterId] || 0}
              setScrollTop={(top) => {
                scrollPositions.current[chapterId] = top;
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4 p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-medium">{t('tools.storyEditor.emptyState', 'Select a chapter to start editing')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
