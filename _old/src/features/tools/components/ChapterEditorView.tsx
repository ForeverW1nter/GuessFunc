import React, { useRef, useLayoutEffect } from 'react';
import { Plus, Trash2, FolderOpen, FileCode, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RouteData, ChapterData } from '../../../types/story';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';

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
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 md:px-10 py-6 md:py-8 border-b border-border bg-card">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground m-0 flex items-center gap-3 w-full mt-1">
            <FolderOpen className="text-primary w-8 h-8 shrink-0" />
            <input 
              type="text" 
              value={chapter.title || ''}
              onChange={(e) => updateChapter('title', e.target.value)}
              className="bg-transparent border-b-2 border-transparent hover:border-border focus:border-primary text-foreground outline-none transition-colors w-full pb-1 font-mono"
              placeholder={t('tools.storyEditor.untitled')}
            />
          </h2>
          <button 
            onClick={() => deleteChapter(chapterIndex)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer bg-transparent border-none shrink-0 mt-1"
            title={t('tools.storyEditor.deleteChapter')}
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground font-mono flex items-center gap-2 ml-11">
            <TextWithCodeFont text={`${t('tools.storyEditor.path')} ~/${route.id}/`} />
            <input 
              type="text" 
              value={chapter.id}
              onChange={(e) => updateChapter('id', e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-primary/50 focus:border-primary text-foreground outline-none transition-colors w-32 pb-0.5 font-mono pt-1"
            />
          </div>
        </div>
      </div>

      {/* Files List - 两栏布局 */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar bg-background"
      >
        <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-8">
          {/* 左栏：Levels */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 text-center shrink-0"><TextWithCodeFont text={t('tools.storyEditor.sts')} /></div>
                <div className="truncate"><TextWithCodeFont text={t('tools.storyEditor.levelsTitle')} /></div>
              </div>
              <div className="w-16 text-right shrink-0"><TextWithCodeFont text={t('tools.storyEditor.typeCol')} /></div>
            </div>
            
            <div className="flex flex-col gap-2">
              {chapter.levels.map((level, index) => (
                <div 
                  key={`level-${level.id}`}
                  onClick={() => onSelectLevel(index)}
                  className="group relative flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 flex justify-center shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileCode size={18} />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate flex items-center gap-2 font-mono">
                        {level.id}.exe 
                        <span className="text-xs font-normal text-muted-foreground truncate">
                          <TextWithCodeFont text={level.title} />
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        f(x) = {level.targetFunction}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLevel(index); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer bg-transparent border-none"
                      title={t('tools.storyEditor.deleteLevel')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="text-[10px] font-bold text-muted-foreground  bg-muted px-2 py-1 rounded w-12 text-center">
                      <TextWithCodeFont text={t('tools.storyEditor.level')} />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addLevel}
                className="mt-2 py-3 rounded-xl bg-transparent border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={18} /> <TextWithCodeFont text={t('tools.storyEditor.addLevel')} />
              </button>
            </div>
          </div>

          {/* 右栏：Files */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 text-center shrink-0"><TextWithCodeFont text={t('tools.storyEditor.sts')} /></div>
                <div className="truncate"><TextWithCodeFont text={t('tools.storyEditor.filesTitle')} /></div>
              </div>
              <div className="w-16 text-right shrink-0"><TextWithCodeFont text={t('tools.storyEditor.typeCol')} /></div>
            </div>

            <div className="flex flex-col gap-2">
              {chapter.files?.map((file, index) => (
                <div 
                  key={`file-${file.id}`}
                  onClick={() => onSelectFile(index)}
                  className="group relative flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 flex justify-center shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText size={18} />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate font-mono">
                        <TextWithCodeFont text={`${file.title}.${file.extension}`} />
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5 truncate">
                        <TextWithCodeFont text={`${t('tools.storyEditor.unlockCondition')}: ${file.unlockConditions?.length ? file.unlockConditions.join(', ') : t('common.none')}`} />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteFile(index); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer bg-transparent border-none"
                      title={t('tools.storyEditor.deleteFile')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="text-[10px] font-bold text-muted-foreground  bg-muted px-2 py-1 rounded w-12 text-center">
                      <TextWithCodeFont text={t('tools.storyEditor.doc')} />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addFile}
                className="mt-2 py-3 rounded-xl bg-transparent border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={18} /> <TextWithCodeFont text={t('tools.storyEditor.addFile')} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
