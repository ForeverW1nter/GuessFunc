import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChapterData, FileData } from '../../../types/story';
import { FileExplorerGrid, type FileExplorerItem } from '../../../utils/ui/FileExplorerGrid';

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

  // 恢复滚动位置
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = getScrollTop();
    }
  }, [chapter.id, getScrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // 将 levels 和 files 转换为统一的 FileExplorerItem 格式
  const explorerItems = useMemo<FileExplorerItem[]>(() => {
    const items: FileExplorerItem[] = [];

    // 处理关卡 (.exe)
    chapter.levels.forEach((level, originalIdx) => {
      const globalLevelId = `${routeId}/${chapter.id}/${level.id}`;
      const isCompleted = completedLevels.includes(globalLevelId);
      
      const chapterLevelIds = chapter.levels.map(l => `${routeId}/${chapter.id}/${l.id}`);
      const chapterCompletedCount = chapterLevelIds.filter(id => completedLevels.includes(id)).length;
      
      const isLocked = !isAssistMode && originalIdx >= chapterCompletedCount + 3;
      const isHidden = !isAssistMode && originalIdx > chapterCompletedCount + 3;
      
      if (!isHidden) {
        items.push({
          id: `level-${level.id}`,
          name: level.id,
          type: 'level',
          isLocked,
          isCompleted,
        });
      }
    });

    // 处理档案文件
    chapter.files?.forEach((file, originalIdx) => {
      const globalFileId = `${routeId}/${chapter.id}/${file.id}`;
      const isRead = readFiles.includes(globalFileId);
      
      const isLocked = !isAssistMode && originalIdx > chapter.levels.filter(l => completedLevels.includes(`${routeId}/${chapter.id}/${l.id}`)).length;
      const isHidden = !isAssistMode && originalIdx > chapter.levels.filter(l => completedLevels.includes(`${routeId}/${chapter.id}/${l.id}`)).length + 1;
      
      if (!isHidden) {
        items.push({
          id: `file-${file.id}`,
          name: file.title || `File`,
          type: 'file',
          extension: file.extension,
          isLocked,
          isCompleted: isRead,
        });
      }
    });

    return items;
  }, [chapter, routeId, completedLevels, readFiles, isAssistMode]);

  const handleItemClick = (item: FileExplorerItem) => {
    if (item.type === 'level') {
      onLevelClick(chapter.id, item.name, item.isLocked);
    } else {
      const targetFile = chapter.files?.find(f => f.id === item.id.replace('file-', ''));
      if (targetFile) {
        onFileClick(targetFile, item.isLocked);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-[24px] md:px-[40px] py-[24px] md:py-[32px] border-b border-[#2A2A2E] bg-[#0A0A0B]">
        <h2 className="text-[1.2rem] md:text-[1.8rem] text-white tracking-widest uppercase mb-[8px] flex items-center gap-[12px]">
          <FolderOpen className="text-app-primary w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
          <span className="font-sans">{chapter.title}</span>
        </h2>
        <div className="text-[0.8rem] text-[#606065] font-mono">
          {t('tools.storyEditor.path')} ~/{routeId}/{chapter.id}
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <FileExplorerGrid items={explorerItems} onItemClick={handleItemClick} />
      </div>
    </div>
  );
};
