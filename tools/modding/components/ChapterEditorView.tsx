import React, { useRef, useLayoutEffect } from 'react';
import { Plus, Trash2, FolderOpen, FileCode, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RouteData, ChapterData } from '../../../src/types/story';

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

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-[24px] md:px-[40px] py-[24px] md:py-[32px] border-b border-[#2A2A2E] bg-[#0A0A0B]">
        <div className="flex justify-between items-start mb-[16px]">
          <h2 className="text-[1.2rem] md:text-[1.8rem] text-white tracking-widest uppercase m-0 flex items-center gap-[12px] w-full">
            <FolderOpen className="text-app-primary w-[24px] h-[24px] md:w-[32px] md:h-[32px] shrink-0" />
            <input 
              type="text" 
              value={chapter.title}
              onChange={(e) => updateChapter('title', e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-[#2A2A2E] focus:border-app-primary text-white outline-none transition-colors w-full"
            />
          </h2>
          <button 
            onClick={() => deleteChapter(chapterIndex)}
            className="p-[8px] text-red-500/50 hover:text-white hover:bg-red-500 rounded-[4px] transition-colors cursor-pointer bg-transparent border-none shrink-0"
            title={t('tools.storyEditor.deleteChapter', 'Delete Chapter')}
          >
            <Trash2 size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[0.8rem] text-[#606065] font-mono flex items-center gap-[8px]">
            <span>{t('tools.storyEditor.path', 'Path:')} ~/{route.id}/</span>
            <input 
              type="text" 
              value={chapter.id}
              onChange={(e) => updateChapter('id', e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-[#2A2A2E] focus:border-app-primary text-[#A0A0A5] outline-none transition-colors w-[100px]"
            />
          </div>
          {isMobile && (
              <button
                onClick={onClose}
                className="text-[0.7rem] text-app-primary uppercase tracking-widest border border-app-primary/30 px-[8px] py-[2px] rounded bg-transparent"
              >
                {t('tools.storyEditor.close', 'Close')}
              </button>
          )}
        </div>
      </div>

      {/* Files List - 左右分栏布局 */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-[16px] md:p-[32px]"
      >
        <div className="flex flex-row gap-[32px]">
          {/* 左栏：Levels */}
          <div className="flex flex-col flex-1">
            <div className="flex flex-row items-center justify-between px-[16px] py-[8px] border-b border-transparent text-[0.65rem] text-[#606065] uppercase tracking-widest sticky top-0 bg-[#121214] z-10 shadow-[0_1px_0_rgba(255,255,255,0.02)] mb-[8px]">
              <div className="flex flex-row items-center gap-[16px] flex-1 min-w-0">
                <div className="w-[32px] text-center shrink-0">{t('tools.storyEditor.sts', 'STS')}</div>
                <div className="truncate">{t('tools.storyEditor.levelsTitle', 'Levels')}</div>
              </div>
              <div className="w-[40px] text-right shrink-0">{t('tools.storyEditor.typeCol', 'Type')}</div>
            </div>
            
            <div className="flex flex-col gap-[4px]">
              {chapter.levels.map((level, index) => (
                <div 
                  key={`level-${level.id}`}
                  onClick={() => onSelectLevel(index)}
                  className="group relative flex flex-row items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#1A1A1D] cursor-pointer transition-colors"
                >
                  <div className="flex flex-row items-center gap-[16px] flex-1 min-w-0">
                    <div className="w-[32px] flex justify-center shrink-0">
                      <FileCode size={16} className="text-[#606065] group-hover:text-green-400 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <span className="text-[0.85rem] text-[#D4D4D6] group-hover:text-white transition-colors truncate">
                        {level.id}.exe <span className="text-[#606065] ml-[8px] text-[0.75rem]">- {level.title}</span>
                      </span>
                      <span className="text-[0.65rem] text-[#606065] font-mono truncate">
                        f(x) = {level.targetFunction}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-[8px] shrink-0 justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLevel(index); }}
                      className="opacity-0 group-hover:opacity-100 p-[4px] text-[#606065] hover:text-white hover:bg-red-500 rounded-[4px] transition-all cursor-pointer bg-transparent border-none"
                      title={t('tools.storyEditor.deleteLevel', 'Delete Level')}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-[0.7rem] text-[#606065] uppercase tracking-widest text-right w-[40px]">
                      LVL
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addLevel}
                className="mt-[4px] py-[8px] rounded-[8px] bg-transparent border border-dashed border-[#2A2A2E] hover:border-green-400/50 hover:bg-green-400/5 text-[#606065] hover:text-green-400 transition-colors cursor-pointer flex items-center justify-center gap-[8px] text-[0.7rem] uppercase tracking-widest font-bold"
              >
                <Plus size={14} /> {t('tools.storyEditor.addLevel', 'Add Level')}
              </button>
            </div>
          </div>

          {/* 右栏：Files */}
          <div className="flex flex-col flex-1">
            <div className="flex flex-row items-center justify-between px-[16px] py-[8px] border-b border-transparent text-[0.65rem] text-[#606065] uppercase tracking-widest sticky top-0 bg-[#121214] z-10 shadow-[0_1px_0_rgba(255,255,255,0.02)] mb-[8px]">
              <div className="flex flex-row items-center gap-[16px] flex-1 min-w-0">
                <div className="w-[32px] text-center shrink-0">{t('tools.storyEditor.sts', 'STS')}</div>
                <div className="truncate">{t('tools.storyEditor.filesTitle', 'Files')}</div>
              </div>
              <div className="w-[40px] text-right shrink-0">{t('tools.storyEditor.typeCol', 'Type')}</div>
            </div>

            <div className="flex flex-col gap-[4px]">
              {chapter.files?.map((file, index) => (
                <div 
                  key={`file-${file.id}`}
                  onClick={() => onSelectFile(index)}
                  className="group relative flex flex-row items-center justify-between px-[16px] py-[8px] rounded-[8px] hover:bg-[#1A1A1D] cursor-pointer transition-colors"
                >
                  <div className="flex flex-row items-center gap-[16px] flex-1 min-w-0">
                    <div className="w-[32px] flex justify-center shrink-0">
                      <FileText size={16} className="text-[#606065] group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <span className="text-[0.85rem] text-[#D4D4D6] group-hover:text-white transition-colors truncate">
                        {file.title}.{file.extension}
                      </span>
                      <span className="text-[0.65rem] text-[#606065] font-mono truncate">
                        Unlock: {file.unlockConditions?.length ? file.unlockConditions.join(',') : 'None'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-[8px] shrink-0 justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteFile(index); }}
                      className="opacity-0 group-hover:opacity-100 p-[4px] text-[#606065] hover:text-white hover:bg-red-500 rounded-[4px] transition-all cursor-pointer bg-transparent border-none"
                      title={t('tools.storyEditor.deleteFile', 'Delete File')}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-[0.7rem] text-[#606065] uppercase tracking-widest text-right w-[40px]">
                      DOC
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addFile}
                className="mt-[4px] py-[8px] rounded-[8px] bg-transparent border border-dashed border-[#2A2A2E] hover:border-blue-400/50 hover:bg-blue-400/5 text-[#606065] hover:text-blue-400 transition-colors cursor-pointer flex items-center justify-center gap-[8px] text-[0.7rem] uppercase tracking-widest font-bold"
              >
                <Plus size={14} /> {t('tools.storyEditor.addFile', 'Add File')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
