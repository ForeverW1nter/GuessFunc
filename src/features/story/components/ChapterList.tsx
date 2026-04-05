import React from 'react';
import { Folder, FolderOpen, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ChapterData } from '../../../types/story';

interface ChapterListProps {
  isMobile: boolean;
  selectedChapterId: string | null;
  currentRouteId: string | undefined;
  unlockedChapters: ChapterData[];
  completedLevels: string[];
  onSelectChapter: (id: string) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  isMobile,
  selectedChapterId,
  currentRouteId,
  unlockedChapters,
  completedLevels,
  onSelectChapter
}) => {
  const { t } = useTranslation();

  return (
    <div className={`
      ${isMobile ? (selectedChapterId ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-[#2A2A2E]'} 
      flex flex-col h-full bg-[#0A0A0B] overflow-y-auto custom-scrollbar shrink-0
    `}>
      <div className="px-[16px] py-[12px] text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase sticky top-0 bg-[#0A0A0B]/90 backdrop-blur z-10">
        {t('tools.storyEditor.explorer')} / {currentRouteId}
      </div>
      
      <div className="flex flex-col py-[8px]">
        {unlockedChapters.length === 0 && (
          <div className="px-[16px] py-[20px] text-[#606065] text-[0.8rem]">{t('tools.storyEditor.noDirs')}</div>
        )}
        
        {unlockedChapters.map((chapter) => {
          const chapterLevelIds = chapter.levels.map(l => l.id);
          const completedCount = chapterLevelIds.filter((id: string) => completedLevels.includes(id)).length;
          const totalCount = chapterLevelIds.length;
          const isAllCompleted = completedCount === totalCount && totalCount > 0;
          const isSelected = selectedChapterId === chapter.id;

          return (
            <div 
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={`
                group relative flex items-center justify-between px-[16px] py-[10px] cursor-pointer transition-colors
                ${isSelected ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' : 'text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white'}
              `}
            >
              <div className="flex items-center gap-[12px] overflow-hidden">
                {isSelected ? (
                  <FolderOpen size={16} className="shrink-0 text-app-primary" />
                ) : (
                  <Folder size={16} className="shrink-0 text-[#606065] group-hover:text-[#A0A0A5]" />
                )}
                <span className="text-[0.85rem] truncate">{chapter.title}</span>
              </div>
              
              <div className="flex items-center gap-[8px] shrink-0">
                <span className={`text-[0.7rem] ${isAllCompleted ? 'text-app-success' : 'text-[#606065]'}`}>
                  {completedCount}/{totalCount}
                </span>
                {isAllCompleted && <Check size={14} strokeWidth={3} className="text-app-success" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
