import { useTranslation } from 'react-i18next';
import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { MarkdownPanel } from './settings/MarkdownPanel';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipContent: string | null;
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose, tipContent }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-[20px] bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[500px] bg-modal-bg text-modal-text rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-card-border overflow-hidden flex flex-col max-h-[80vh] animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-card-border bg-app-bg shrink-0">
          <div className="flex items-center gap-[12px]">
            <Lightbulb size={20} className="text-app-primary" />
            <h2 className="m-0 text-[1.25rem] font-bold text-app-text tracking-[0.5px]">{t('tips.title')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-[8px] rounded-full text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] transition-all border-none bg-transparent cursor-pointer"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-[24px] overflow-y-auto custom-scrollbar">
          {tipContent ? (
            <MarkdownPanel mdText={tipContent} />
          ) : (
            <div className="text-center text-[#606065] py-[40px]">
              本关卡暂无提示。
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-[16px] border-t border-card-border bg-app-bg flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-[20px] py-[8px] rounded-[8px] font-medium text-[0.95rem] bg-[rgba(128,128,128,0.1)] text-app-text hover:bg-[rgba(128,128,128,0.2)] transition-colors border-none cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
