import { ce } from './ce';
import { logger } from '../debug/logger';
import { SYSTEM_LOGS } from '../systemLogs';

/**
 * 清理 Desmos 产出的特定 LaTeX 标记，使其符合标准 LaTeX 以便 CE 解析
 * @param latex Desmos 产出的 LaTeX
 */
export function cleanDesmosLatex(latex: string): string {
  if (!latex) return "";
  let s = latex;
  
  // 移除多余空白
  s = s.replace(/\s+/g, ' ').trim();
  
  // 转换 Desmos 的特殊常数和函数标记
  s = s.replace(/\\exponentialE/g, 'e');
  
  // 特殊处理 floor 函数 (CortexJS Compute Engine 支持 \lfloor 和 \rfloor，或者 Floor()，这里转成标准的 \lfloor 和 \rfloor 形式或者保留为 operator)
  // Desmos 产出的 floor 形式为 \operatorname{floor}\left(x\right)
  s = s.replace(/\\operatorname{floor}\\left\((.*?)\\right\)/g, '\\lfloor $1 \\rfloor');
  s = s.replace(/\\operatorname{ceil}\\left\((.*?)\\right\)/g, '\\lceil $1 \\rceil');
  s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');
  s = s.replace(/\\mathrm{([^{}]+)}/g, '$1');
  
  // 修复绝对值
  s = s.replace(/\\left\|(.*?)\\right\|/g, "\\left|$1\\right|");
  
  // 修复不等式符号
  s = s.replace(/\\leq/g, '\\le');
  s = s.replace(/\\geq/g, '\\ge');
  s = s.replace(/≤/g, '\\le');
  s = s.replace(/≥/g, '\\ge');

  // 将小数转换为分数，以防 ComputeEngine 的 bug 导致死循环
  s = s.replace(/(\d+)\.(\d+)/g, (_match, p1, p2) => {
    const num = parseInt(p1 + p2, 10);
    const den = Math.pow(10, p2.length);
    return `\\frac{${num}}{${den}}`;
  });

  return s;
}

/**
  * 解析关系式（包含等号或不等号的方程或不等式）
  */
export function parseRelation(latex: string) {
  // 匹配 LHS + Operator + RHS。使用负向先行断言防止 \le 匹配到 \left
  const match = latex.match(/^(.*?)(<|>|\\le(?![a-zA-Z])|\\ge(?![a-zA-Z])|=)(.*)$/);
  if (match) {
    return { lhs: match[1].trim(), op: match[2], rhs: match[3].trim() };
  }
  return null;
}

/**
 * 从 LaTeX 表达式中提取出所有使用的变量，并和当前的参数列表比对，返回真正使用的参数
 */
export function extractUsedParams(latex: string, allParams: Record<string, number>): Record<string, number> {
  if (!latex) return {};
  try {
    const cleanLatex = cleanDesmosLatex(latex);
    const box = ce.parse(cleanLatex);
    // 化简表达式以去除像 +b-b 这样的冗余项
    const simplifiedBox = box.simplify();
    
    // 从化简后的表达式中提取未知数
    const unknowns = simplifiedBox.unknowns || [];
    
    const usedParams: Record<string, number> = {};
    // 1. 使用 Compute Engine 的 unknowns
    for (const v of unknowns) {
      if (v !== 'x' && v !== 'y' && v in allParams) {
        usedParams[v] = allParams[v];
      }
    }

    return usedParams;
  } catch (error) {
    logger.error(SYSTEM_LOGS.MATH_PARSE_PARAM_ERROR, error);
    return {};
  }
}

/**
 * 自动从表达式中提取未知数，作为关卡的参数列表，如果不在 currentParams 中，则默认为 1。
 */
export function autoExtractParams(latex: string, currentParams: Record<string, number> | null): Record<string, number> | null {
  if (!latex) return null;
  try {
    const cleanLatex = cleanDesmosLatex(latex);
    const box = ce.parse(cleanLatex);
    const simplifiedBox = box.simplify();
    const unknowns = simplifiedBox.unknowns || [];
    const extracted: Record<string, number> = {};
    let hasParams = false;
    for (const v of unknowns) {
      if (v !== 'x' && v !== 'y') {
        extracted[v] = currentParams?.[v] ?? 1;
        hasParams = true;
      }
    }
    return hasParams ? extracted : null;
  } catch {
    return currentParams;
  }
}
