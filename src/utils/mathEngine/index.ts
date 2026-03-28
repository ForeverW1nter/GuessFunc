import { ComputeEngine } from '@cortex-js/compute-engine';
import { logger } from '../debug/logger';

// -----------------------------------------------------------------------------
// 现代架构的数学验证引擎
// 核心思想：摒弃脆弱的正则表达式字符串匹配，完全采用抽象语法树(AST)和数值采样
// 工具选型：@cortex-js/compute-engine (原生支持 LaTeX 和符号计算)
// -----------------------------------------------------------------------------

// 单例模式复用 Compute Engine 实例，提升性能
const ce = new ComputeEngine();
// 声明 x 为实数，这是函数的基本自变量
ce.declare('x', 'number');

export interface ValidationResult {
  isMatch: boolean;
  reason?: string;
  method?: 'ast' | 'simplify' | 'sampling';
}

/**
 * 清理 Desmos 产出的特定 LaTeX 标记，使其符合标准 LaTeX 以便 CE 解析
 * @param latex Desmos 产出的 LaTeX
 */
function cleanDesmosLatex(latex: string): string {
  if (!latex) return "";
  let s = latex;
  
  // 移除多余空白
  s = s.replace(/\s+/g, ' ').trim();
  
  // 转换 Desmos 的特殊常数和函数标记
  s = s.replace(/\\exponentialE/g, 'e');
  s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');
  s = s.replace(/\\mathrm{([^{}]+)}/g, '$1');
  
  // 修复绝对值
  s = s.replace(/\\left\|(.*?)\\right\|/g, "\\left|$1\\right|");
  
  return s;
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
    
    // 2. 正则兜底策略：只对化简后的 LaTeX 进行正则匹配
    const simplifiedLatex = simplifiedBox.latex;
    const regex = /[a-zA-Z](?:_[0-9a-zA-Z]+)?/g;
    const matches = simplifiedLatex.match(regex) || [];
    for (const match of matches) {
      if (match !== 'x' && match !== 'y' && match !== 'e' && match !== 'pi' && match in allParams) {
        usedParams[match] = allParams[match];
      }
    }

    return usedParams;
  } catch (error) {
    logger.error("解析参数失败:", error);
    return {};
  }
}

/**
 * 验证两个数学表达式是否等价 (核心验证算法)
 * 
 * 算法分三步，层层递进：
 * 1. 结构化 AST 对比 (如 x+1 和 x+1)
 * 2. 符号代数化简对比 (如 x+x 和 2x)
 * 3. 蒙特卡洛数值采样对比 (如 (x^2-1)/(x-1) 和 x+1 在定义域内等效)
 * 
 * @param targetLatex 目标函数表达式 (LaTeX)
 * @param playerLatex 玩家输入的表达式 (LaTeX)
 * @param params 其他参数变量 (例如 Desmos 滑块产生的 a, b)
 */
export function evaluateEquivalence(
  targetLatex: string, 
  playerLatex: string, 
  params: Record<string, number> = {}
): ValidationResult {
  logger.log("--- 开始等价性验证 ---");
  logger.log("Target:", targetLatex);
  logger.log("Player:", playerLatex);

  try {
    const cleanTarget = cleanDesmosLatex(targetLatex);
    const cleanPlayer = cleanDesmosLatex(playerLatex);

    const targetBox = ce.parse(cleanTarget);
    const playerBox = ce.parse(cleanPlayer);

    // 1. AST 结构完全一致 (最快)
    // 强制先进行采样，防止 e^lnx 和 x 在纯符号层面上被 isSame 判定为相同
    // if (targetBox.isSame(playerBox)) {
    //   logger.log("验证通过: AST 结构匹配");
    //   return { isMatch: true, method: 'ast' };
    // }

    // 代数化简后结构一致标志 (不立即返回，因为化简可能会丢失定义域信息)
    const targetSimple = targetBox.simplify();
    const playerSimple = playerBox.simplify();
    // 强制禁用化简匹配，必须走严格的数值采样验证
    const isSimplifyMatch = targetSimple.isSame(playerSimple);

    // 2. 数值采样验证 (蒙特卡洛方法 + 严格定义域校验)
    // 动态注册滑块参数变量
    const variables = ['x', ...Object.keys(params)];
    variables.forEach(v => {
      try {
        // 在较新的 Compute Engine 中，直接 declare 即可，如果有重复会自动处理或可通过选项覆盖
        ce.declare(v, 'number');
      } catch {
        // 忽略重复声明错误
      }
    });

    const baseTestPoints = [-4.12, -2.5, -1, -0.1, 0.1, 1, 2.5, 4.12];
    const NUM_RANDOM_SAMPLES = 12;
    const testPoints = [...baseTestPoints];
    
    for (let i = 0; i < NUM_RANDOM_SAMPLES; i++) {
      let xVal = (Math.random() * 10) - 5;
      if (Math.abs(xVal) < 0.05) xVal = 0.5; // 避免正好为 0
      testPoints.push(xVal);
    }

    let validPointsCount = 0;
    let domainMismatchCount = 0;

    for (const xVal of testPoints) {
      const testContext: Record<string, number> = { ...params };
      testContext['x'] = xVal;

      // 评估目标和玩家的表达式
      const targetValBox = targetBox.subs(testContext).evaluate();
      const playerValBox = playerBox.subs(testContext).evaluate();

      let tVal = typeof targetValBox.value === 'number' ? targetValBox.value : NaN;
      let pVal = typeof playerValBox.value === 'number' ? playerValBox.value : NaN;
      
      // 特殊处理 JavaScript 浮点数精度导致的极小复数虚部问题（如 Compute Engine 计算负数对数）
      if (typeof targetValBox.value !== 'number' && typeof targetValBox.re === 'number' && typeof targetValBox.im === 'number' && Math.abs(targetValBox.im) < 1e-10) {
        tVal = targetValBox.re;
      } else if (typeof targetValBox.value !== 'number' && (typeof targetValBox.im === 'number' && Math.abs(targetValBox.im) >= 1e-10)) {
        tVal = NaN; // 真正的复数认为在实数域无定义
      }
      
      if (typeof playerValBox.value !== 'number' && typeof playerValBox.re === 'number' && typeof playerValBox.im === 'number' && Math.abs(playerValBox.im) < 1e-10) {
        pVal = playerValBox.re;
      } else if (typeof playerValBox.value !== 'number' && (typeof playerValBox.im === 'number' && Math.abs(playerValBox.im) >= 1e-10)) {
        pVal = NaN;
      }

      const tValid = Number.isFinite(tVal);
      const pValid = Number.isFinite(pVal);

      // 定义域匹配检查
      if (tValid !== pValid) {
        domainMismatchCount++;
        // 允许容忍个别孤立点（如被除数为0的点），但如果达到一定数量（如 3 个），则认为是一段定义域不同
        if (domainMismatchCount >= 3) {
          return { 
            isMatch: false, 
            reason: `存在大段定义域不匹配` 
          };
        }
        continue;
      }

      // 两个都没有定义（如都在根号负数区域），跳过该点
      if (!tValid && !pValid) continue;

      // 如果都有定义，进行数值容差对比
      if (tValid && pValid) {
        const diff = Math.abs(tVal - pVal);
        const maxVal = Math.max(Math.abs(tVal), Math.abs(pVal));
        
        // 相对误差和绝对误差双重校验
        const isClose = diff < 1e-5 || (maxVal > 1e-5 && diff / maxVal < 1e-5);
        if (!isClose) {
          return { 
            isMatch: false, 
            reason: `数值不匹配: x ≈ ${xVal.toFixed(2)} 时差异过大` 
          };
        }
        validPointsCount++;
      }
    }

    if (validPointsCount > 0) {
      logger.log(`验证通过: 采样点测试全部吻合 (共 ${validPointsCount} 个有效点)`);
      return { isMatch: true, method: isSimplifyMatch ? 'simplify' : 'sampling' };
    } else {
      return { 
        isMatch: false, 
        reason: '在此范围内无法找到有效的对比采样点' 
      };
    }

  } catch (error: unknown) {
    logger.error("验证引擎异常:", error);
    return {
      isMatch: false,
      reason: `表达式解析失败: 格式可能不支持`
    };
  }
}
