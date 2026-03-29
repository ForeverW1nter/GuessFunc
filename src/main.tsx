import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDebugMode, logger } from './utils/debug/logger';
import { useUIStore } from './store/useUIStore';
import i18n from './i18n';

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
        useUIStore.getState().addToast(
          useUIStore.getState().isDebugMode ? i18n.t('debugOff') : i18n.t('debugOn'),
          "info"
        );
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
