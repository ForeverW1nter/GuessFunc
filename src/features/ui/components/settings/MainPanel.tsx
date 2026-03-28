import React from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import { Info, FileText, Palette, Zap, Type, Cpu, Save } from 'lucide-react';

type SettingsPanel = 'main' | 'about' | 'rules' | 'changelog' | 'theme' | 'stats' | 'save' | 'api' | 'font';

export const MainPanel: React.FC<{ setActivePanel: (panel: SettingsPanel) => void }> = ({ setActivePanel }) => {
  const { isSpeedrunMode, toggleSpeedrunMode } = useUIStore();

  return (
    <div className="flex flex-col gap-[12px] p-[24px]">
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('about')}>
        <Info size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">关于游戏</span>
      </button>
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('rules')}>
        <FileText size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">规则说明</span>
      </button>
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('changelog')}>
        <FileText size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">更新日志</span>
      </button>
      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('theme')}>
        <Palette size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">主题设置</span>
      </button>
      
      {/* Toggle Items */}
      <div className="flex items-center justify-between px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px]">
        <div className="flex items-center gap-[12px]">
          <Zap size={18} className="opacity-70" />
          <div className="flex flex-col">
            <span className="font-medium text-[1rem]">速通模式</span>
            <span className="text-xs opacity-50">直接解锁所有关卡，方便预览</span>
          </div>
        </div>
        <div 
          onClick={toggleSpeedrunMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isSpeedrunMode ? 'bg-app-primary' : 'bg-card-border'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform z-10 ${isSpeedrunMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </div>

      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('font')}>
        <Type size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">文档字体设置</span>
      </button>

      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('api')}>
        <Cpu size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">AI 设置</span>
      </button>

      <button className="flex items-center gap-[12px] px-[16px] py-[14px] border border-card-border bg-card-bg text-app-text rounded-[12px] hover:border-app-primary hover:bg-card-hover transition-all transform hover:-translate-y-[1px]" onClick={() => setActivePanel('save')}>
        <Save size={18} className="opacity-70" />
        <span className="font-medium text-[1rem]">存档管理</span>
      </button>
    </div>
  );
};