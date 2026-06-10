import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { Plus, Trash2, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RouteData, ChapterData } from '../../../types/story';
import { FileExplorerGrid, type FileExplorerItem } from '../../../utils/ui/FileExplorerGrid';

interface ChapterEditorViewProps {
  route: RouteData;
  chapter: ChapterData;
  chapterIndex: number;
  updateChapter: (field: keyof ChapterData, value: unknown) => void;
  deleteChapter: (index: number) => void;
  deleteLevel: (index: number) => void;
  deleteFile: (index: number) => void;
  addLevel: () => void;
  addFile: () => void;
  onSelectLevel: (index: number) => void;
  onSelectFile: (index: number) => void;
  onClose: () => void;
  isMobile: boolean;
  getScrollTop: () => number;
  setScrollTop: (top: number) => void;
}

export const ChapterEditorView: React.FC<ChapterEditorViewProps> = ({
  route,
  chapter,
  chapterIndex,
  updateChapter,
  deleteChapter,
  deleteLevel,
  deleteFile,
  addLevel,
  addFile,
  onSelectLevel,
  onSelectFile,
  onClose,
  isMobile,
  getScrollTop,
  setScrollTop
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = getScrollTop();
    }
  }, [chapter.id, getScrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // 转换为统一的 FileExplorerItem 格式
  const explorerItems = useMemo<FileExplorerItem[]>(() => {
    const items: FileExplorerItem[] = [];

    // 处理关卡 (.exe)
    chapter.levels.forEach((level, index) => {
      items.push({
        id: `level-${index}`, // 编辑器模式下我们使用 index 传递
        name: level.id || `Level ${index + 1}`,
        type: 'level',
        isLocked: false,
        isCompleted: false,
        isEditing: true,
        onDelete: () => deleteLevel(index),
      });
    });

    // 处理档案文件
    chapter.files?.forEach((file, index) => {
      items.push({
        id: `file-${index}`,
        name: file.title || `File ${index + 1}`,
        type: 'file',
        extension: file.extension,
        isLocked: false,
        isCompleted: false,
        isEditing: true,
        onDelete: () => deleteFile(index),
      });
    });

    return items;
  }, [chapter.levels, chapter.files, deleteLevel, deleteFile]);

  const handleItemClick = (item: FileExplorerItem) => {
    if (item.type === 'level') {
      const idx = parseInt(item.id.replace('level-', ''), 10);
      onSelectLevel(idx);
    } else {
      const idx = parseInt(item.id.replace('file-', ''), 10);
      onSelectFile(idx);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0B] text-[#E0E0E0]">
      {/* Header */}
      <div className="px-[24px] md:px-[40px] py-[24px] md:py-[32px] border-b border-[#2A2A2E] bg-[#0A0A0B]">
        <div className="flex justify-between items-start mb-[8px]">
          <h2 className="text-[1.2rem] md:text-[1.8rem] text-white tracking-widest uppercase m-0 flex items-center gap-[12px] w-full">
            <FolderOpen className="text-app-primary w-[24px] h-[24px] md:w-[32px] md:h-[32px] shrink-0" />
            <input 
              type="text" 
              value={chapter.title || ''}
              onChange={(e) => updateChapter('title', e.target.value)}
              className="bg-transparent border-b-2 border-transparent hover:border-[#2A2A2E] focus:border-app-primary text-white outline-none transition-colors w-full pb-1 font-sans"
              placeholder={t('tools.storyEditor.untitled', 'Untitled Chapter')}
            />
          </h2>
          <button 
            onClick={() => deleteChapter(chapterIndex)}
            className="p-2 text-[#606065] hover:text-red-500 hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-colors cursor-pointer bg-transparent border-none shrink-0"
            title={t('tools.storyEditor.deleteChapter', 'Delete Chapter')}
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[0.8rem] text-[#606065] font-mono flex items-center gap-2">
            <span>{t('tools.storyEditor.path', 'Path:')} ~/{route.id}/</span>
            <input 
              type="text" 
              value={chapter.id}
              onChange={(e) => updateChapter('id', e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-[#333] focus:border-app-primary text-[#A0A0A5] outline-none transition-colors w-32 pb-0.5 font-mono"
            />
          </div>
          {isMobile && (
              <button
                onClick={onClose}
                className="text-[0.7rem] text-app-primary font-medium uppercase tracking-wider border border-[rgba(var(--primary-color-rgb),0.3)] px-3 py-1 rounded-md bg-transparent"
              >
                {t('tools.storyEditor.close', 'Close')}
              </button>
          )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative"
      >
        <FileExplorerGrid items={explorerItems} onItemClick={handleItemClick} />

        {/* 添加按钮区 */}
        <div className="p-6 md:p-8 flex gap-4 border-t border-[#1A1A1D] mt-4">
          <button
            onClick={addLevel}
            className="flex-1 py-3 px-4 bg-[#121214] border border-[#2A2A2E] hover:border-app-primary text-[#A0A0A5] hover:text-app-primary rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-sm font-medium tracking-wider uppercase">{t('tools.storyEditor.addLevel', 'Add Level')}</span>
          </button>
          <button
            onClick={addFile}
            className="flex-1 py-3 px-4 bg-[#121214] border border-[#2A2A2E] hover:border-[#00A3FF] text-[#A0A0A5] hover:text-[#00A3FF] rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-sm font-medium tracking-wider uppercase">{t('tools.storyEditor.addFile', 'Add File')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
