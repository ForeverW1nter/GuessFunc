import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../../src/store/useUIStore';
import { useTranslation } from 'react-i18next';
import { ThemePanel } from '../../../src/features/ui/components/settings/ThemePanel';
import { LanguagePanel } from '../../../src/features/ui/components/settings/LanguagePanel';

export const ToolsSettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { t } = useTranslation();

  if (!isSettingsOpen) return null;

  const handleClose = () => {
    setSettingsOpen(false);
    setTimeout(() => {
      setIsFadingOut(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-fade-in"
        onClick={handleClose}
      />

      <div className={`relative w-full md:max-w-[600px] h-full md:h-[85vh] bg-modal-bg text-modal-text md:rounded-[16px] shadow-modal border-none md:border md:border-card-border flex flex-col transition-all duration-300 transform scale-100 opacity-100 overflow-hidden`}>
        <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0">
          <div className="flex items-center gap-[15px]">
            <h2 className="m-0 text-[1.25rem] font-semibold text-app-text transition-opacity duration-200">
              {t('settings.main.title')}
            </h2>
          </div>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="w-[40px] h-[40px] flex items-center justify-center text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] hover:rotate-90 rounded-full transition-all cursor-pointer border-none bg-transparent"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-[24px] text-[1rem] leading-[1.6] transition-all duration-150 ease-in-out ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} flex flex-col gap-6`}>
          <div>
            <h3 className="text-lg font-medium mb-4 text-app-text">{t('settings.theme.title')}</h3>
            <ThemePanel />
          </div>
          <div className="w-full h-px bg-card-border" />
          <div>
            <h3 className="text-lg font-medium mb-4 text-app-text">{t('settings.main.language')}</h3>
            <LanguagePanel />
          </div>
        </div>
      </div>
    </div>
  );
};
