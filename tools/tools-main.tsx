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
      className={`absolute inset-0 flex bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300 ${theme}`} 
      style={{ 
        fontSize: `${storyFontSize}%`,
        fontFamily: storyFontFamily === 'system-ui, -apple-system, sans-serif' 
          ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
