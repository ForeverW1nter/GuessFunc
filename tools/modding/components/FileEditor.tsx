import React from 'react';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FileData } from '../../../src/types/story';
import { MarkdownPanel } from '../../../src/features/ui/components/settings/MarkdownPanel';

interface FileEditorProps {
  file: FileData;
  fileIndex: number;
  onUpdate: (field: keyof FileData, value: unknown) => void;
  onDelete: (index: number) => void;
  onBack: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  file,
  fileIndex,
  onUpdate,
  onDelete,
  onBack
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between h-14 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shrink-0 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{t('tools.storyEditor.back', 'Back')}</span>
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-app-primary/10 dark:bg-app-primary/20 text-app-primary dark:text-app-primary shrink-0">
            <FileText size={18} />
          </div>
          <h2 className="m-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {file.title}.{file.extension}
          </h2>
        </div>
        <button 
          onClick={() => onDelete(fileIndex)}
          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent border-none cursor-pointer p-2 rounded-md transition-colors"
          title={t('tools.storyEditor.deleteFile', 'Delete File')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6 flex flex-col max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.fileNamePlaceholder', 'File Name')}</label>
            <input 
              type="text" 
              value={file.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-32">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 md:text-center">{t('tools.storyEditor.extensionPlaceholder', 'Extension')}</label>
            <input 
              type="text" 
              value={file.extension}
              onChange={(e) => onUpdate('extension', e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all md:text-center font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.unlockPlaceholder', 'Unlock Condition (Level IDs)')}</label>
            <input 
              type="text" 
              value={file.unlockConditions?.join(',') || ''}
              onChange={(e) => onUpdate('unlockConditions', e.target.value ? e.target.value.split(',') : [])}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all font-mono"
              placeholder="e.g. 1,2"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[400px]">
          {/* 代码编辑区 */}
          <div className="flex flex-col gap-2 flex-1 h-full">
            <label className="text-sm font-medium text-app-primary dark:text-app-primary">{t('tools.storyEditor.contentPlaceholder', 'Content (Markdown)')}</label>
            <textarea 
              value={file.content}
              onChange={(e) => onUpdate('content', e.target.value)}
              className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all resize-none custom-scrollbar font-mono leading-relaxed shadow-sm"
            />
          </div>
          {/* Markdown 渲染预览区 */}
          <div className="flex flex-col gap-2 flex-1 h-full min-w-0">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.preview', 'Preview')}</label>
            <div className="w-full h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg p-0 overflow-y-auto custom-scrollbar markdown-body-dark relative shadow-sm">
              <div className="absolute inset-0">
                <MarkdownPanel mdText={file.content} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
