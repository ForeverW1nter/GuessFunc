import React, { useRef, useLayoutEffect } from 'react';
import { FolderOpen, Lock, Check, Gamepad2, FileCheck, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChapterData, FileData } from '../../../types/story';
import { getFileIcon } from '../utils/fileIcons';

interface ChapterFilesProps {
  routeId: string;
  chapter: ChapterData;
  completedLevels: string[];
  readFiles: string[];
  isAssistMode: boolean;
  onLevelClick: (chapterId: string, levelId: string, isLocked: boolean) => void;
  onFileClick: (file: FileData, isLocked: boolean) => void;
  getScrollTop: () => number;
  setScrollTop: (top: number) => void;
}

export const ChapterFiles: React.FC<ChapterFilesProps> = ({
  routeId,
  chapter,
  completedLevels,
  readFiles,
  isAssistMode,
  onLevelClick,
  onFileClick,
  getScrollTop,
  setScrollTop
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore scroll position
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = getScrollTop();
    }
  }, [chapter.id, getScrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-[24px] md:px-[40px] py-[24px] md:py-[32px] border-b border-[#2A2A2E] bg-[#0A0A0B]">
        <h2 className="text-[1.2rem] md:text-[1.8rem] text-white tracking-widest uppercase mb-[8px] flex items-center gap-[12px]">
          <FolderOpen className="text-app-primary w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
          {chapter.title}
        </h2>
        <div className="text-[0.8rem] text-[#606065] font-mono">
          {t('tools.storyEditor.path')} ~/{routeId}/{chapter.id}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[32px_1fr_auto] gap-[16px] px-[24px] md:px-[40px] py-[12px] border-b border-[#2A2A2E] text-[0.7rem] text-[#606065] uppercase tracking-widest sticky top-0 bg-[#121214] z-10">
        <div className="w-[32px] text-center">{t('tools.storyEditor.sts')}</div>
        <div>{t('tools.storyEditor.nameCol')}</div>
        <div className="text-right">{t('tools.storyEditor.typeCol')}</div>
      </div>

      {/* Files */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar pb-[60px]"
      >
        {/* 渲染关卡 (.exe) */}
        {chapter.levels.map((level, originalIdx) => {
          const globalLevelId = `${routeId}/${chapter.id}/${level.id}`;
          const isCompleted = completedLevels.includes(globalLevelId);
          
          const chapterLevelIds = chapter.levels.map(l => `${routeId}/${chapter.id}/${l.id}`);
          const chapterCompletedCount = chapterLevelIds.filter(id => completedLevels.includes(id)).length;
          const isLocked = !isAssistMode && originalIdx >= chapterCompletedCount + 3;
          const isHidden = !isAssistMode && originalIdx > chapterCompletedCount + 3;
          if (isHidden) return null;

          return (
            <div
              key={level.id}
              onClick={() => onLevelClick(chapter.id, level.id, isLocked)}
              className={`
                grid grid-cols-[32px_1fr_auto] items-center gap-[16px] px-[24px] md:px-[40px] py-[14px] md:py-[16px] border-b border-[#1A1A1D] transition-colors
                ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1A1A1D]'}
              `}
            >
              {/* Status Icon */}
              <div className="w-[32px] flex justify-center">
                {isLocked ? (
                  <Lock size={14} strokeWidth={2} className="text-[#606065]" />
                ) : isCompleted ? (
                  <Check size={14} strokeWidth={3} className="text-app-success" />
                ) : (
                  <div className="w-[6px] h-[6px] rounded-full bg-app-primary shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.8)] animate-pulse" />
                )}
              </div>

              {/* File Name */}
              <div className="flex items-center gap-[12px] overflow-hidden">
                <span className={`text-[0.85rem] md:text-[0.95rem] truncate ${isLocked ? 'text-[#606065]' : isCompleted ? 'text-[#A0A0A5]' : 'text-white font-medium'}`}>
                  {level.title}.exe
                </span>
              </div>
              
              {/* File Type/Tags */}
              <div className="flex items-center gap-[8px] justify-end">
                {level.type === 'boss' && (
                  <span className="px-[6px] py-[2px] bg-[rgba(239,68,68,0.1)] text-[#ef4444] text-[0.65rem] border border-[rgba(239,68,68,0.2)] rounded-[2px]">
                    {t('tools.storyEditor.sysCritical')}
                  </span>
                )}
                <span className="text-[0.75rem] text-[#606065] flex items-center justify-center" title={isLocked ? t('tools.storyEditor.encrypted') : t('tools.storyEditor.executable')}>
                  <Gamepad2 size={16} strokeWidth={2} />
                </span>
              </div>
            </div>
          );
        })}

        {/* 渲染掉落文件 */}
        {chapter.files?.map((file) => {
          // 检查所有前置条件是否都包含在 completedLevels 中
          // 这里假设 unlockConditions 存储的是 levelId，我们在检查时转换为 globalId
          const isLocked = file.unlockConditions ? !file.unlockConditions.every(id => completedLevels.includes(`${routeId}/${chapter.id}/${id}`)) : false;
          
          if (isLocked && !isAssistMode) return null; // 不显示未解锁文件
          
          const isRead = readFiles?.includes(file.id);
          
          return (
            <div
              key={file.id}
              onClick={() => onFileClick(file, isLocked)}
              className={`
                grid grid-cols-[32px_1fr_auto] items-center gap-[16px] px-[24px] md:px-[40px] py-[14px] md:py-[16px] border-b border-[#1A1A1D] transition-colors cursor-pointer hover:bg-[#1A1A1D]
              `}
            >
              {/* Status Icon */}
              <div className="w-[32px] flex justify-center">
                {isRead ? (
                  <FileCheck size={14} strokeWidth={2} className="text-[#A0A0A5]" />
                ) : (
                  <FileText size={14} strokeWidth={2} className="text-app-primary" />
                )}
              </div>

              {/* File Name */}
              <div className="flex items-center gap-[12px] overflow-hidden">
                <span className={`text-[0.85rem] md:text-[0.95rem] truncate ${isRead ? 'text-[#A0A0A5]' : 'text-[#D4D4D6]'}`}>
                  {file.title}.{file.extension}
                </span>
              </div>
              
              {/* File Type/Tags */}
              <div className="flex items-center gap-[8px] justify-end">
                <span className="text-[0.75rem] flex items-center justify-center opacity-80" title={file.extension.toUpperCase()}>
                  {getFileIcon(file.extension, 16)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
