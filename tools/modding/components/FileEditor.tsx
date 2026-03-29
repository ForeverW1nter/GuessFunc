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
    <div className="w-full h-full flex flex-col bg-modal-bg text-modal-text">
      <div className="flex items-center justify-between h-[48px] px-[16px] border-b border-[#2A2A2E] bg-[#0A0A0B] shrink-0">
        <div className="flex items-center gap-[12px] min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-white transition-colors shrink-0 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span className="text-[0.85rem] uppercase tracking-wider">{t('tools.storyEditor.back', 'BACK')}</span>
          </button>
          <div className="w-[1px] h-[16px] bg-[#2A2A2E]"></div>
          <FileText size={16} className="text-blue-400 shrink-0" />
          <h2 className="m-0 text-[0.9rem] font-semibold text-white truncate">
            {file.title}.{file.extension}
          </h2>
        </div>
        <button 
          onClick={() => onDelete(fileIndex)}
          className="text-red-500 hover:text-white bg-transparent border-none cursor-pointer p-[4px]"
          title={t('tools.storyEditor.deleteFile', 'Delete File')}
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-[24px] md:p-[40px] space-y-[24px] flex flex-col">
        <div className="flex flex-row gap-[32px] items-center">
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.fileNamePlaceholder', 'File Name')}</label>
            <input 
              type="text" 
              value={file.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-[8px] w-[120px]">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest text-center">{t('tools.storyEditor.extensionPlaceholder', 'Extension')}</label>
            <input 
              type="text" 
              value={file.extension}
              onChange={(e) => onUpdate('extension', e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-blue-400 transition-colors text-center font-mono"
            />
          </div>
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.unlockPlaceholder', 'Unlock Condition (Level IDs)')}</label>
            <input 
              type="text" 
              value={file.unlockConditions?.join(',') || ''}
              onChange={(e) => onUpdate('unlockConditions', e.target.value ? e.target.value.split(',') : [])}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-blue-400 transition-colors font-mono"
              placeholder="e.g. 1,2"
            />
          </div>
        </div>

        <div className="flex flex-row gap-[32px] flex-1 min-h-0">
          {/* 代码编辑区 */}
          <div className="flex flex-col gap-[8px] flex-1 h-full">
            <label className="text-[0.7rem] text-blue-400 uppercase tracking-widest">{t('tools.storyEditor.contentPlaceholder', 'Content (Markdown)')}</label>
            <textarea 
              value={file.content}
              onChange={(e) => onUpdate('content', e.target.value)}
              className="w-full h-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-[4px] p-[16px] text-[0.9rem] text-[#D4D4D8] outline-none resize-none focus:border-blue-400 transition-colors custom-scrollbar font-mono leading-relaxed"
            />
          </div>
          {/* Markdown 渲染预览区 */}
          <div className="flex flex-col gap-[8px] flex-1 h-full min-w-0">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.preview', 'Preview')}</label>
            <div className="w-full h-full bg-[#0A0A0B] text-[#D4D4D8] border border-[#2A2A2E] rounded-[4px] p-0 overflow-y-auto custom-scrollbar markdown-body-dark relative">
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
