import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FileData } from '../../../types/story';
import { getFileIcon } from '../../../utils/ui/fileIcons';
import { FileRenderer } from './FileRenderer';

interface FileViewerProps {
  file: FileData;
  onClose: () => void;
  hideHeader?: boolean;
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, hideHeader = false }) => {

  const { t } = useTranslation();

  return (
    <div className={`w-full h-full flex flex-col bg-modal-bg text-modal-text ${hideHeader ? '' : 'animate-fade-in'}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0 z-10 shadow-sm relative">
          <div className="flex items-center gap-[16px] min-w-0">
            <button
              onClick={onClose}
              className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-app-primary transition-colors shrink-0 bg-transparent border-none cursor-pointer outline-none"
            >
              <ArrowLeft size={18} strokeWidth={2} />
              <span className="text-[0.9rem] font-medium tracking-wider">{t('tools.storyEditor.back')}</span>
            </button>
            <div className="w-px h-6 bg-card-border mx-2" />
            <div className="flex items-center gap-3 truncate">
            {getFileIcon(file.extension)}
            <h2 className="m-0 text-[1.1rem] font-semibold text-app-text truncate">
              {file.title}.<span className="opacity-60">{file.extension}</span>
            </h2>
          </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-modal-bg relative">
        <FileRenderer file={file} />
      </div>
    </div>
  );
};
