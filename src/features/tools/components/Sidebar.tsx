import React from 'react';
import { Folder, FolderOpen, Plus, Trash2, Download, Upload, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RouteData } from '../../../types/story';

import { useUIStore } from '../../../store/useUIStore';

interface SidebarProps {
  isMobile: boolean;
  activeApp: 'story-editor' | 'level-tester';
  setActiveApp: (app: 'story-editor' | 'level-tester') => void;
  activeRoute: RouteData;
  viewState: {
    chapterIndex: number | null;
    routeIndex: number;
  };
  setViewState: (state: { mode: 'route' | 'chapter' | 'level' | 'file'; routeIndex: number; chapterIndex: number | null; levelIndex: number | null; fileIndex: number | null }) => void;
  updateRoute: (field: keyof RouteData, value: string) => void;
  addRoute: () => void;
  deleteRoute: (index: number) => void;
  addChapter: () => void;
  deleteChapter: (index: number) => void;
  routes: RouteData[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onOpenBatchGenerator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
  viewState,
  setViewState,
  addRoute,
  deleteRoute,
  addChapter,
  deleteChapter,
  routes,
  onFileUpload,
  onExport,
  onOpenBatchGenerator
}) => {
  const { t } = useTranslation();

  return (
    <div className={`
      ${isMobile ? (viewState.chapterIndex !== null ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-[#2A2A2E]'}
      flex flex-col h-full bg-[#0A0A0B] overflow-y-auto custom-scrollbar shrink-0
    `}>
      <div className="p-4 flex items-center justify-between border-b border-[#2A2A2E] shrink-0">
        <div className="flex gap-2 w-full">
          <label className="flex flex-1 items-center justify-center h-8 rounded-md bg-[#1A1A1D] hover:bg-[#2A2A2E] text-[#A0A0A5] hover:text-white transition-colors cursor-pointer border border-[#333] gap-2" title={t('tools.storyEditor.importBtn', 'Import JSON')}>
            <Upload size={16} />
            <span className="text-xs font-medium tracking-wide hidden lg:inline">{t('tools.storyEditor.importBtn', 'Import JSON')}</span>
            <input type="file" accept=".json" onChange={onFileUpload} className="hidden" />
          </label>
          <button onClick={onExport} className="flex flex-1 items-center justify-center h-8 rounded-md bg-[#1A1A1D] hover:bg-[#2A2A2E] text-[#A0A0A5] hover:text-white transition-colors border border-[#333] cursor-pointer gap-2" title={t('tools.storyEditor.exportBtn', 'Export JSON')}>
            <Download size={16} />
            <span className="text-xs font-medium tracking-wide hidden lg:inline">{t('tools.storyEditor.exportBtn', 'Export JSON')}</span>
          </button>
          <button onClick={onOpenBatchGenerator} className="flex flex-1 items-center justify-center h-8 rounded-md bg-[#1A1A1D] hover:bg-[#2A2A2E] text-[#A0A0A5] hover:text-white transition-colors border border-[#333] cursor-pointer gap-2" title={t('tools.storyEditor.batchGenerate', 'Batch Generate')}>
            <Wand2 size={16} />
            <span className="text-xs font-medium tracking-wide hidden lg:inline">{t('tools.storyEditor.batchGenerate', 'Batch Generate')}</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase sticky top-0 bg-[#0A0A0B]/90 backdrop-blur z-10 flex justify-between items-center border-b border-[#2A2A2E]">
        <span>{t('tools.storyEditor.routes', 'ROUTES')}</span>
        <button onClick={addRoute} className="text-[#606065] hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex flex-col py-2 max-h-[200px] overflow-y-auto border-b border-[#2A2A2E]">
        {routes.map((route, idx) => (
          <div 
            key={route.id}
            onClick={() => setViewState({ mode: 'route', routeIndex: idx, chapterIndex: null, levelIndex: null, fileIndex: null })}
            className={`
              group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors
              ${viewState.routeIndex === idx 
                ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' 
                : 'text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white'}
            `}
          >
            <span className="text-[0.85rem] truncate pr-2">{route.id} - {route.title}</span>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                useUIStore.getState().openDialog({
                  type: 'confirm',
                  title: t('tools.storyEditor.deleteRouteTitle', 'Delete Route'),
                  message: t('tools.storyEditor.deleteRouteConfirm', 'Are you sure you want to delete this route? This action cannot be undone.'),
                  onConfirm: () => deleteRoute(idx)
                });
              }}
              className="opacity-0 group-hover:opacity-100 text-[#606065] hover:text-red-500 transition-opacity bg-transparent border-none p-1 rounded cursor-pointer"
              title={t('tools.storyEditor.deleteRoute', 'Delete Route')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase sticky top-0 bg-[#0A0A0B]/90 backdrop-blur z-10 flex justify-between items-center border-b border-[#2A2A2E]">
        <span>{t('tools.storyEditor.chapters', 'CHAPTERS')} / {routes[viewState.routeIndex]?.id}</span>
        <button onClick={addChapter} className="text-[#606065] hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex flex-col py-2 flex-1 overflow-y-auto">
        {routes[viewState.routeIndex]?.chapters.map((chapter, idx) => (
          <div 
            key={chapter.id}
            onClick={() => setViewState({ mode: 'chapter', routeIndex: viewState.routeIndex, chapterIndex: idx, levelIndex: null, fileIndex: null })}
            className={`
              group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors
              ${viewState.chapterIndex === idx 
                ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' 
                : 'text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white'}
            `}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {viewState.chapterIndex === idx ? (
                <FolderOpen size={16} className="shrink-0 text-app-primary" />
              ) : (
                <Folder size={16} className="shrink-0 text-[#606065] group-hover:text-[#A0A0A5]" />
              )}
              <span className="text-[0.85rem] truncate">{chapter.title}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                useUIStore.getState().openDialog({
                  type: 'confirm',
                  title: t('tools.storyEditor.deleteChapterTitle', 'Delete Chapter'),
                  message: t('tools.storyEditor.deleteChapterConfirm', 'Are you sure you want to delete this chapter? This action cannot be undone.'),
                  onConfirm: () => deleteChapter(idx)
                });
              }}
              className="opacity-0 group-hover:opacity-100 text-[#606065] hover:text-red-500 transition-opacity bg-transparent border-none p-1 rounded cursor-pointer"
              title={t('tools.storyEditor.deleteChapter', 'Delete Chapter')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};