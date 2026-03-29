import React, { useState, useEffect, useRef } from 'react';
import { RouteData, FileData, LevelData, ChapterData } from '../../src/types/story';
import { useTranslation } from 'react-i18next';
import { LevelEditor } from './components/LevelEditor';
import { FileEditor } from './components/FileEditor';
import { Sidebar } from './components/Sidebar';
import { ChapterEditorView } from './components/ChapterEditorView';
import { SystemBar } from './components/SystemBar';
import { WorkspaceEmptyState } from './components/WorkspaceEmptyState';
import { SettingsModal } from '../../src/features/ui/components/SettingsModal';

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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "story.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setStoryData(json);
          setViewState({ routeIndex: 0, chapterIndex: null });
        } catch (err: unknown) {
          alert(t('tools.storyEditor.parseError', 'Failed to parse JSON file'));
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const addChapter = () => {
    const newRoutes = [...storyData.routes];
    const newChapterId = `ch${newRoutes[viewState.routeIndex].chapters.length}`;
    newRoutes[viewState.routeIndex].chapters.push({
      id: newChapterId,
      title: `${t('tools.storyEditor.newChapter', 'New Chapter')} ${newChapterId}`,
      levels: [],
      files: []
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

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0B] text-[#D4D4D6] overflow-hidden font-mono">
      {/* System Bar */}
      <SystemBar onFileUpload={handleFileUpload} onExport={handleExport} />

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
          addChapter={addChapter}
        />

        <div className={`
          ${isMobile ? (viewState.chapterIndex !== null ? 'w-full' : 'hidden') : 'flex-1 min-w-0'} 
          flex flex-col h-full bg-[#121214] relative
        `}>
          {currentChapterState?.mode === 'level' && activeLevel && currentChapterState.levelIndex !== null ? (
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
            <WorkspaceEmptyState />
          )}
        </div>
      </div>
      <SettingsModal />
    </div>
  );
};
