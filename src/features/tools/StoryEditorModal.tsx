import React, { useState, useEffect, useRef } from 'react';
import type { RouteData, FileData, LevelData, ChapterData } from '../../types/story';
import { useTranslation } from 'react-i18next';
import { LevelEditor } from './components/LevelEditor';
import { FileEditor } from './components/FileEditor';
import { ChapterSidebar } from '../../components/ui/ChapterSidebar';
import { ChapterEditorView } from './components/ChapterEditorView';
import { SystemBar } from './components/SystemBar';
import { WorkspaceEmptyState } from './components/WorkspaceEmptyState';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { SYSTEM_LOGS } from '../../utils/systemLogs';


import { RouteEditorView } from './components/RouteEditorView';
import { ConfirmModal } from '../../features/ui/components/ConfirmModal';

import { useStore } from 'zustand';
import { useUIStore } from '../../store/useUIStore';
import { generatePublishUrl } from '../mods/api';
import { useEditorStore } from './store/useEditorStore';

interface GlobalViewState {
  routeIndex: number;
  chapterIndex: number | null;
}

interface ChapterState {
  mode: 'chapter' | 'level' | 'file';
  levelIndex: number | null;
  fileIndex: number | null;
}

export const StoryEditorView: React.FC = () => {
  const { t } = useTranslation();
  const { isStoryEditorOpen, setStoryEditorOpen } = useUIStore();
  
  const { 
    storyData, setStoryData,
    addRoute, updateRoute, deleteRoute,
    addChapter, updateChapter, deleteChapter, mergeChaptersById,
    addLevel, updateLevel, deleteLevel,
    addFile, updateFile, deleteFile 
  } = useEditorStore();
  
  const { undo, redo, pastStates, futureStates } = useStore(useEditorStore.temporal);

  const [viewState, setViewState] = useState<GlobalViewState>({
    routeIndex: 0,
    chapterIndex: null,
  });

  // Maintain state per chapter to preserve opened file/level
  const [chapterStates, setChapterStates] = useState<Record<string, ChapterState>>({});
  const scrollPositions = useRef<Record<string, number>>({});

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isBatchGeneratorOpen, setIsBatchGeneratorOpen] = useState(false);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  // Fetch initial data from useModStore
  useEffect(() => {
    if (!isStoryEditorOpen) return;
    import('../../features/mods/store').then(({ useModStore }) => {
      const store = useModStore.getState();
      if (!store.isInitialized) {
        store.init().then(() => loadModsToState(store));
      } else {
        loadModsToState(store);
      }

      function loadModsToState(s: ReturnType<typeof useModStore.getState>) {
        const allMods = s.installedMods;
        const allRoutes = Object.values(allMods).flatMap((m) => 
          m.storyData.routes.map((r) => ({ ...r, modId: m.manifest.id }))
        );
        
        if (allRoutes.length > 0) {
          setStoryData({ routes: allRoutes });
        }
      }
    });
  }, [setStoryData, isStoryEditorOpen]);

  // Debounced save to IndexedDB
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      import('../../features/mods/store').then(({ useModStore }) => {
        const store = useModStore.getState();
        if (!store.isInitialized) return;
        
        const routesByModId: Record<string, RouteData[]> = {};
        storyData.routes.forEach(route => {
          const modId = route.modId || 'local_workspace';
          if (!routesByModId[modId]) routesByModId[modId] = [];
          routesByModId[modId].push(route);
        });

        // Delete mods that have no routes left, except local_workspace
        const currentModIds = Object.keys(store.installedMods);
        currentModIds.forEach(modId => {
          if (!routesByModId[modId]) {
            if (modId !== 'local_workspace') {
              store.uninstallMod(modId);
            } else {
              // Ensure local_workspace always has at least an empty routes array
              store.updateMod('local_workspace', {
                manifest: store.installedMods['local_workspace'].manifest,
                storyData: { routes: [] }
              });
            }
          }
        });

        Object.keys(routesByModId).forEach(async (modId) => {
          const routes = routesByModId[modId];
          let mod = store.installedMods[modId];
          if (!mod) {
            mod = {
              manifest: {
                id: modId,
                title: modId === 'local_workspace' ? 'My Local Workspace' : 'Unknown Mod',
                author: 'Player',
                description: 'Local mod',
                version: '1.0.0'
              },
              storyData: { routes: [] }
            };
          }
          const newMod = { ...mod, storyData: { routes } };
          await store.updateMod(modId, newMod);
        });
      });
    }, 1000); // 1s debounce

    // Also update useStoryStore editorRoutes immediately for visual updates
    // Actually we don't need editorRoutes anymore, we should remove it from useStoryStore
    // But since we use modRoutes now, the updateMod will trigger a re-init which updates modRoutes
  }, [storyData]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (futureStates.length > 0) redo();
        } else {
          e.preventDefault();
          if (pastStates.length > 0) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (futureStates.length > 0) redo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, pastStates.length, futureStates.length]);

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
    const modIdToExport = activeRoute?.modId || 'local_workspace';
    const modRoutesToExport = storyData.routes.filter(r => (r.modId || 'local_workspace') === modIdToExport);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ routes: modRoutesToExport }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `mod_${modIdToExport}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePublish = async () => {
    setConfirmDialog({
      isOpen: true,
      title: t('mods.publishConfirmTitle'),
      description: t('mods.publishConfirmDesc'),
      onConfirm: async () => {
        const modIdToPublish = activeRoute?.modId || 'local_workspace';
        const modRoutesToPublish = storyData.routes.filter(r => (r.modId || 'local_workspace') === modIdToPublish);
        
        const manifest = {
          title: activeRoute?.title || 'My Mod',
          author: 'Player', // Can be customized later
          description: activeRoute?.description || 'A new mod for GuessFunc',
        };
        const publishData = generatePublishUrl(manifest, { routes: modRoutesToPublish });
        
        if (publishData.isTooLong && publishData.clipboardData) {
          try {
            await navigator.clipboard.writeText(publishData.clipboardData);
            useUIStore.getState().addToast(t('mods.publishConfirmFallback'), 'info');
          } catch (err) {
            console.error('Failed to copy to clipboard', err);
            useUIStore.getState().addToast(t('sidebar.copyError'), 'error');
            
            // Fallback: show modal with copy content
            setConfirmDialog({
              isOpen: true,
              title: t('common.copyFallbackTitle'),
              description: (
                <div className="flex flex-col gap-2">
                  <p>{t('common.copyFallbackDesc')}</p>
                  <textarea
                    readOnly
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-lg text-sm font-mono resize-none focus:outline-none focus:border-primary"
                    rows={3}
                    value={publishData.clipboardData || ''}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              ),
              onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
            return; // Return early to avoid opening the window below if copying failed
          }
        }
        
        window.open(publishData.url, '_blank');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddRoute = () => {
    let counter = 1;
    let newRouteId = `route_${counter}`;
    while (storyData.routes.some(r => r.id === newRouteId)) {
      counter++;
      newRouteId = `route_${counter}`;
    }

    addRoute({
      id: newRouteId,
      title: `${t('tools.storyEditor.newRoute')} ${counter}`,
      description: t('tools.storyEditor.newRouteDesc'),
      showToBeContinued: true,
      showInPlayInterface: true,
      modId: 'local_workspace',
      chapters: []
    });
    setViewState({ routeIndex: storyData.routes.length, chapterIndex: null });
    setShowSidebarOnMobile(false);
  };

  const handleAddChapter = () => {
    const currentChapters = storyData.routes[viewState.routeIndex].chapters;
    const chapterCount = currentChapters.length;

    addChapter(viewState.routeIndex, {
      id: `ch${chapterCount}`,
      title: t('tools.storyEditor.newChapterTitle', { index: chapterCount + 1 }),
      levels: [],
      files: []
    });
  };

  const handleGenerateChapters = (generatedChapters: ChapterData[]) => {
    mergeChaptersById(viewState.routeIndex, generatedChapters);
  };

  const handleAddLevel = () => {
    if (viewState.chapterIndex === null) return;
    
    const currentRoute = storyData.routes[viewState.routeIndex];
    let maxLevelNum = 0;
    
    currentRoute.chapters.forEach(ch => {
      ch.levels.forEach(l => {
        const match = l.id.match(/^lv(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxLevelNum) {
            maxLevelNum = num;
          }
        }
      });
    });

    let nextLevelNum = maxLevelNum + 1;
    let newLevelId = `lv${nextLevelNum}`;
    
    // Fallback to ensure global uniqueness within the route just in case
    const allLevelIds = new Set<string>();
    currentRoute.chapters.forEach(ch => ch.levels.forEach(l => allLevelIds.add(l.id)));
    while (allLevelIds.has(newLevelId)) {
      nextLevelNum++;
      newLevelId = `lv${nextLevelNum}`;
    }

    addLevel(viewState.routeIndex, viewState.chapterIndex, {
      id: newLevelId,
      title: `${nextLevelNum}`,
      targetFunction: 'x',
      params: null,
      type: 'normal',
      unlockConditions: null,
      tip: ''
    });
  };

  const handleAddFile = () => {
    if (viewState.chapterIndex === null) return;
    const chapter = storyData.routes[viewState.routeIndex].chapters[viewState.chapterIndex];
    const newFileId = `f${chapter.files?.length ? chapter.files.length + 1 : 1}`;
    
    addFile(viewState.routeIndex, viewState.chapterIndex, {
      id: newFileId,
      title: t('tools.storyEditor.newFile'),
      extension: 'md',
      content: t('tools.storyEditor.fileContent'),
      unlockConditions: []
    });
  };

  const handleUpdateRoute = (field: keyof RouteData, value: unknown) => {
    updateRoute(viewState.routeIndex, field, value);
  };

  const handleUpdateChapter = (field: keyof ChapterData, value: unknown) => {
    if (viewState.chapterIndex === null) return;
    updateChapter(viewState.routeIndex, viewState.chapterIndex, field, value);
  };

  const handleUpdateLevelData = (field: keyof LevelData, value: unknown) => {
    if (viewState.chapterIndex === null || currentChapterState?.levelIndex == null) return;
    updateLevel(viewState.routeIndex, viewState.chapterIndex, currentChapterState.levelIndex, field, value);
  };

  const handleUpdateFileData = (field: keyof FileData, value: unknown) => {
    if (viewState.chapterIndex === null || currentChapterState?.fileIndex == null) return;
    updateFile(viewState.routeIndex, viewState.chapterIndex, currentChapterState.fileIndex, field, value);
  };

  const handleDeleteRoute = (index: number) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      setConfirmDialog({
        isOpen: true,
        title: t('tools.storyEditor.confirmDeleteRoute'),
        onConfirm: () => {
          deleteRoute(index);
          if (viewState.routeIndex === index) {
            setViewState({ routeIndex: Math.max(0, index - 1), chapterIndex: null });
          } else if (viewState.routeIndex > index) {
            setViewState({ ...viewState, routeIndex: viewState.routeIndex - 1 });
          }
          setShowSidebarOnMobile(true);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    }, 0);
  };

  const handleDeleteChapter = (index: number) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      setConfirmDialog({
        isOpen: true,
        title: t('tools.storyEditor.confirmDeleteChapter'),
        onConfirm: () => {
          deleteChapter(viewState.routeIndex, index);
          if (viewState.chapterIndex === index) {
            setViewState({ routeIndex: viewState.routeIndex, chapterIndex: null });
            setShowSidebarOnMobile(true);
          } else if (viewState.chapterIndex !== null && viewState.chapterIndex > index) {
            setViewState({ ...viewState, chapterIndex: viewState.chapterIndex - 1 });
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    }, 0);
  };

  const handleDeleteLevel = (index: number) => {
    if (viewState.chapterIndex === null) return;
    const chapterIdx = viewState.chapterIndex;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      setConfirmDialog({
        isOpen: true,
        title: t('tools.storyEditor.confirmDeleteLevel'),
        onConfirm: () => {
          deleteLevel(viewState.routeIndex, chapterIdx, index);
          setChapterState({ mode: 'chapter', levelIndex: null });
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    }, 0);
  };

  const handleDeleteFile = (index: number) => {
    if (viewState.chapterIndex === null) return;
    const chapterIdx = viewState.chapterIndex;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      setConfirmDialog({
        isOpen: true,
        title: t('tools.storyEditor.confirmDeleteFile'),
        onConfirm: () => {
          deleteFile(viewState.routeIndex, chapterIdx, index);
          setChapterState({ mode: 'chapter', fileIndex: null });
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    }, 0);
  };

  // Remove handleSetViewState

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          
          if (json.routes) {
            setConfirmDialog({
              isOpen: true,
              title: t('tools.storyEditor.confirmMerge'),
              onConfirm: () => {
                const newRoutes = [...storyData.routes];
                json.routes.forEach((importedRoute: RouteData) => {
                  importedRoute.modId = importedRoute.modId || 'local_workspace';
                  const existingRouteIndex = newRoutes.findIndex(r => r.id === importedRoute.id);
                  if (existingRouteIndex !== -1) {
                    // Let's rely on the store merge mechanism instead of duplicating
                    mergeChaptersById(existingRouteIndex, importedRoute.chapters);
                  } else {
                    addRoute(importedRoute);
                  }
                });
              }
            });
          } else {
            // Ensure modId is set for legacy imports
            if (json.routes) {
              json.routes.forEach((r: RouteData) => r.modId = r.modId || 'local_workspace');
            }
            setStoryData(json);
            setViewState({ routeIndex: 0, chapterIndex: null });
          }
        } catch (err: unknown) {
          useUIStore.getState().addToast(t('tools.storyEditor.parseError'), 'error');
          console.error(SYSTEM_LOGS.ERROR_IMPORT_DATA, err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  if (!isStoryEditorOpen) return null;

  return (
    <div className="absolute inset-0 z-20 h-full flex flex-col min-h-0 bg-background text-foreground animate-fade-in">
      <SystemBar 
        onFileUpload={handleFileUpload} 
        onExport={handleExport} 
        onPublish={handlePublish}
        onOpenBatchGenerator={() => {
          setIsBatchGeneratorOpen(true);
          setShowSidebarOnMobile(false);
        }} 
        onClose={() => setStoryEditorOpen(false)} 
        routes={storyData.routes}
        activeRoute={activeRoute}
        routeIndex={viewState.routeIndex}
        onSelectRoute={(idx) => {
          setViewState({ routeIndex: idx, chapterIndex: null });
          setShowSidebarOnMobile(true);
        }}
        onAddRoute={handleAddRoute}
        isMobile={isMobile}
        showSidebarOnMobile={showSidebarOnMobile}
        onBackToSidebar={() => setShowSidebarOnMobile(true)}
        canUndo={pastStates.length > 0}
        canRedo={futureStates.length > 0}
        onUndo={() => undo()}
        onRedo={() => redo()}
      />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <ChapterSidebar
          isMobile={isMobile}
          showSidebarOnMobile={showSidebarOnMobile}
          selectedChapterId={activeChapter?.id || null}
          currentRouteId={activeRoute?.title || activeRoute?.id}
          chapters={activeRoute?.chapters || []}
          bgColor="bg-background"
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onEditRoute={() => {
            setViewState({ routeIndex: viewState.routeIndex, chapterIndex: null });
            setShowSidebarOnMobile(false);
          }}
          onSelectChapter={(_id, index) => {
            setViewState({ routeIndex: viewState.routeIndex, chapterIndex: index });
            setShowSidebarOnMobile(false);
          }}
        />
        <div className={`
          ${isMobile ? (showSidebarOnMobile ? 'hidden' : 'w-full') : 'flex-1 min-w-0'} 
          flex flex-col h-full bg-background relative
        `}>
          {isBatchGeneratorOpen ? (() => {
            const currentRoute = activeRoute;
            const startChapterIndex = currentRoute?.chapters.length || 0;
            let maxLevelNum = 0;
            currentRoute?.chapters.forEach(ch => {
              ch.levels.forEach(l => {
                const match = l.id.match(/^lv(\d+)$/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (num > maxLevelNum) maxLevelNum = num;
                }
              });
            });
            
            return (
              <BatchGeneratorModal 
                startChapterIndex={startChapterIndex}
                startLevelIndex={maxLevelNum + 1}
                onClose={() => setIsBatchGeneratorOpen(false)}
                onGenerate={handleGenerateChapters}
              />
            );
          })() : currentChapterState?.mode === 'level' && activeLevel && currentChapterState.levelIndex !== null ? (
            <LevelEditor 
              level={activeLevel}
              levelIndex={currentChapterState.levelIndex}
              onUpdate={handleUpdateLevelData}
              onDelete={handleDeleteLevel}
              onBack={() => setChapterState({ mode: 'chapter', levelIndex: null })}
            />
          ) : currentChapterState?.mode === 'file' && activeFile && currentChapterState.fileIndex !== null ? (
            <FileEditor 
              file={activeFile}
              fileIndex={currentChapterState.fileIndex}
              onUpdate={handleUpdateFileData}
              onDelete={handleDeleteFile}
              onBack={() => setChapterState({ mode: 'chapter', fileIndex: null })}
            />
          ) : activeChapter && viewState.chapterIndex !== null ? (
            <ChapterEditorView 
              route={activeRoute}
              chapter={activeChapter}
              chapterIndex={viewState.chapterIndex}
              updateChapter={handleUpdateChapter}
              deleteChapter={handleDeleteChapter}
              deleteLevel={handleDeleteLevel}
              deleteFile={handleDeleteFile}
              addLevel={handleAddLevel}
              addFile={handleAddFile}
              onSelectLevel={(idx) => setChapterState({ mode: 'level', levelIndex: idx })}
              onSelectFile={(idx) => setChapterState({ mode: 'file', fileIndex: idx })}
              getScrollTop={() => scrollPositions.current[chapterId] || 0}
              setScrollTop={(top) => {
                scrollPositions.current[chapterId] = top;
              }}
            />
          ) : activeRoute ? (
            <RouteEditorView 
              route={activeRoute}
              routeIndex={viewState.routeIndex}
              updateRoute={handleUpdateRoute}
              deleteRoute={handleDeleteRoute}
            />
          ) : (
            <WorkspaceEmptyState />
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.description as string}
      />
    </div>
  );
};
