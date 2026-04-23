import React from 'react';
import { Folder, FolderOpen, Check, Plus, Trash2, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TextWithCodeFont } from './TextWithCodeFont';
import type { ChapterData } from '../../types/story';

interface ChapterSidebarProps {
  isMobile: boolean;
  selectedChapterId: string | null;
  currentRouteId: string | undefined;
  chapters: ChapterData[];
  
  // Theme/Colors
  bgColor?: string;
  
  // Story mode specific
  completedLevels?: string[]; // If undefined, it means we're in Workshop mode
  
  // Workshop mode specific
  onAddChapter?: () => void;
  onDeleteChapter?: (index: number) => void;
  onEditRoute?: () => void; // Used to show route editor on mobile and PC
  
  onSelectChapter: (id: string, index: number) => void;
  
  // Visibility control for mobile
  showSidebarOnMobile?: boolean;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  isMobile,
  selectedChapterId,
  currentRouteId,
  chapters,
  bgColor = 'bg-background',
  completedLevels,
  onAddChapter,
  onDeleteChapter,
  onEditRoute,
  onSelectChapter,
  showSidebarOnMobile = true
}) => {
  const { t } = useTranslation();
  const isWorkshop = completedLevels === undefined;

  return (
    <div className={`
      ${isMobile ? (!showSidebarOnMobile ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-border'}
      flex flex-col h-full ${bgColor} overflow-y-auto custom-scrollbar shrink-0 text-muted-foreground
    `}>
      <div className={`px-[16px] py-[12px] text-[0.8rem] font-semibold text-muted-foreground/70 uppercase tracking-widest sticky top-0 ${bgColor}/90 backdrop-blur z-10 flex justify-between items-center border-b border-border`}>
        <span className="flex items-center gap-2 select-none truncate">
          <TextWithCodeFont text={currentRouteId || ''} className="truncate" />
        </span>
        <div className="flex items-center gap-1">
          {onEditRoute && (
            <button onClick={onEditRoute} className="text-muted-foreground/70 hover:text-foreground bg-transparent border-none cursor-pointer p-[4px] rounded-[6px] hover:bg-border transition-colors" title={t('tools.storyEditor.editRoute')}>
              <Edit3 size={16} />
            </button>
          )}
          {onAddChapter && (
            <button onClick={onAddChapter} className="text-muted-foreground/70 hover:text-foreground bg-transparent border-none cursor-pointer p-[4px] rounded-[6px] hover:bg-border transition-colors" title={t('tools.storyEditor.addChapter')}>
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col py-[8px] px-[8px] gap-[2px]">
        {chapters.length === 0 && (
          <div className="px-[16px] py-[20px] text-muted-foreground/70 text-[0.8rem]">{t('tools.storyEditor.noDirs')}</div>
        )}
        
        {chapters.map((chapter, index) => {
          const isSelected = selectedChapterId === chapter.id;
          
          let completedCount = 0;
          let isAllCompleted = false;
          if (!isWorkshop && completedLevels && currentRouteId) {
            const chapterLevelIds = chapter.levels.map(l => `${currentRouteId}/${chapter.id}/${l.id}`);
            completedCount = chapterLevelIds.filter((id: string) => completedLevels.includes(id)).length;
            const totalCount = chapterLevelIds.length;
            isAllCompleted = completedCount === totalCount && totalCount > 0;
          }

          return (
            <div 
              key={chapter.id}
              onClick={() => onSelectChapter(chapter.id, index)}
              className={`
                group relative flex items-center justify-between px-[16px] h-[48px] cursor-pointer transition-colors duration-200 rounded-xl text-[0.95rem]
                ${isSelected 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : `text-muted-foreground hover:text-foreground ${isWorkshop ? 'hover:bg-border/50' : 'hover:bg-muted/50'}`}
              `}
            >
              <div className="flex items-center gap-[12px] overflow-hidden z-10">
                {isSelected ? (
                  <FolderOpen size={20} className="shrink-0 text-primary" />
                ) : (
                  <Folder size={20} className="shrink-0 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                )}
                <TextWithCodeFont className="truncate" text={chapter.title || t('tools.storyEditor.untitled')} />
              </div>
              
              <div className="flex items-center h-full">
                {isWorkshop ? (
                  <>
                    <div className="text-[0.8rem] text-muted-foreground/70 font-mono shrink-0 ml-[8px]">
                      {chapter.id}
                    </div>
                    {onDeleteChapter && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDeleteChapter(index);
                        }}
                        className="hidden group-hover:flex ml-[8px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors bg-transparent border-none p-[4px] rounded items-center justify-center h-[24px] w-[24px]"
                        title={t('tools.storyEditor.deleteChapter')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-[8px] shrink-0">
                    <TextWithCodeFont 
                      className={`text-[0.7rem] ${isAllCompleted ? 'text-primary' : 'text-muted-foreground/70'}`} 
                      text={completedCount.toString()} 
                    />
                    {isAllCompleted && <Check size={14} strokeWidth={3} className="text-primary" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
