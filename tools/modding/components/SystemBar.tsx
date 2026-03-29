import React from 'react';
import { Download, Terminal, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../src/store/useUIStore';

interface SystemBarProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const SystemBar: React.FC<SystemBarProps> = ({ onFileUpload, onExport }) => {
  const { t } = useTranslation();
  const { toggleSettings } = useUIStore();

  return (
    <div className="relative z-20 flex items-center justify-between h-[48px] px-[16px] shrink-0 border-b border-[#2A2A2E] bg-[#121214]">
      <div className="flex items-center gap-[16px]">
        <span className="text-[0.85rem] uppercase tracking-wider text-[#A0A0A5] font-bold flex items-center gap-[8px]">
          <Terminal size={16} className="text-app-primary" />
          {t('tools.storyEditor.name', 'Story Editor')}
        </span>
      </div>
      
      <div className="flex items-center gap-[16px]">
        <button 
          onClick={toggleSettings}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-[#A0A0A5] transition-colors"
          title={t('settings.main.title', 'Settings')}
        >
          <Settings size={18} />
        </button>

        <div className="w-[1px] h-[16px] bg-[#2A2A2E]"></div>

        <label className="flex items-center gap-[8px] text-[0.75rem] text-[#A0A0A5] hover:text-white transition-colors cursor-pointer tracking-widest uppercase">
          <span>{t('tools.storyEditor.importBtn', 'Import JSON')}</span>
          <input type="file" accept=".json" onChange={onFileUpload} className="hidden" />
        </label>
        <div className="w-[1px] h-[16px] bg-[#2A2A2E]"></div>
        <button 
          onClick={onExport}
          className="flex items-center gap-[8px] text-[0.75rem] text-app-primary hover:text-app-primary/80 transition-colors bg-transparent border-none cursor-pointer tracking-widest uppercase"
        >
          <Download size={14} />
          <span>{t('tools.storyEditor.exportBtn', 'Export JSON')}</span>
        </button>
      </div>
    </div>
  );
};
