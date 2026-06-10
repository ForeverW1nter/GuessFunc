import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FileData } from '../../../types/story';
import { getFileIcon } from '../../../utils/ui/fileIcons';
import { FileViewer } from '../../story/components/FileViewer';

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
    <div className="w-full h-full flex flex-col bg-modal-bg text-modal-text">
      <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-[16px] min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-app-primary transition-colors shrink-0 bg-transparent border-none cursor-pointer outline-none"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            <span className="text-[0.9rem] font-medium tracking-wider">{t('tools.storyEditor.back', 'BACK')}</span>
          </button>
          <div className="w-px h-6 bg-card-border mx-2" />
          <div className="flex items-center gap-3 truncate">
            {getFileIcon(file.extension)}
            <h2 className="m-0 text-[1.1rem] font-semibold text-app-text truncate">
              {file.title}.<span className="opacity-60">{file.extension}</span>
            </h2>
          </div>
        </div>
        <button 
          onClick={() => onDelete(fileIndex)}
          className="text-[#606065] hover:text-red-500 hover:bg-[rgba(239,68,68,0.1)] bg-transparent border-none cursor-pointer p-2 rounded-md transition-colors"
          title={t('tools.storyEditor.deleteFile', 'Delete File')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6 flex flex-col max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-[0.7rem] tracking-widest uppercase font-medium text-[#A0A0A5]">{t('tools.storyEditor.fileNamePlaceholder', 'File Name')}</label>
            <input 
              type="text" 
              value={file.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-app-bg border border-card-border rounded-lg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-app-primary focus:border-app-primary transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-32">
            <label className="text-[0.7rem] tracking-widest uppercase font-medium text-[#A0A0A5] md:text-center">{t('tools.storyEditor.extensionPlaceholder', 'Extension')}</label>
            <input 
              type="text" 
              value={file.extension}
              onChange={(e) => onUpdate('extension', e.target.value)}
              className="w-full bg-app-bg border border-card-border rounded-lg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-app-primary focus:border-app-primary transition-all md:text-center font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-[0.7rem] tracking-widest uppercase font-medium text-[#A0A0A5]">{t('tools.storyEditor.unlockPlaceholder', 'Unlock Condition (Level IDs)')}</label>
            <input 
              type="text" 
              value={file.unlockConditions?.join(',') || ''}
              onChange={(e) => onUpdate('unlockConditions', e.target.value ? e.target.value.split(',') : [])}
              className="w-full bg-app-bg border border-card-border rounded-lg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-app-primary focus:border-app-primary transition-all font-mono"
              placeholder="e.g. 1,2"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[400px]">
          {/* 代码编辑区 */}
          <div className="flex flex-col gap-2 flex-1 h-full">
            <label className="text-[0.7rem] tracking-widest uppercase font-medium text-app-primary">{t('tools.storyEditor.contentPlaceholder', 'Content (Markdown)')}</label>
            <textarea 
              value={file.content}
              onChange={(e) => onUpdate('content', e.target.value)}
              className="w-full h-[400px] lg:h-full bg-app-bg border border-card-border rounded-lg p-4 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-app-primary focus:border-app-primary transition-all resize-none custom-scrollbar font-mono leading-relaxed shadow-sm"
            />
          </div>
          {/* 渲染预览区 */}
          <div className="flex flex-col gap-2 flex-1 h-full min-w-0 border border-card-border rounded-lg overflow-hidden shadow-sm relative">
            <FileViewer file={file} onClose={() => {}} hideHeader={true} />
          </div>
        </div>
      </div>
    </div>
  );
};