import React from 'react';
import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';

export const WorkspaceEmptyState: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4 bg-background">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
        <Terminal size={32} className="opacity-50" />
      </div>
      <div className="text-sm font-medium tracking-wide"><TextWithCodeFont text={t('tools.storyEditor.emptySelect')} /></div>
    </div>
  );
};
