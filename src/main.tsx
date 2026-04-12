import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDebugMode, logger } from './utils/debug/logger';
import { useUIStore } from './store/useUIStore';
import i18n from './i18n';
import { SYSTEM_LOGS } from './utils/systemLogs';

// 初始化 Debug 模式
initDebugMode();

// 全局异常捕获监控
if (typeof window !== 'undefined') {
  const reportGlobalError = (type: string, error: unknown) => {
    try {
      const errorPayload = {
        type,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
      // TODO: 配置真实的错误上报服务
      // fetch(ERROR_REPORTING_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorPayload),
      //   keepalive: true
      // }).catch((error) => {
      //   console.warn('Failed to report error to remote server:', error);
      // });
      console.error('Global error captured:', errorPayload);
    } catch (e) {
      console.warn(SYSTEM_LOGS.ERROR_GLOBAL_REPORT_FAILED, e);
    }
  };

  window.addEventListener('error', (event) => {
    reportGlobalError('window.error', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportGlobalError('unhandledrejection', event.reason);
  });
}

// 全局监听快捷键开启 debug 模式 (Ctrl+Shift+D)
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('debug') !== '1') {
        currentUrl.searchParams.set('debug', '1');
        window.history.replaceState({}, '', currentUrl.toString());
        initDebugMode();
        logger.log(SYSTEM_LOGS.DEBUG_MODE_HOTKEY);
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
