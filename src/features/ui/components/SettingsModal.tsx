import React, { useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useUIStore } from '../../../store/useUIStore';
import { useTranslation } from 'react-i18next';

import { ThemePanel } from './settings/ThemePanel';
import { FontPanel } from './settings/FontPanel';
import { SavePanel } from './settings/SavePanel';
import { ApiPanel } from './settings/ApiPanel';
import { MarkdownPanel } from './settings/MarkdownPanel';
import { LanguagePanel } from './settings/LanguagePanel';
import { MainPanel } from './settings/MainPanel';

export type SettingsPanel = 'main' | 'about' | 'rules' | 'changelog' | 'theme' | 'save' | 'api' | 'font' | 'language';

import aboutMd from '../../../../docs/about.md?raw';
import rulesMd from '../../../../docs/rules.md?raw';
import changelogMd from '../../../../docs/changelog.md?raw';

const ABOUT_TEXT = aboutMd;
const RULES_TEXT = rulesMd;
const CHANGELOG_TEXT = changelogMd;

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  const [activePanel, setActivePanel] = useState<SettingsPanel>('main');
  const [displayPanel, setDisplayPanel] = useState<SettingsPanel>('main');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { t } = useTranslation();

  if (!isSettingsOpen) return null;

  const handlePanelSwitch = (newPanel: SettingsPanel) => {
    if (newPanel === activePanel) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setActivePanel(newPanel);
      setDisplayPanel(newPanel);
      setIsFadingOut(false);
    }, 150); // 与旧版的 150ms 匹配
  };

  const handleClose = () => {
    setSettingsOpen(false);
    setTimeout(() => {
      setActivePanel('main');
      setDisplayPanel('main');
      setIsFadingOut(false);
    }, 200);
  };

  const getPanelTitle = () => {
    switch (activePanel) {
      case 'main': return t('settings.title');
      case 'about': return t('settings.doc.about');
      case 'rules': return t('settings.doc.rules');
      case 'changelog': return t('settings.doc.changelog');
      case 'theme': return t('settings.theme.title');
      case 'font': return t('settings.font.title');
      case 'language': return t('settings.language.title');
      case 'save': return t('settings.save.title');
      case 'api': return t('settings.api.title');
      default: return t('settings.title');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${['about', 'rules', 'changelog'].includes(activePanel) ? 'md:max-w-[1000px]' : 'md:max-w-[600px]'} h-full md:h-[85vh] bg-modal-bg text-modal-text md:rounded-[16px] shadow-modal border-none md:border md:border-card-border flex flex-col transition-all duration-300 transform scale-100 opacity-100 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0">
          <div className="flex items-center gap-[15px]">
            {activePanel !== 'main' && (
              <button
                onClick={() => handlePanelSwitch('main')}
                className="w-[40px] h-[40px] flex items-center justify-center text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] rounded-full transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="m-0 text-[1.25rem] font-semibold text-app-text transition-opacity duration-200">
              {getPanelTitle()}
            </h2>
          </div>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="w-[40px] h-[40px] flex items-center justify-center text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] hover:rotate-90 rounded-full transition-all"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-[24px] text-[1rem] leading-[1.6] transition-all duration-150 ease-in-out ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {displayPanel === 'main' && <MainPanel setActivePanel={(p: string) => handlePanelSwitch(p as SettingsPanel)} />}
          {displayPanel === 'about' && <MarkdownPanel mdText={ABOUT_TEXT} />}
          {displayPanel === 'rules' && <MarkdownPanel mdText={RULES_TEXT} />}
          {displayPanel === 'changelog' && <MarkdownPanel mdText={CHANGELOG_TEXT} />}
          {displayPanel === 'theme' && <ThemePanel />}
          {displayPanel === 'font' && <FontPanel />}
          {displayPanel === 'language' && <LanguagePanel />}
          {displayPanel === 'save' && <SavePanel />}
          {displayPanel === 'api' && <ApiPanel />}
        </div>
      </div>
    </div>
  );
};