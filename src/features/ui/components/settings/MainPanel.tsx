import React from 'react';
import { Info, FileText, Palette, Type, Save, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SettingsPanel = 'main' | 'about' | 'rules' | 'changelog' | 'theme' | 'save' | 'api' | 'font' | 'language';

const SettingsButton = ({ icon: Icon, label, panel, setActivePanel }: { icon: React.ElementType, label: string, panel: SettingsPanel, setActivePanel: (panel: SettingsPanel) => void }) => (
  <button 
    className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" 
    onClick={() => setActivePanel(panel)}
  >
    <Icon size={18} className="opacity-70" />
    <span className="font-medium text-[1rem]">{label}</span>
  </button>
);

export const MainPanel: React.FC<{ setActivePanel: (panel: SettingsPanel) => void }> = ({ setActivePanel }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[12px] p-[24px]">
      <SettingsButton icon={Info} label={t('settings.doc.about')} panel="about" setActivePanel={setActivePanel} />
      <SettingsButton icon={FileText} label={t('settings.doc.rules')} panel="rules" setActivePanel={setActivePanel} />
      <SettingsButton icon={FileText} label={t('settings.doc.changelog')} panel="changelog" setActivePanel={setActivePanel} />
      <SettingsButton icon={Palette} label={t('settings.theme.title')} panel="theme" setActivePanel={setActivePanel} />
      
      {/* Toggle Items */}
      <SettingsButton icon={Languages} label={t('settings.main.language')} panel="language" setActivePanel={setActivePanel} />
      <SettingsButton icon={Type} label={t('settings.font.menuTitle')} panel="font" setActivePanel={setActivePanel} />

      {/* AI Settings temporarily hidden
      <SettingsButton icon={Cpu} label={t('settings.api.title')} panel="api" setActivePanel={setActivePanel} />
      */}

      <SettingsButton icon={Save} label={t('settings.save.title')} panel="save" setActivePanel={setActivePanel} />
    </div>
  );
};