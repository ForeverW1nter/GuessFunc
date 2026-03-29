import React from 'react';
import ReactDOM from 'react-dom/client';
import { StoryEditorPage } from './modding/StoryEditorPage';
import { useUIStore } from '../src/store/useUIStore';
import '../src/i18n';
import '../src/index.css';

export const ToolsApp = () => {
  const { theme, storyFontSize, storyFontFamily } = useUIStore();

  return (
    <div 
      className={`flex h-screen w-screen bg-[#0A0A0B] text-[#D4D4D6] font-sans overflow-hidden ${theme}`} 
      style={{ 
        fontSize: `${storyFontSize}%`,
        fontFamily: storyFontFamily === 'system-ui, -apple-system, sans-serif' 
          ? '"PingFang SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif'
          : storyFontFamily
      }}
    >
      {/* 我们将应用选择和所有的工作区逻辑都整合到了 StoryEditorPage (也就是现在的文件管理器) 内部 */}
      <StoryEditorPage />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToolsApp />
  </React.StrictMode>,
);
