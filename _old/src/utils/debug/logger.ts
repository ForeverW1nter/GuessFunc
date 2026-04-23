import { SYSTEM_LOGS } from '../systemLogs';

/**
 * 简单的全局 Debug 状态管理器
 * 提供两种开启方式：
 * 1. 在 URL 里加上 ?debug=1 来开启
 * 2. 在页面中按下 Ctrl+Shift+D 组合键开启
 */
let isDebugMode = false;

// 细分 Debug 模块
export const DEBUG_MODULES = {
  AUDIO: 'AUDIO',
  MATH: 'MATH',
  STORY: 'STORY',
  UI: 'UI'
};

// 存储启用的模块，默认为空
const enabledModules = new Set<string>();

/**
 * 初始化 Debug 模式
 * 可以在应用初始化时调用，检查 URL 参数
 * 支持通过 ?debug=1 开启全部，或者 ?debug=AUDIO,MATH 开启特定模块
 */
export const initDebugMode = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    
    const debugParam = urlParams.get('debug') || hashParams.get('debug');
    
    if (debugParam) {
      isDebugMode = true;
      if (debugParam === '1') {
        // 开启所有模块
        Object.values(DEBUG_MODULES).forEach(m => enabledModules.add(m));
        console.log(SYSTEM_LOGS.DEBUG_MODE_ALL);
      } else {
        // 开启特定模块
        const modules = debugParam.toUpperCase().split(',');
        modules.forEach(m => {
          if (Object.values(DEBUG_MODULES).includes(m)) {
            enabledModules.add(m);
          }
        });
        console.log(SYSTEM_LOGS.DEBUG_MODE_MODULES(Array.from(enabledModules).join(', ')));
      }
    }
  }
};

/**
 * 获取当前是否处于 Debug 模式
 * @returns {boolean} 当前是否为 Debug 模式
 */
export const getDebugMode = () => isDebugMode;

/**
 * 检查特定模块是否开启了 Debug
 */
export const isModuleDebugEnabled = (moduleName: string) => {
  return isDebugMode && enabledModules.has(moduleName);
};

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
   * 模块化日志输出
   * @param moduleName 模块名称 (如 DEBUG_MODULES.AUDIO)
   * @param message 日志信息
   * @param args 附加参数
   */
  module: (moduleName: string, message: string, ...args: unknown[]) => {
    if (isModuleDebugEnabled(moduleName)) {
      console.log(`[DEBUG::${moduleName}] ${message}`, ...args);
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
