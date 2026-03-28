import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { StoryEditorPage } from './modding/StoryEditorPage';
import { Wrench, ChevronDown, Terminal, BookOpen, Layers, Moon, Sun } from 'lucide-react';
import { useUIStore } from '../src/store/useUIStore';
import '../src/index.css';

const TOOLS_LIST = [
  { id: 'story-editor', name: 'Story Editor', desc: '剧情与关卡编辑器', icon: BookOpen },
  { id: 'level-tester', name: 'Level Sandbox', desc: '关卡沙盒测试 (WIP)', icon: Layers, disabled: true },
];

export const ToolsApp = () => {
  const [activeTool, setActiveTool] = useState(TOOLS_LIST[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Connect to the global UI Store to sync themes
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTool = TOOLS_LIST.find(t => t.id === activeTool);

  return (
    <div className={`h-screen w-screen bg-app-bg text-app-text flex flex-col font-mono overflow-hidden selection:bg-[rgba(var(--primary-color-rgb),0.3)] ${theme}`}>
      {/* 极简科幻风格 Header */}
      <header className="relative z-50 h-[56px] border-b border-card-border bg-card-bg/80 backdrop-blur-md flex items-center px-[20px] md:px-[32px] justify-between shrink-0 shadow-sm">
        
        <div className="flex items-center gap-[16px]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(var(--primary-color-rgb),0.1)] flex items-center justify-center border border-[rgba(var(--primary-color-rgb),0.2)]">
            <Wrench size={16} className="text-app-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="m-0 text-[1rem] font-bold tracking-widest uppercase text-app-text leading-none">SYS.TOOLS</h1>
            <span className="text-[0.65rem] opacity-60 tracking-[0.2em] mt-[2px]">MODDING_ENVIRONMENT_V2</span>
          </div>
        </div>

        <div className="flex items-center gap-[16px]">
          {/* 自定义下拉选择器 */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                flex items-center gap-[12px] h-[36px] px-[16px] rounded-[6px] transition-all duration-200 border
                ${isDropdownOpen 
                  ? 'bg-card-hover border-app-primary shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.3)]' 
                  : 'bg-transparent border-card-border hover:border-app-primary/50 hover:bg-card-hover'}
              `}
            >
              <Terminal size={14} className="text-app-primary opacity-80" />
              <span className="text-[0.85rem] font-medium text-app-text min-w-[120px] text-left">
                {currentTool?.name}
              </span>
              <ChevronDown size={14} className={`text-app-text opacity-60 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 下拉面板 */}
            <div 
              className={`
                absolute top-[calc(100%+8px)] right-0 w-[240px] bg-modal-bg border border-card-border rounded-[8px] shadow-modal overflow-hidden
                transition-all duration-300 origin-top-right
                ${isDropdownOpen ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}
              `}
            >
              <div className="p-[8px] flex flex-col gap-[4px]">
                {TOOLS_LIST.map((tool) => {
                  const isActive = tool.id === activeTool;
                  return (
                    <button
                      key={tool.id}
                      disabled={tool.disabled}
                      onClick={() => {
                        setActiveTool(tool.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`
                        w-full flex items-start gap-[12px] p-[12px] rounded-[6px] text-left transition-all duration-200 border-none outline-none
                        ${tool.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${isActive ? 'bg-[rgba(var(--primary-color-rgb),0.1)]' : 'bg-transparent hover:bg-card-hover'}
                      `}
                    >
                      <tool.icon size={16} className={`shrink-0 mt-[2px] ${isActive ? 'text-app-primary' : 'text-app-text opacity-50'}`} />
                      <div className="flex flex-col">
                        <span className={`text-[0.85rem] font-medium ${isActive ? 'text-app-text' : 'text-app-text opacity-80'}`}>
                          {tool.name}
                        </span>
                        <span className="text-[0.65rem] text-app-text opacity-50 mt-[2px]">
                          {tool.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="w-[1px] h-[24px] bg-card-border mx-[4px]"></div>
          
          {/* 主题切换按钮 */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] bg-transparent border border-card-border hover:bg-card-hover hover:border-app-primary/50 text-app-text opacity-80 hover:opacity-100 transition-all cursor-pointer"
            title={theme === 'dark' ? '切换至亮色模式' : '切换至深色模式'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      
      {/* 动画包裹的工作区 */}
      <main className="flex-1 overflow-hidden relative bg-app-bg animate-fade-in">
        {activeTool === 'story-editor' && <StoryEditorPage />}
        {activeTool === 'level-tester' && (
          <div className="flex items-center justify-center h-full text-[#606065] flex-col gap-[16px]">
            <Layers size={48} className="opacity-20" />
            <span>SANDBOX MODULE IS UNDER CONSTRUCTION...</span>
          </div>
        )}
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToolsApp />
  </React.StrictMode>,
);
