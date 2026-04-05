import React from 'react';
import { Info, FileText, Palette, Type, Save, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SettingsPanel = 'main' | 'about' | 'rules' | 'changelog' | 'theme' | 'stats' | 'save' | 'api' | 'font';

export const MainPanel: React.FC<{ setActivePanel: (panel: SettingsPanel) => void }> = ({ setActivePanel }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[12px] p-[24px]">
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('about')}>
        <Info size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.doc.about', '关于游戏')}</span>
      </button>
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('rules')}>
        <FileText size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.doc.rules', '规则说明')}</span>
      </button>
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('changelog')}>
        <FileText size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.doc.changelog', '更新日志')}</span>
      </button>
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('theme')}>
        <Palette size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.theme.title', '主题设置')}</span>
      </button>
      
      {/* Toggle Items */}
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('language' as SettingsPanel)}>
        <Languages size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.main.language', '语言')}</span>
      </button>

      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('font')}>
        <Type size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.font.title', '文档字体设置')}</span>
      </button>

      {/* AI Settings temporarily hidden
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('api')}>
        <Cpu size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.api.title', 'AI 设置')}</span>
      </button>
      */}

      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('save')}>
        <Save size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">{t('settings.save.title', '存档管理')}</span>
      </button>
    </div>
  );
};