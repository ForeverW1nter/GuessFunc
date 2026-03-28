import React, { useState } from 'react';
import { ChevronLeft, Info, FileText, ClipboardList, Palette, Type, Bot, Save, X } from 'lucide-react';
import { useUIStore } from '../../../store/useUIStore';

import { ThemePanel } from './settings/ThemePanel';
import { FontPanel } from './settings/FontPanel';
import { SavePanel } from './settings/SavePanel';
import { ApiPanel } from './settings/ApiPanel';
import { MarkdownPanel } from './settings/MarkdownPanel';

export const SettingsOption = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) => (
  <button 
    className="group relative overflow-hidden flex items-center gap-[12px] px-[20px] py-[16px] text-[1.05rem] font-medium bg-option-bg text-option-text border border-card-border rounded-[10px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.2)] hover:border-app-primary dark:hover:border-[rgba(var(--primary-color-rgb),0.6)] hover:bg-[rgba(var(--primary-color-rgb),0.15)] hover:text-app-text dark:hover:text-option-text"
    onClick={onClick}
  >
    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-app-primary scale-y-0 transition-transform duration-200 ease-out group-hover:scale-y-100" />
    <Icon size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
    <span>{label}</span>
  </button>
);

// Mock Markdown Panels for demonstration
const MainPanel = ({ setActivePanel }: { setActivePanel: (p: string) => void }) => {
  return (
    <div className="p-[20px] overflow-y-auto max-h-[80vh] no-scrollbar flex flex-col gap-[12px]">
      <SettingsOption icon={Info} label="关于游戏" onClick={() => setActivePanel('about')} />
      <SettingsOption icon={FileText} label="规则说明" onClick={() => setActivePanel('rules')} />
      <SettingsOption icon={ClipboardList} label="更新日志" onClick={() => setActivePanel('changelog')} />
      <SettingsOption icon={Palette} label="主题设置" onClick={() => setActivePanel('theme')} />
      <SettingsOption icon={Type} label="文档字体设置" onClick={() => setActivePanel('font')} />
      <SettingsOption icon={Bot} label="AI 设置" onClick={() => setActivePanel('api')} />
      <SettingsOption icon={Save} label="存档管理" onClick={() => setActivePanel('save')} />
    </div>
  );
};

export type SettingsPanel = 'main' | 'about' | 'rules' | 'changelog' | 'theme' | 'save' | 'api' | 'font';

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
      case 'main': return '设置中心';
      case 'about': return '关于游戏';
      case 'rules': return '规则说明';
      case 'changelog': return '更新日志';
      case 'theme': return '主题设置';
      case 'font': return '自定义字体';
      case 'save': return '存档管理';
      case 'api': return 'AI 设置';
      default: return '设置中心';
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
      <div className={`relative w-full ${['about', 'rules', 'changelog'].includes(activePanel) ? 'md:max-w-[1000px]' : 'md:max-w-[600px]'} h-full md:h-[85vh] bg-modal-bg text-modal-text md:rounded-[16px] shadow-modal overflow-hidden border-none md:border md:border-card-border flex flex-col transition-all duration-300 transform scale-100 opacity-100`}>
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
          {displayPanel === 'save' && <SavePanel />}
          {displayPanel === 'api' && <ApiPanel />}
        </div>
      </div>
    </div>
  );
};