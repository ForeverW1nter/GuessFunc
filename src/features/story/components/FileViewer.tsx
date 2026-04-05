import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FileData } from '../../../types/story';
import { getFileIcon } from '../utils/fileIcons';
import {
  LogViewer,
  MemoViewer,
  ImageViewer,
  AudioViewer,
  MessageViewer,
  DocViewer,
  EndingAnimationViewer,
  FakeEndingAnimationViewer,
  TrueEndingAnimationViewer,
  DefaultViewer
} from './viewers';

interface FileViewerProps {
  file: FileData;
  onClose: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {

  const { t } = useTranslation();

  const renderContent = () => {
    switch (file.extension.toLowerCase()) {
      case 'log':
      case 'dat':
      case 'cpp':
      case 'math':
        return <LogViewer content={file.content} title={file.title} extension={file.extension} />;
      case 'memo':
      case 'txt':
      case 'note':
      case 'letter':
        return <MemoViewer content={file.content} title={file.title} />;
      case 'msg':
        return <MessageViewer content={file.content} title={file.title} />;
      case 'jpg':
      case 'png':
      case 'svg':
        return <ImageViewer content={file.content} />;
      case 'trans':
      case 'wav':
        return <AudioViewer content={file.content} title={file.title} extension={file.extension} />;
      case 'pdf':
      case 'rule':
      case 'rcpt':
        return <DocViewer content={file.content} title={file.title} extension={file.extension} />;
      case 'anim':
        if (file.content === 'fakeEnding') {
          return <FakeEndingAnimationViewer content={file.content} onClose={onClose} />;
        } else if (file.content === 'trueEnding') {
          return <TrueEndingAnimationViewer content={file.content} onClose={onClose} />;
        }
        return <EndingAnimationViewer content={file.content} onClose={onClose} />;
      default:
        return <DefaultViewer content={file.content} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-modal-bg text-modal-text animate-fade-in">
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
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-modal-bg relative">
        {renderContent()}
      </div>
    </div>
  );
};
