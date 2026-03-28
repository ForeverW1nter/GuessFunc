/**
 * 简单的全局 Debug 状态管理器
 * 提供两种开启方式：
 * 1. 在 URL 里加上 ?debug=1 来开启
 * 2. 在页面中按下 Ctrl+Shift+D 组合键开启
 */
let isDebugMode = false;

/**
 * 初始化 Debug 模式
 * 可以在应用初始化时调用，检查 URL 参数
 */
export const initDebugMode = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    
    if (urlParams.get('debug') === '1' || hashParams.get('debug') === '1') {
      isDebugMode = true;
      console.log('🔧 Debug Mode Enabled');
    }
  }
};

/**
 * 获取当前是否处于 Debug 模式
 * @returns {boolean} 当前是否为 Debug 模式
 */
export const getDebugMode = () => isDebugMode;

/**
 * 封装日志输出对象
 * 只有在 debug 模式下才会在控制台输出日志，防止生产环境信息泄露
 */
export const logger = {
  /**
   * 输出普通日志
   * @param message 日志信息
   * @param args 附加参数
   */
  log: (message: string, ...args: unknown[]) => {
    if (isDebugMode) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  /**
   * 输出警告日志
   * @param message 警告信息
   * @param args 附加参数
   */
  warn: (message: string, ...args: unknown[]) => {
    if (isDebugMode) {
      console.warn(`[DEBUG WARN] ${message}`, ...args);
    }
  },
  
  /**
   * 输出错误日志
   * @param message 错误信息
   * @param args 附加参数
   */
  error: (message: string, ...args: unknown[]) => {
    if (isDebugMode) {
      console.error(`[DEBUG ERROR] ${message}`, ...args);
    }
  }
};
