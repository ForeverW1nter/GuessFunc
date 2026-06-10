import { ce } from './ce';

export interface GeneratedFunction {
  target: string;
  params: Record<string, number>;
}

export type FunctionType = 'polynomial' | 'absolute' | 'rational' | 'radical' | 'trigonometric' | 'inverse_trigonometric' | 'hyperbolic' | 'inverse_hyperbolic' | 'exponential';

export interface GeneratorOptions {
  targetDifficulty: number;
  withParams?: boolean;
  allowedTypes?: FunctionType[];
}

// ----------------------------------------------------------------------------------
// 核心思想：代数与几何同胚构造
// 我们不再随机拼凑算子，而是将函数生成看作是对某个“基础几何流形”的拓扑变换。
// 每一次变换都有明确的解析几何意义（对称破缺、渐近线旋转、定义域撕裂等）。
// 使用 #X# 占位符进行安全的字符串级替换，避免解析树重建时的不可预知行为
// ----------------------------------------------------------------------------------

// 基础流形 (Base Manifolds) - 拥有极强解析特征的函数
const BASE_MANIFOLDS: { expr: string; type: FunctionType }[] = [
  { expr: '#X#', type: 'polynomial' },
  { expr: '#X#^2', type: 'polynomial' },
  { expr: '#X#^3', type: 'polynomial' },
  { expr: '\\left|#X#\\right|', type: 'absolute' },
  { expr: '\\frac{1}{#X#}', type: 'rational' },
  { expr: '\\frac{1}{#X#^2+1}', type: 'rational' },
  { expr: '\\sqrt{1-#X#^2}', type: 'radical' },
  { expr: '\\sin\\left(#X#\\right)', type: 'trigonometric' },
  { expr: '\\cos\\left(#X#\\right)', type: 'trigonometric' },
  { expr: '\\tan\\left(#X#\\right)', type: 'trigonometric' },
  { expr: '\\arcsin\\left(#X#\\right)', type: 'inverse_trigonometric' },
  { expr: '\\arccos\\left(#X#\\right)', type: 'inverse_trigonometric' },
  { expr: '\\arctan\\left(#X#\\right)', type: 'inverse_trigonometric' },
  { expr: '\\sinh\\left(#X#\\right)', type: 'hyperbolic' },
  { expr: '\\cosh\\left(#X#\\right)', type: 'hyperbolic' },
  { expr: '\\tanh\\left(#X#\\right)', type: 'hyperbolic' },
  { expr: '\\operatorname{arsinh}\\left(#X#\\right)', type: 'inverse_hyperbolic' },
  { expr: '\\operatorname{artanh}\\left(#X#\\right)', type: 'inverse_hyperbolic' },
  { expr: 'e^{#X#}', type: 'exponential' },
  { expr: '\\ln\\left(#X#\\right)', type: 'exponential' }
];

// 获取随机元素
function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 获取更友好的常数，根据算子类型进行智能约束，避免生成极其丑陋或无意义的图象
function getFriendlyConst(opId: string): string {
  const isMultiplier = opId.includes('scale') || opId.includes('mul') || opId.includes('slant') || opId.includes('exp') || opId.includes('skew') || opId.includes('wave');
  const isDomainLogSqrt = opId === 'domain_log' || opId === 'domain_sqrt';

  if (isDomainLogSqrt) {
    // 对于撕裂定义域的 log 或 sqrt，优先使用正数偏移，避免大面积无定义
    return getRandom(['1', '2', '3', '4', '5']);
  }
  if (isMultiplier) {
    // 作为乘数时，避免使用 1（无意义）和 0，使用适中的数值，并且不使用太大数字避免化简后产生非常大的常数
    return getRandom(['2', '3', '-2', '-3']);
  }
  // 普通加减常数
  return getRandom(['1', '2', '3', '4', '5', '-1', '-2', '-3', '-4', '-5']);
}

// ----------------------------------------------------------------------------------
// 2. 拓扑相变算子 (Topological Operators)
// 每个算子代表一种高阶的解析几何变换，而不是低级的语法树拼接。
// 分为 1D 算子（用于 #X# 的变形）和 2D 算子（用于混合 #X#, y 的隐式方程）
// ----------------------------------------------------------------------------------
interface TopologicalOperator {
  id: string;
  weight: number;
  type: FunctionType | 'general' | 'relation_2d'; // 如果涉及到特定类型（如sin），则标记类型
  maxUses: number; // 增加最大使用次数限制，防止无限套娃
  // 算子作用函数。p 代表传入的常数或参数。
  apply: (expr: string, p: string) => string;
}

const TOPOLOGICAL_OPERATORS: TopologicalOperator[] = [
  // ==================== 1D 变形算子 ====================
  // 【定义域撕裂/挤压类】
  { id: 'domain_log', weight: 1.5, type: 'exponential', maxUses: 1, apply: (expr, p) => `\\ln\\left(\\left|${expr}\\right| + ${p}\\right)` },
  { id: 'domain_sqrt', weight: 1.2, type: 'radical', maxUses: 1, apply: (expr, p) => `\\sqrt{${expr} + ${p}}` },
  { id: 'domain_inv', weight: 1.5, type: 'rational', maxUses: 1, apply: (expr, p) => `\\frac{${p}}{${expr}}` },

  // 【渐近线伪装类】
  { id: 'camou_slant', weight: 1.0, type: 'general', maxUses: 1, apply: (expr, p) => `${expr} + ${p}#X#` },
  { id: 'camou_inv', weight: 1.2, type: 'rational', maxUses: 1, apply: (expr, p) => `${expr} + \\frac{${p}}{#X#}` },
  { id: 'camou_exp', weight: 1.5, type: 'exponential', maxUses: 1, apply: (expr, p) => `${expr} + ${p}e^{-#X#}` },
  { id: 'camou_quad', weight: 1.8, type: 'general', maxUses: 1, apply: (expr, p) => `${expr} + ${p}#X#^2` },

  // 【对称性破缺类】
  { id: 'sym_break_sin', weight: 1.0, type: 'trigonometric', maxUses: 1, apply: (expr, p) => `${expr} + ${p}\\sin\\left(#X#\\right)` },
  { id: 'sym_break_mul', weight: 1.5, type: 'general', maxUses: 1, apply: (expr, p) => `\\left(${expr}\\right) \\cdot \\left(#X# + ${p}\\right)` },
  { id: 'sym_break_abs', weight: 1.0, type: 'absolute', maxUses: 1, apply: (expr, p) => `\\left|${expr}\\right| + ${p}#X#` },
  { id: 'sym_break_sign', weight: 1.0, type: 'general', maxUses: 1, apply: (expr, p) => `\\frac{${expr}}{#X# + ${p}}` },

  // 【频率/尺度扭曲类】
  { id: 'scale_x', weight: 0.8, type: 'general', maxUses: 1, apply: (expr, p) => expr.split('#X#').join(`\\left(${p}#X#\\right)`) },
  { id: 'shift_x', weight: 0.8, type: 'general', maxUses: 1, apply: (expr, p) => expr.split('#X#').join(`\\left(#X# + ${p}\\right)`) },
  { id: 'scale_y', weight: 0.8, type: 'general', maxUses: 1, apply: (expr, p) => `${p}\\left(${expr}\\right)` },
  { id: 'shift_y', weight: 0.5, type: 'general', maxUses: 1, apply: (expr, p) => `${expr} + ${p}` },

  // 【复合包裹类】
  { id: 'wrap_exp', weight: 1.2, type: 'exponential', maxUses: 1, apply: (expr, p) => `e^{${expr}} + ${p}` },
  { id: 'wrap_sin', weight: 1.2, type: 'trigonometric', maxUses: 1, apply: (expr, p) => `\\sin\\left(${expr} + ${p}\\right)` },
  { id: 'wrap_abs', weight: 0.8, type: 'absolute', maxUses: 1, apply: (expr, p) => `\\left|${expr}\\right| + ${p}` }
];

// 简单验证函数是否有意义的评估点 (避免全量空集或常数)
function hasValidDomain(exprStr: string): boolean {
  // 将占位符还原为 x 进行验证
  const testExpr = exprStr.split('#X#').join('x');
  
  // 避免过度空集，比如被多重根号包围，或者对数里面出现非正
  if (testExpr.includes('\\sqrt{-(x^2') || testExpr.includes('\\sqrt{-\\left(x^2')) {
    return false;
  }
  if (testExpr.includes('\\ln\\left(-\\left|')) {
    return false;
  }
  // 避免出现套娃式无意义分数
  if (testExpr.includes('\\frac{') && (testExpr.match(/\\frac{/g) || []).length > 2) {
    return false;
  }
  // 防止最后简化为无x的纯参数表达式
  if (!testExpr.includes('x')) {
    return false;
  }
  return true; 
}

// 检查生成的表达式在化简后是否依然保持了足够的复杂度，避免 e^lnx 或 1/(1/x) 这种退化情况
function isComplexitySufficient(exprStr: string, currentWeight: number, paramsCount: number): boolean {
  const testExpr = exprStr.split('#X#').join('x');
  
  // 如果公式太长，直接认为足够复杂，跳过耗时的 CE.simplify 验证
  if (testExpr.length > 60) return true;

  try {
    // 替换小数为分数，以规避 ComputeEngine 在带小数的有理多项式化简时的死循环 bug
    const safeExprStr = testExpr.replace(/(\d+)\.(\d+)/g, (_match, p1, p2) => {
      const num = parseInt(p1 + p2, 10);
      const den = Math.pow(10, p2.length);
      return `\\frac{${num}}{${den}}`;
    });
    
    // 设置极短的执行超时时间，防止 ComputeEngine 卡死
    const start = Date.now();
    const box = ce.parse(safeExprStr);
    const simplified = box.simplify();
    const simplifiedLatex = simplified.latex;
    
    if (Date.now() - start > 100) {
      // 如果化简耗时超过 100ms，直接跳过后续判断，认为足够复杂
      return true;
    }
    
    // 如果化简后没有 x，说明退化为常数了
    if (!simplifiedLatex.includes('x')) {
      return false;
    }
    
    // 粗略判断复杂度：化简后的 LaTeX 长度不应过短
    if (currentWeight >= 1.0 && simplifiedLatex.length < 5 && paramsCount === 0) {
      return false;
    }

    // 如果化简后的长度大幅度缩水
    if (currentWeight >= 1.0 && simplifiedLatex.length < testExpr.length * 0.5) {
      return false;
    }
    
    return true;
  } catch {
    return true; // 如果解析失败，保守认为它足够复杂
  }
}

export function generateFunctionByDifficulty(
  optionsOrDifficulty: number | GeneratorOptions,
  legacyWithParams: boolean = false
): GeneratedFunction {
  // 处理兼容性，支持旧版的 (difficulty, withParams) 调用
  const options: GeneratorOptions = typeof optionsOrDifficulty === 'number'
    ? { targetDifficulty: optionsOrDifficulty, withParams: legacyWithParams }
    : optionsOrDifficulty;

  const { targetDifficulty, withParams = false, allowedTypes } = options;

  // 难度映射：难度0 (基础流形+0次变换) -> 难度7 (基础流形+高阶变换)
  const diff = Math.max(0, Math.min(7, targetDifficulty));
  const targetWeight = diff * (4.8 / 7); // 难度0时为0，难度7时为4.8

  const maxAttempts = 150;
  let bestResult = { target: 'x', params: {} as Record<string, number> };
  let minDiffError = Infinity;

  // 记录生成开始时间，设定硬性超时 (例如 1000ms)，防止主线程卡死
  const startTime = Date.now();
  const TIMEOUT_MS = 1000;

  // 筛选出允许的基础流形
  const baseManifoldsPool = BASE_MANIFOLDS;
  const availableManifolds = allowedTypes 
    ? baseManifoldsPool.filter(m => allowedTypes.includes(m.type as FunctionType))
    : baseManifoldsPool;
  
  // 如果所有类型都被过滤掉了，回退到最基础的流形
  const manifoldsToUse = availableManifolds.length > 0 ? availableManifolds : [baseManifoldsPool[0]];

  // 筛选出允许的算子
  const baseOpsPool = TOPOLOGICAL_OPERATORS;
  const availableOperators = allowedTypes
    ? baseOpsPool.filter(op => (op.type === 'general' || allowedTypes.includes(op.type as FunctionType)))
    : baseOpsPool;

  // 如果所有算子都被过滤掉了，留一个最安全的平移算子兜底
  const opsToUse = availableOperators.length > 0 ? availableOperators : [baseOpsPool[0]];

  for (let i = 0; i < maxAttempts; i++) {
    // 如果超时，立刻中断尝试，返回目前找到的最好的（或者兜底）结果
    if (Date.now() - startTime > TIMEOUT_MS) {
      console.warn(`[Generator] Generation timed out after ${i} attempts`);
      break;
    }

    let currentWeight = 0;
    let expr = getRandom(manifoldsToUse).expr;
    
    const usedParams: Record<string, number> = {};
    const availableParams = ['a', 'b', 'c'];
    
    // 如果带参数，随机决定使用 1 到 3 个参数
    const paramCount = withParams ? Math.floor(Math.random() * 3) + 1 : 0;
    const targetParams = availableParams.slice(0, paramCount);

    let steps = 0;
    const usedOps = new Map<string, number>();

    // 强制使用完分配的参数，或者达到目标难度
    while ((currentWeight < targetWeight || targetParams.length > 0) && steps < 6) {
      const validOps = opsToUse.filter(op => (usedOps.get(op.id) || 0) < op.maxUses);
      
      if (validOps.length === 0) break;

      const op = getRandom(validOps);
      usedOps.set(op.id, (usedOps.get(op.id) || 0) + 1);
      
      let pStr = '';
      if (targetParams.length > 0 && (Math.random() < 0.6 || steps > 3)) {
        // 消耗一个参数
        const pName = targetParams.shift()!;
        pStr = pName;
        // 给参数一个初始值，确保一开始图形可见且不退化
        usedParams[pName] = parseFloat(getFriendlyConst(op.id));
      } else {
        // 使用常数
        pStr = getFriendlyConst(op.id);
      }

      expr = op.apply(expr, pStr);
      currentWeight += op.weight;
      steps++;
    }

    // 简单验证有效性
    if (!hasValidDomain(expr)) continue;

    // 检查复杂度是否在化简后崩塌
    if (!isComplexitySufficient(expr, currentWeight, targetParams.length)) continue;

    // 检查参数是否被成功吃掉，并且是否实际出现在了表达式中
    if (withParams) {
      let paramMissing = false;
      // 检查参数是否独立出现（不属于任何关键字）
      for (const p in usedParams) {
        const paramRegex = new RegExp(`(?<![a-zA-Z\\\\])${p}(?![a-zA-Z])`);
        if (!paramRegex.test(expr)) {
          paramMissing = true;
          break;
        }
      }
      if (paramMissing) continue;
      
      // 如果要求带参数但最终没带上，废弃
      if (Object.keys(usedParams).length === 0) continue;
    }

    const diffError = Math.abs(currentWeight - targetWeight);
    if (diffError < minDiffError) {
      minDiffError = diffError;
      // 在这最后一步，将 #X# 替换为实际的变量 x，并做一些简单的符号美化
      let finalTarget = expr.split('#X#').join('x');
      finalTarget = finalTarget.replace(/\+\s*-/g, '- ');
      bestResult = { target: finalTarget, params: usedParams };
    }

    if (diffError < 0.3 && targetParams.length === 0) {
      break;
    }
  }

  // 最终安全兜底：如果 withParams 为 true 却依然没生成出来（极罕见），强行附带一个最优雅的参数
  if (withParams && Object.keys(bestResult.params).length === 0) {
    bestResult.target = `\\left(${bestResult.target}\\right) + a`;
    bestResult.params = { a: 2 };
  }

  return bestResult;
}