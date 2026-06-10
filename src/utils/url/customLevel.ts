import { extractUsedParams } from '../mathEngine';

export interface CustomLevelData {
  t: string; // targetFunction
  p: Record<string, number>; // params
}

/**
 * 序列化自定义关卡数据到 base64 URL 字符串
 * @param funcInput 目标函数表达式
 * @returns {string} base64 编码的字符串
 */
export const encodeCustomLevel = (funcInput: string): string => {
  const levelData: CustomLevelData = { 
    t: funcInput,
    p: extractUsedParams(funcInput, {}) 
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(levelData))));
};

/**
 * 根据输入生成完整的分享 URL
 * @param funcInput 目标函数表达式
 * @param titleInput 关卡标题
 * @returns {string} 完整的分享 URL
 */
export const generateCustomLevelUrl = (funcInput: string, titleInput: string): string => {
  const encoded = encodeCustomLevel(funcInput);
  return `${window.location.origin}${window.location.pathname}#/game/custom/1/${encoded}?title=${encodeURIComponent(titleInput)}`;
};