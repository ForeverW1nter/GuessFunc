import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { GAME_CONSTANTS } from '../../../utils/constants';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(SYSTEM_LOGS.ERROR_BOUNDARY_UNCAUGHT, error, errorInfo);
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo?: ErrorInfo) => {
    try {
      const errorPayload = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
      
      // Simulated Sentry or logging endpoint
      // Ensure the scrubbed log can be delivered 100%
      await fetch('https://mock-sentry.endpoint/api/store/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorPayload),
        // keepalive ensures the request isn't cancelled if the page unloads
        keepalive: true 
      }).catch(e => {
        console.warn(SYSTEM_LOGS.ERROR_BOUNDARY_REPORT_FAILED, e);
      });
      
    } catch (e) {
      console.warn(SYSTEM_LOGS.ERROR_GLOBAL_REPORT_FAILED, e);
    }
  }

  private handleReset = () => {
    // 修复刷新死循环问题：除了刷新页面，还需要清空可能导致错误的本地缓存，避免一直白屏
    // 精准删除可能引发崩溃的当前 UI 状态，保留用户的 completedLevels 进度等核心存档数据
    try {
      const keysToKeep = [
        'guess-func-storage', // 进度数据
        GAME_CONSTANTS.STORAGE_KEYS.CURRENT_SLOT, // 当前存档槽
        GAME_CONSTANTS.STORAGE_KEYS.I18N_LANG, // 语言设置
        'guess-func-audio-storage', // 音频设置
      ];
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key) && !key.startsWith(GAME_CONSTANTS.STORAGE_KEYS.SLOT_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.warn(SYSTEM_LOGS.ERROR_BOUNDARY_CLEARED);
    } catch {
      // 忽略清除错误
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-background border border-border rounded-xl shadow-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-[#A0A0A5] text-sm mb-8 whitespace-pre-wrap text-left w-full bg-[#0A0A0B] p-4 rounded border border-border overflow-auto max-h-48 font-mono">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-lg hover:brightness-110 transition-all font-medium tracking-wide"
            >
              <RefreshCcw size={18} />
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
