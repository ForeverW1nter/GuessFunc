import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FileData, FileUIType } from '../../../types/story';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';

import {
  LogViewer,
  MemoViewer,
  ImageViewer,
  AudioViewer,
  MessageViewer,
  DocViewer,
  DefaultViewer
} from '../../../features/story/components/viewers';

import { MessageEditor } from './editors/MessageEditor';
import { MailEditor } from './editors/MailEditor';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveUiType = () => {
    return file.uiType || 'default';
  };

  const activeUiType = getActiveUiType();

  const uiTypeOptions = [
    { value: 'default', label: t('tools.storyEditor.uiTypeDefault') },
    { value: 'log', label: t('tools.storyEditor.uiTypeLog') },
    { value: 'memo', label: t('tools.storyEditor.uiTypeMemo') },
    { value: 'message', label: t('tools.storyEditor.uiTypeMessage') },
    { value: 'mail', label: t('tools.storyEditor.uiTypeMail') },
    { value: 'image', label: t('tools.storyEditor.uiTypeImage') },
    { value: 'audio', label: t('tools.storyEditor.uiTypeAudio') },
    { value: 'doc', label: t('tools.storyEditor.uiTypeDoc') },
  ];

  const currentUiTypeLabel = uiTypeOptions.find(opt => opt.value === activeUiType)?.label || uiTypeOptions[0].label;

  const getEditorStyle = () => {
    switch (activeUiType) {
      case 'log':
        return "bg-card text-foreground border-l-[4px] border-primary/50 shadow-inner"; // Terminal style
      case 'memo':
        return "bg-primary/5 text-foreground"; // Paper style
      case 'message':
      case 'mail':
      case 'doc':
        return "bg-background text-primary border-l-[4px] border-primary/50 shadow-inner"; // JSON code editor style
      case 'audio':
      case 'image':
        return "bg-muted/20 text-foreground";
      default:
        return "bg-card text-foreground";
    }
  };

  const renderPreview = () => {
    const stringContent = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
    
    switch (activeUiType) {
      case 'log':
        return <LogViewer content={stringContent} title={file.title} extension={file.extension} />;
      case 'memo':
        return <MemoViewer content={stringContent} title={file.title} />;
      case 'message':
      case 'mail':
        return <MessageViewer content={stringContent} title={file.title} />;
      case 'image':
        return <ImageViewer content={stringContent} />;
      case 'audio':
        return <AudioViewer content={stringContent} title={file.title} extension={file.extension} />;
      case 'doc':
        return <DocViewer content={stringContent} title={file.title} extension={file.extension} />;
      case 'default':
      default:
        return <DefaultViewer content={stringContent} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between h-14 px-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium"><TextWithCodeFont text={t('tools.storyEditor.back')} /></span>
          </button>
          <div className="w-px h-5 bg-border"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText size={18} />
          </div>
          <h2 className="m-0 text-sm font-semibold text-foreground truncate font-mono">
            {file.title}.{file.extension}
          </h2>
        </div>
        <button 
          onClick={() => onDelete(fileIndex)}
          className="text-muted-foreground hover:text-destructive hover:text-destructive hover:bg-destructive/10 hover:bg-destructive/20 bg-transparent border-none cursor-pointer p-2 rounded-md transition-colors"
          title={t('tools.storyEditor.deleteFile')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6 flex flex-col max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.fileNamePlaceholder')} /></label>
            <input 
              type="text" 
              value={file.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-32">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.extensionPlaceholder')} /></label>
            <input 
              type="text" 
              value={file.extension}
              onChange={(e) => onUpdate('extension', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-40 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.uiType')} /></label>
            <div 
              className={`w-full h-[42px] bg-card border ${isDropdownOpen ? 'border-primary' : 'border-border hover:border-primary'} rounded-lg px-4 py-2.5 text-sm text-foreground transition-all shadow-sm flex items-center justify-between cursor-pointer select-none font-mono`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate mr-2"><TextWithCodeFont text={currentUiTypeLabel} /></span>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            <div 
              className={`absolute top-[calc(100%+8px)] left-0 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-[100] transition-all duration-300 origin-top ${isDropdownOpen ? 'opacity-100 visible scale-y-100 translate-y-0' : 'opacity-0 invisible scale-y-95 -translate-y-[10px]'}`}
            >
              {uiTypeOptions.map((opt) => (
                <div 
                  key={opt.value}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-all font-mono ${activeUiType === opt.value ? 'bg-primary/10 text-primary font-medium border-l-[3px] border-primary' : 'text-foreground hover:bg-muted border-l-[3px] border-transparent'}`}
                  onClick={() => {
                    onUpdate('uiType', opt.value === 'default' ? undefined : opt.value as FileUIType);
                    setIsDropdownOpen(false);
                  }}
                >
                  <TextWithCodeFont text={opt.label} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.unlockPlaceholder')} /></label>
            <input 
              type="text" 
              value={file.unlockConditions?.join(',') || ''}
              onChange={(e) => onUpdate('unlockConditions', e.target.value ? e.target.value.split(',') : [])}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
              placeholder="e.g. 1,2"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-6 flex-1 min-h-[400px] mt-2 lg:mt-0">
          {/* 代码编辑?*/}
          <div className="flex flex-col gap-2 flex-1 lg:h-full min-h-[400px] lg:min-h-0">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.contentPlaceholder')} /></label>
            <div className={`w-full h-full min-h-[400px] lg:min-h-0 border border-border rounded-lg text-sm transition-all overflow-hidden shadow-sm flex flex-col bg-card`}>
              {activeUiType === 'message' ? (
                <div className="flex-1 p-4 overflow-hidden"><MessageEditor value={file.content} onChange={(val) => onUpdate('content', val)} /></div>
              ) : activeUiType === 'mail' ? (
                <div className="flex-1 p-4 overflow-hidden"><MailEditor value={file.content} onChange={(val) => onUpdate('content', val)} /></div>
              ) : (
                <textarea 
                  value={typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2)}
                  onChange={(e) => onUpdate('content', e.target.value)}
                  className={`w-full h-full p-4 border-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none custom-scrollbar leading-relaxed font-mono bg-transparent ${getEditorStyle()}`}
                  placeholder={t('tools.storyEditor.contentPlaceholder')}
                />
              )}
            </div>
          </div>
          {/* 渲染预览?*/}
          <div className="flex flex-col gap-2 flex-1 min-w-0 lg:h-full mt-4 lg:mt-0">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.preview')} /></label>
            <div className="w-full h-full bg-card text-card-foreground border border-border rounded-lg lg:overflow-y-auto relative shadow-sm min-h-[400px] lg:min-h-0">
              <div className="lg:absolute lg:inset-0 min-h-full">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
