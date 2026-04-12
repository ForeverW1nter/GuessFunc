import React from 'react';
import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const WorkspaceEmptyState: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4 bg-zinc-50 dark:bg-zinc-950/50">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-2">
        <Terminal size={32} className="opacity-50" />
      </div>
      <div className="text-sm font-medium tracking-wide">{t('tools.storyEditor.emptySelect')}</div>
    </div>
  );
};
