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
// ----------------------------------------------------------------------------------

// 1. 基础流形 (Base Manifolds) - 拥有极强解析特征的函数
const BASE_MANIFOLDS: { expr: string; type: FunctionType }[] = [
  { expr: 'x', type: 'polynomial' },
  { expr: 'x^2', type: 'polynomial' },
  { expr: 'x^3', type: 'polynomial' },
  { expr: '\\left|x\\right|', type: 'absolute' },
  { expr: '\\frac{1}{x}', type: 'rational' },
  { expr: '\\frac{1}{x^2+1}', type: 'rational' },
  { expr: '\\sqrt{1-x^2}', type: 'radical' },
  { expr: '\\sin(x)', type: 'trigonometric' },
  { expr: '\\cos(x)', type: 'trigonometric' },
  { expr: '\\tan(x)', type: 'trigonometric' },
  { expr: '\\arcsin(x)', type: 'inverse_trigonometric' },
  { expr: '\\arccos(x)', type: 'inverse_trigonometric' },
  { expr: '\\arctan(x)', type: 'inverse_trigonometric' },
  { expr: '\\sinh(x)', type: 'hyperbolic' },
  { expr: '\\cosh(x)', type: 'hyperbolic' },
  { expr: '\\tanh(x)', type: 'hyperbolic' },
  { expr: '\\text{arsinh}(x)', type: 'inverse_hyperbolic' },
  { expr: '\\text{artanh}(x)', type: 'inverse_hyperbolic' },
  { expr: 'e^x', type: 'exponential' },
  { expr: '\\ln(x)', type: 'exponential' }
];

// 获取随机元素
function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 获取友好的随机常数 (避免过于复杂的浮点数，保证解析美感)
function getFriendlyConst(allowNegative: boolean = true): string {
  const vals = ['2', '3', '4', '0.5', '1.5'];
  let v = getRandom(vals);
  if (allowNegative && Math.random() < 0.5) {
    v = '-' + v;
  }
  return v;
}

// ----------------------------------------------------------------------------------
// 2. 拓扑相变算子 (Topological Operators)
// 每个算子代表一种高阶的解析几何变换，而不是低级的语法树拼接。
// ----------------------------------------------------------------------------------
interface TopologicalOperator {
  id: string;
  weight: number;
  type: FunctionType | 'general'; // 如果涉及到特定类型（如sin），则标记类型
  // 算子作用函数。p 代表传入的常数或参数。
  apply: (expr: string, p: string) => string;
}

const TOPOLOGICAL_OPERATORS: TopologicalOperator[] = [
  // 【定义域撕裂/挤压类】
  { id: 'domain_log', weight: 1.5, type: 'exponential', apply: (expr, p) => `\\ln\\left(\\left|${expr}\\right| + ${p}\\right)` },
  { id: 'domain_sqrt', weight: 1.2, type: 'radical', apply: (expr, p) => `\\sqrt{${expr} + ${p}}` },

  // 【渐近线伪装类】
  { id: 'camou_slant', weight: 1.0, type: 'general', apply: (expr, p) => `${expr} + ${p}x` },
  { id: 'camou_inv', weight: 1.2, type: 'rational', apply: (expr, p) => `${expr} + \\frac{${p}}{x}` },
  { id: 'camou_exp', weight: 1.5, type: 'exponential', apply: (expr, p) => `${expr} + ${p}e^{-x}` },

  // 【对称性破缺类】
  { id: 'sym_break_sin', weight: 1.0, type: 'trigonometric', apply: (expr, p) => `${expr} + ${p}\\sin(x)` },
  { id: 'sym_break_mul', weight: 1.0, type: 'general', apply: (expr, p) => `\\left(${expr}\\right) \\cdot \\left(x + ${p}\\right)` },
  { id: 'sym_break_abs', weight: 1.0, type: 'absolute', apply: (expr, p) => `\\left|${expr}\\right| + ${p}x` },

  // 【频率/尺度扭曲类】
  { id: 'scale_x', weight: 0.8, type: 'general', apply: (expr, p) => expr.replace(/x/g, `\\left(${p}x\\right)`) },
  { id: 'shift_x', weight: 0.8, type: 'general', apply: (expr, p) => expr.replace(/x/g, `\\left(x - ${p}\\right)`) },
  { id: 'shift_y', weight: 0.5, type: 'general', apply: (expr, p) => `${expr} + ${p}` },

  // 【复合包裹类】
  { id: 'wrap_exp', weight: 1.2, type: 'exponential', apply: (expr, p) => `e^{${expr}} + ${p}` },
  { id: 'wrap_frac', weight: 1.5, type: 'rational', apply: (expr, p) => `\\frac{${p}}{${expr}}` }
];

// 简单验证函数是否有意义的评估点 (避免全量空集或常数)
function hasValidDomain(exprStr: string): boolean {
  // 避免过度空集，比如被多重根号包围，或者对数里面出现非正
  // 这里做启发式阻断，避免类似 \sqrt{-x^2 - 2} 的情况
  if (exprStr.includes('\\sqrt{-(x^2') || exprStr.includes('\\sqrt{-\\left(x^2')) {
    return false;
  }
  if (exprStr.includes('\\ln\\left(-\\left|')) {
    return false;
  }
  // 防止最后简化为无x的纯参数表达式
  if (!exprStr.includes('x')) {
    return false;
  }
  return true; 
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

  const maxAttempts = 100;
  let bestResult = { target: 'x', params: {} as Record<string, number> };
  let minDiffError = Infinity;

  // 筛选出允许的基础流形
  const availableManifolds = allowedTypes 
    ? BASE_MANIFOLDS.filter(m => allowedTypes.includes(m.type))
    : BASE_MANIFOLDS;
  
  // 如果所有类型都被过滤掉了，回退到最基础的线性
  const manifoldsToUse = availableManifolds.length > 0 ? availableManifolds : [{ expr: 'x', type: 'polynomial' as FunctionType }];

  // 筛选出允许的算子
  const availableOperators = allowedTypes
    ? TOPOLOGICAL_OPERATORS.filter(op => op.type === 'general' || allowedTypes.includes(op.type))
    : TOPOLOGICAL_OPERATORS;

  // 如果所有算子都被过滤掉了，留一个最安全的平移算子兜底
  const opsToUse = availableOperators.length > 0 ? availableOperators : [TOPOLOGICAL_OPERATORS.find(op => op.id === 'shift_y')!];

  for (let i = 0; i < maxAttempts; i++) {
    let currentWeight = 0;
    let expr = getRandom(manifoldsToUse).expr;
    
    const usedParams: Record<string, number> = {};
    const availableParams = ['a', 'b', 'c'];
    
    // 如果带参数，随机决定使用 1 到 3 个参数
    const paramCount = withParams ? Math.floor(Math.random() * 3) + 1 : 0;
    const targetParams = availableParams.slice(0, paramCount);

    let steps = 0;
    // 强制使用完分配的参数，或者达到目标难度
    while ((currentWeight < targetWeight || targetParams.length > 0) && steps < 6) {
      const op = getRandom(opsToUse);
      
      let pStr = '';
      if (targetParams.length > 0 && (Math.random() < 0.6 || steps > 3)) {
        // 消耗一个参数
        const pName = targetParams.shift()!;
        pStr = pName;
        // 给参数一个初始值，确保一开始图形可见且不退化
        usedParams[pName] = parseFloat(getFriendlyConst(true));
      } else {
        // 使用常数
        pStr = getFriendlyConst(true);
      }

      expr = op.apply(expr, pStr);
      currentWeight += op.weight;
      steps++;
    }

    // 清理多余的加减号
    expr = expr.replace(/\+\s*-/g, '- ');

    // 简单验证有效性
    if (!hasValidDomain(expr)) continue;

    // 检查参数是否被成功吃掉，并且是否实际出现在了表达式中
    if (withParams) {
      let paramMissing = false;
      for (const p in usedParams) {
        // 使用正则确保匹配的是独立的参数变量，而不是如 \arcsin 里的 a
        const paramRegex = new RegExp(`\\b${p}\\b`);
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
      bestResult = { target: expr, params: usedParams };
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
