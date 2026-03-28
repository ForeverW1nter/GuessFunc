import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDebugMode, logger } from './utils/debug/logger';
import { useUIStore } from './store/useUIStore';

// 初始化 Debug 模式
initDebugMode();

// 全局监听快捷键开启 debug 模式 (Ctrl+Shift+D)
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('debug') !== '1') {
        currentUrl.searchParams.set('debug', '1');
        window.history.replaceState({}, '', currentUrl.toString());
        initDebugMode();
        logger.log("已通过快捷键开启 Debug 模式");
        useUIStore.getState().addToast("🔧 Debug 模式已开启", "info");
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
