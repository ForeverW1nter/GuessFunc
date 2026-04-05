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
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="px-6 md:px-10 py-6 md:py-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 m-0 flex items-center gap-3 w-full">
            <FolderOpen className="text-app-primary dark:text-app-primary w-8 h-8 shrink-0" />
            <input 
              type="text" 
              value={chapter.title || ''}
              onChange={(e) => updateChapter('title', e.target.value)}
              className="bg-transparent border-b-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-app-primary text-zinc-900 dark:text-zinc-100 outline-none transition-colors w-full pb-1"
              placeholder={t('tools.storyEditor.untitled', 'Untitled Chapter')}
            />
          </h2>
          <button 
            onClick={() => deleteChapter(chapterIndex)}
            className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer bg-transparent border-none shrink-0"
            title={t('tools.storyEditor.deleteChapter', 'Delete Chapter')}
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-2">
            <span>{t('tools.storyEditor.path', 'Path:')} ~/{route.id}/</span>
            <input 
              type="text" 
              value={chapter.id}
              onChange={(e) => updateChapter('id', e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-app-primary text-zinc-700 dark:text-zinc-300 outline-none transition-colors w-32 pb-0.5"
            />
          </div>
          {isMobile && (
              <button
                onClick={onClose}
                className="text-xs text-app-primary dark:text-app-primary font-medium uppercase tracking-wider border border-app-primary/30 dark:border-app-primary/50 px-3 py-1 rounded-md bg-transparent"
              >
                {t('tools.storyEditor.close', 'Close')}
              </button>
          )}
        </div>
      </div>

      {/* Files List - 两栏布局 */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950/50"
      >
        <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-8">
          {/* 左栏：Levels */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 text-center shrink-0">{t('tools.storyEditor.sts', 'STS')}</div>
                <div className="truncate">{t('tools.storyEditor.levelsTitle', 'Levels')}</div>
              </div>
              <div className="w-16 text-right shrink-0">{t('tools.storyEditor.typeCol', 'Type')}</div>
            </div>
            
            <div className="flex flex-col gap-2">
              {chapter.levels.map((level, index) => (
                <div 
                  key={`level-${level.id}`}
                  onClick={() => onSelectLevel(index)}
                  className="group relative flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md hover:border-app-primary/40 dark:hover:border-app-primary/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 flex justify-center shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <FileCode size={18} />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                        {level.id}.exe 
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 truncate">{level.title}</span>
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                        f(x) = {level.targetFunction}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLevel(index); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer bg-transparent border-none"
                      title={t('tools.storyEditor.deleteLevel', 'Delete Level')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded w-12 text-center">
                      LVL
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addLevel}
                className="mt-2 py-3 rounded-xl bg-transparent border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 text-zinc-500 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={18} /> {t('tools.storyEditor.addLevel', 'Add Level')}
              </button>
            </div>
          </div>

          {/* 右栏：Files */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 text-center shrink-0">{t('tools.storyEditor.sts', 'STS')}</div>
                <div className="truncate">{t('tools.storyEditor.filesTitle', 'Files')}</div>
              </div>
              <div className="w-16 text-right shrink-0">{t('tools.storyEditor.typeCol', 'Type')}</div>
            </div>

            <div className="flex flex-col gap-2">
              {chapter.files?.map((file, index) => (
                <div 
                  key={`file-${file.id}`}
                  onClick={() => onSelectFile(index)}
                  className="group relative flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md hover:border-app-primary/40 dark:hover:border-app-primary/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 flex justify-center shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-app-primary/10 dark:bg-app-primary/20 flex items-center justify-center text-app-primary dark:text-app-primary">
                        <FileText size={18} />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {file.title}.{file.extension}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        Unlock: {file.unlockConditions?.length ? file.unlockConditions.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteFile(index); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer bg-transparent border-none"
                      title={t('tools.storyEditor.deleteFile', 'Delete File')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded w-12 text-center">
                      DOC
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addFile}
                className="mt-2 py-3 rounded-xl bg-transparent border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-app-primary dark:hover:border-app-primary hover:bg-app-primary/10 dark:hover:bg-app-primary/10 text-zinc-500 dark:text-zinc-400 hover:text-app-primary dark:hover:text-app-primary transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={18} /> {t('tools.storyEditor.addFile', 'Add File')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
