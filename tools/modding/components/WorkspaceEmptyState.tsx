import React from 'react';
import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const WorkspaceEmptyState: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-[#606065] gap-[16px]">
      <Terminal size={48} className="opacity-20" />
      <div className="text-[0.85rem] tracking-widest uppercase">{t('tools.storyEditor.emptySelect', 'Please select a directory to view its contents')}</div>
    </div>
  );
};
