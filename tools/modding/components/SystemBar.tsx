import React from 'react';
import { Download, Terminal, Settings, Wand2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../src/store/useUIStore';

interface SystemBarProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onOpenBatchGenerator: () => void;
}

export const SystemBar: React.FC<SystemBarProps> = ({ onFileUpload, onExport, onOpenBatchGenerator }) => {
  const { t } = useTranslation();
  const { toggleSettings } = useUIStore();

  return (
    <div className="relative z-20 flex items-center justify-between h-14 px-4 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-app-primary/10 dark:bg-app-primary/20 text-app-primary dark:text-app-primary">
          <Terminal size={18} />
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t('tools.storyEditor.name', 'Story Editor')}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenBatchGenerator}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-app-primary dark:hover:text-app-primary hover:bg-app-primary/10 dark:hover:bg-app-primary/20 rounded-md transition-colors"
        >
          <Wand2 size={16} />
          <span className="hidden sm:inline">{t('tools.storyEditor.batchGenerate', 'Batch Generate')}</span>
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

        <button 
          onClick={toggleSettings}
          className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={t('settings.main.title', 'Settings')}
        >
          <Settings size={18} />
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

        <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer">
          <Upload size={16} />
          <span className="hidden sm:inline">{t('tools.storyEditor.importBtn', 'Import JSON')}</span>
          <input type="file" accept=".json" onChange={onFileUpload} className="hidden" />
        </label>
        
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-app-primary hover:bg-app-primary/90 rounded-md transition-colors shadow-sm ml-1"
        >
          <Download size={16} />
          <span className="hidden sm:inline">{t('tools.storyEditor.exportBtn', 'Export JSON')}</span>
        </button>
      </div>
    </div>
  );
};
