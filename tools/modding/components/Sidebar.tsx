import React from 'react';
import { BookOpen, Folder, FolderOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RouteData } from '../../../src/types/story';

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
  addChapter: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
  activeApp,
  setActiveApp,
  activeRoute,
  viewState,
  setViewState,
  updateRoute,
  addChapter
}) => {
  const { t } = useTranslation();

  return (
    <div className={`
      ${isMobile ? (viewState.chapterIndex !== null ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-zinc-200 dark:border-zinc-800'}
      flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar shrink-0
    `}>
      {/* App Selector */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 bg-white dark:bg-zinc-900/50">
        <button 
          onClick={() => setActiveApp('story-editor')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border-none outline-none cursor-pointer font-medium text-sm
            ${activeApp === 'story-editor' 
              ? 'bg-app-primary/10 text-app-primary dark:bg-app-primary/20 dark:text-app-primary' 
              : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          <BookOpen size={18} />
          <span>{t('tools.storyEditor.name', 'Story Editor')}</span>
        </button>
      </div>

      {activeApp === 'story-editor' && (
        <>
          <div className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur z-10 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
            <span>{t('tools.storyEditor.explorer', 'Explorer')} / {activeRoute.id}</span>
            <button onClick={addChapter} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              <Plus size={16} />
            </button>
          </div>

          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-900/50">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('tools.storyEditor.routeId', 'Route ID')}</label>
              <input 
                type="text" 
                value={activeRoute.id || ''}
                onChange={(e) => updateRoute('id', e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('tools.storyEditor.routeTitle', 'Route Title')}</label>
              <input 
                type="text" 
                value={activeRoute.title || ''}
                onChange={(e) => updateRoute('title', e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-col py-2 px-2 gap-0.5">
            {activeRoute.chapters.map((chapter, index) => {
              const isSelected = viewState.chapterIndex === index;
              return (
                <div 
                  key={chapter.id}
                  onClick={() => setViewState({ mode: 'chapter', routeIndex: viewState.routeIndex, chapterIndex: index, levelIndex: null, fileIndex: null })}
                  className={`
                    group relative flex items-center justify-between px-3 py-2 cursor-pointer transition-colors rounded-md text-sm
                    ${isSelected 
                      ? 'bg-app-primary/10 dark:bg-app-primary/20 text-app-primary dark:text-app-primary font-medium' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isSelected ? (
                      <FolderOpen size={16} className="shrink-0 text-app-primary dark:text-app-primary" />
                    ) : (
                      <Folder size={16} className="shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-300" />
                    )}
                    <span className="truncate">{chapter.title || t('tools.storyEditor.untitled', 'Untitled')}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono shrink-0 ml-2">
                    {chapter.id}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};