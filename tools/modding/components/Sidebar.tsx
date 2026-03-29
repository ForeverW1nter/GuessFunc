import React from 'react';
import { BookOpen, Folder, FolderOpen, Layers, Plus } from 'lucide-react';
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
      ${isMobile ? (viewState.chapterIndex !== null ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-[#2A2A2E]'}
      flex flex-col h-full bg-[#0A0A0B] overflow-y-auto custom-scrollbar shrink-0
    `}>
      {/* 应用选择器 */}
      <div className="p-[12px] border-b border-[#2A2A2E] flex flex-col gap-[4px] bg-[#121214]/50">
        <button 
          onClick={() => setActiveApp('story-editor')}
          className={`flex items-center gap-[12px] px-[16px] py-[10px] rounded-[6px] text-left transition-colors border-none outline-none cursor-pointer ${activeApp === 'story-editor' ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' : 'bg-transparent text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white'}`}
        >
          <BookOpen size={16} />
          <span className="text-[0.85rem] font-bold uppercase tracking-wider">{t('tools.storyEditor.name', 'Story Editor')}</span>
        </button>
        <button 
          onClick={() => setActiveApp('level-tester')}
          className={`flex items-center gap-[12px] px-[16px] py-[10px] rounded-[6px] text-left transition-colors border-none outline-none cursor-pointer ${activeApp === 'level-tester' ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' : 'bg-transparent text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white'} opacity-50 grayscale`}
          disabled
        >
          <Layers size={16} />
          <span className="text-[0.85rem] font-bold uppercase tracking-wider">{t('tools.levelTester.name', 'Level Sandbox')} (WIP)</span>
        </button>
      </div>

      {activeApp === 'story-editor' && (
        <>
          <div className="px-[16px] py-[12px] text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase sticky top-0 bg-[#0A0A0B]/90 backdrop-blur z-10 flex justify-between items-center border-b border-[#2A2A2E]">
            <span>{t('tools.storyEditor.explorer', 'Explorer')} / {activeRoute.id}</span>
            <button onClick={addChapter} className="text-app-primary hover:text-app-primary/80 bg-transparent border-none cursor-pointer p-[2px]">
              <Plus size={14} />
            </button>
          </div>

          <div className="p-[16px] border-b border-[#2A2A2E] space-y-[12px] bg-[#121214]/50">
            <div className="flex flex-col gap-[4px]">
              <label className="text-[0.65rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.routeId', 'Route ID')}</label>
              <input 
                type="text" 
                value={activeRoute.id}
                onChange={(e) => updateRoute('id', e.target.value)}
                className="w-full bg-transparent border-b border-[#2A2A2E] text-[#A0A0A5] text-[0.85rem] py-[4px] outline-none focus:border-app-primary focus:text-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[0.65rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.routeTitle', 'Route Title')}</label>
              <input 
                type="text" 
                value={activeRoute.title}
                onChange={(e) => updateRoute('title', e.target.value)}
                className="w-full bg-transparent border-b border-[#2A2A2E] text-[#A0A0A5] text-[0.85rem] py-[4px] outline-none focus:border-app-primary focus:text-white transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-col py-[8px]">
            {activeRoute.chapters.map((chapter, index) => {
              const isSelected = viewState.chapterIndex === index;
              return (
                <div 
                  key={chapter.id}
                  onClick={() => setViewState({ mode: 'chapter', routeIndex: viewState.routeIndex, chapterIndex: index, levelIndex: null, fileIndex: null })}
                  className={`
                    group relative flex items-center justify-between px-[16px] py-[10px] cursor-pointer transition-colors
                    ${isSelected ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary border-l-[2px] border-app-primary' : 'text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white border-l-[2px] border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-[12px] overflow-hidden">
                    {isSelected ? (
                      <FolderOpen size={16} className="shrink-0 text-app-primary" />
                    ) : (
                      <Folder size={16} className="shrink-0 text-[#606065] group-hover:text-[#A0A0A5]" />
                    )}
                    <span className="text-[0.85rem] truncate">{chapter.title || t('tools.storyEditor.untitled', 'Untitled')}</span>
                  </div>
                  <div className="text-[0.7rem] text-[#606065] font-mono">
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