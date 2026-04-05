import { ComputeEngine } from '@cortex-js/compute-engine';
import { logger } from '../debug/logger';
import { GAME_CONSTANTS } from '../constants';
import i18n from '../../i18n';

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
  
  // 特殊处理 floor 函数 (CortexJS Compute Engine 支持 \lfloor 和 \rfloor，或者 Floor()，这里转成标准的 \lfloor 和 \rfloor 形式或者保留为 operator)
  // Desmos 产出的 floor 形式为 \operatorname{floor}\left(x\right)
  s = s.replace(/\\operatorname{floor}\\left\((.*?)\\right\)/g, '\\lfloor $1 \\rfloor');
  s = s.replace(/\\operatorname{ceil}\\left\((.*?)\\right\)/g, '\\lceil $1 \\rceil');
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

    const baseTestPoints = GAME_CONSTANTS.MATH_ENGINE.BASE_TEST_POINTS;
    const NUM_RANDOM_SAMPLES = GAME_CONSTANTS.MATH_ENGINE.NUM_RANDOM_SAMPLES;
    const testPoints = [...baseTestPoints];
    
    for (let i = 0; i < NUM_RANDOM_SAMPLES; i++) {
      let xVal = (Math.random() * 10) - 5;
      if (Math.abs(xVal) < 0.05) xVal = 0.5; // 避免正好为 0
      testPoints.push(xVal);
    }

    let validPointsCount = 0;
    let domainMismatchCount = 0;

    const paramKeys = Object.keys(params);

    for (const xVal of testPoints) {
      const testContext: Record<string, number> = {};
      testContext['x'] = xVal;

      // 核心修改：针对带有参数的函数，使用随机采样的参数值进行验证
      // 保证玩家的解析式必须在任意参数下都与目标解析式等效，而不是依赖于某个特定的滑块值
      for (const p of paramKeys) {
        // 生成与 x 类似的随机范围 [-5, 5]
        let pVal = (Math.random() * 10) - 5;
        if (Math.abs(pVal) < 0.05) pVal = 0.5;
        testContext[p] = pVal;
      }

      // 评估目标和玩家的表达式
      const targetValBox = targetBox.subs(testContext).N();
      const playerValBox = playerBox.subs(testContext).N();

      const tRaw = targetValBox.valueOf();
      const pRaw = playerValBox.valueOf();

      let tVal = typeof tRaw === 'number' ? tRaw : NaN;
      let pVal = typeof pRaw === 'number' ? pRaw : NaN;
      
      // 特殊处理 JavaScript 浮点数精度导致的极小复数虚部问题（如 Compute Engine 计算负数对数）
      const tRawObj = tRaw as unknown as Record<string, unknown>;
      const pRawObj = pRaw as unknown as Record<string, unknown>;
      
      if (typeof tRaw !== 'number' && tRaw && typeof tRawObj.re === 'number' && typeof tRawObj.im === 'number' && Math.abs(tRawObj.im) < GAME_CONSTANTS.MATH_ENGINE.IMAGINARY_TOLERANCE) {
        tVal = tRawObj.re;
      } else if (typeof tRaw !== 'number' && tRaw && typeof tRawObj.im === 'number' && Math.abs(tRawObj.im) >= GAME_CONSTANTS.MATH_ENGINE.IMAGINARY_TOLERANCE) {
        tVal = NaN; // 真正的复数认为在实数域无定义
      }
      
      if (typeof pRaw !== 'number' && pRaw && typeof pRawObj.re === 'number' && typeof pRawObj.im === 'number' && Math.abs(pRawObj.im) < GAME_CONSTANTS.MATH_ENGINE.IMAGINARY_TOLERANCE) {
        pVal = pRawObj.re;
      } else if (typeof pRaw !== 'number' && pRaw && typeof pRawObj.im === 'number' && Math.abs(pRawObj.im) >= GAME_CONSTANTS.MATH_ENGINE.IMAGINARY_TOLERANCE) {
        pVal = NaN;
      }

      const tValid = Number.isFinite(tVal);
      const pValid = Number.isFinite(pVal);

      // 定义域匹配检查
      if (tValid !== pValid) {
        domainMismatchCount++;
        // 允许容忍个别孤立点（如被除数为0的点），但如果达到一定数量，则认为是一段定义域不同
        if (domainMismatchCount >= GAME_CONSTANTS.MATH_ENGINE.DOMAIN_MISMATCH_THRESHOLD) {
          // 由于随机采样可能正好击中不连续点（如 floor 的跳跃点或 1/x 的 0 点），
          // 如果有效点已经足够多，且不匹配点比例不高，我们可以认为这是一个有效的匹配
          // （因为真正的大段定义域不匹配会在前期就触发这个 threshold）
          if (validPointsCount >= GAME_CONSTANTS.MATH_ENGINE.NUM_RANDOM_SAMPLES * 0.4) {
             logger.log(`容忍了 ${domainMismatchCount} 个定义域不匹配点，因为已有 ${validPointsCount} 个有效点`);
             continue; // 容忍并继续
          }

          return { 
            isMatch: false, 
            reason: i18n.t('game.mathEngine.domainMismatch')
          };
        }
        continue;
      }

      // 两个都没有定义（如都在根号负数区域），跳过该点
      if (!tValid && !pValid) {
        // 都无定义其实也是一种匹配（或者说不违反等价性）
        validPointsCount++;
        continue;
      }

      // 如果都有定义，进行数值容差对比
      if (tValid && pValid) {
        const diff = Math.abs(tVal - pVal);
        const maxVal = Math.max(Math.abs(tVal), Math.abs(pVal));
        
        // 相对误差和绝对误差双重校验
        const isClose = diff < GAME_CONSTANTS.MATH_ENGINE.TOLERANCE || (maxVal > GAME_CONSTANTS.MATH_ENGINE.TOLERANCE && diff / maxVal < GAME_CONSTANTS.MATH_ENGINE.TOLERANCE);
        
        // 如果是因为离散函数(floor, ceil)等引起的跳跃点误差，再给一次微调机会
        if (!isClose && (
            cleanTarget.includes('\\lfloor') || cleanTarget.includes('floor') || 
            cleanPlayer.includes('\\lfloor') || cleanPlayer.includes('floor') ||
            cleanTarget.includes('\\lceil') || cleanTarget.includes('ceil') || 
            cleanPlayer.includes('\\lceil') || cleanPlayer.includes('ceil')
        )) {
           // 由于浮点数精度，x 接近整数时，floor(x) 可能会由于浮点误差跳变
           // 检查加上或减去一个极小值是否能匹配
           const tValUp = targetBox.subs({ ...testContext, x: xVal + 1e-12 }).N().valueOf();
           const tValDown = targetBox.subs({ ...testContext, x: xVal - 1e-12 }).N().valueOf();
           const pValUp = playerBox.subs({ ...testContext, x: xVal + 1e-12 }).N().valueOf();
           const pValDown = playerBox.subs({ ...testContext, x: xVal - 1e-12 }).N().valueOf();
           
           const tUpNum = typeof tValUp === 'number' ? tValUp : NaN;
           const tDownNum = typeof tValDown === 'number' ? tValDown : NaN;
           const pUpNum = typeof pValUp === 'number' ? pValUp : NaN;
           const pDownNum = typeof pValDown === 'number' ? pValDown : NaN;
           
           // 交叉对比微调后的结果：只要目标函数的微调（上或下）和玩家函数的微调（上或下）有任意组合匹配，就算过
           // 因为像 floor(x) 和 ceil(x-1) 在 x=1 时的跳变方向和临界点归属是相反的，但在图像上它们是完全等效的
           const isMatch1 = Math.abs(tUpNum - pUpNum) < GAME_CONSTANTS.MATH_ENGINE.TOLERANCE;
           const isMatch2 = Math.abs(tDownNum - pDownNum) < GAME_CONSTANTS.MATH_ENGINE.TOLERANCE;
           const isMatch3 = Math.abs(tUpNum - pDownNum) < GAME_CONSTANTS.MATH_ENGINE.TOLERANCE;
           const isMatch4 = Math.abs(tDownNum - pUpNum) < GAME_CONSTANTS.MATH_ENGINE.TOLERANCE;
           
           if (isMatch1 || isMatch2 || isMatch3 || isMatch4) {
             validPointsCount++;
             continue;
           }
        }
        
        if (!isClose) {
          // 同样，如果有效点已经积累得非常多，允许容错个别由于极端精度导致的失败点
          if (validPointsCount >= GAME_CONSTANTS.MATH_ENGINE.NUM_RANDOM_SAMPLES * 0.7) {
             logger.log(`容忍了 1 个数值不匹配点，因为已有 ${validPointsCount} 个有效点`);
             continue;
          }
          return { 
            isMatch: false, 
            reason: i18n.t('game.mathEngine.valueMismatch', { x: xVal.toFixed(2) })
          };
        }
        validPointsCount++;
      }
    }

    // 只要有足够的有效点（比如大于总测试点的 1/3），就认为通过
    if (validPointsCount >= testPoints.length * 0.3) {
      logger.log(`验证通过: 采样点测试吻合 (共 ${validPointsCount}/${testPoints.length} 个有效点)`);
      return { isMatch: true, method: isSimplifyMatch ? 'simplify' : 'sampling' };
    } else {
      return { 
        isMatch: false, 
        reason: i18n.t('game.mathEngine.noValidPoints')
      };
    }

  } catch (error: unknown) {
    logger.error("验证引擎异常:", error);
    return {
      isMatch: false,
      reason: i18n.t('game.mathEngine.parseError')
    };
  }
}
