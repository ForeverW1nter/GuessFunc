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
  { expr: '\\operatorname{arsinh}(x)', type: 'inverse_hyperbolic' },
  { expr: '\\operatorname{artanh}(x)', type: 'inverse_hyperbolic' },
  { expr: 'e^{x}', type: 'exponential' },
  { expr: '\\ln(x)', type: 'exponential' }
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
    return getRandom(['1', '2', '3', '4', '0.5', '1.5']);
  }
  if (isMultiplier) {
    // 作为乘数时，避免使用 1（无意义）和 0，使用适中的数值
    return getRandom(['2', '3', '0.5', '-2', '-0.5', '1.5', '-1.5']);
  }
  // 普通加减常数
  return getRandom(['1', '2', '3', '4', '-1', '-2', '-3', '0.5', '-0.5']);
}

// ----------------------------------------------------------------------------------
// 2. 拓扑相变算子 (Topological Operators)
// 每个算子代表一种高阶的解析几何变换，而不是低级的语法树拼接。
// 分为 1D 算子（用于 x 的变形）和 2D 算子（用于混合 x, y 的隐式方程）
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
  { id: 'camou_slant', weight: 1.0, type: 'general', maxUses: 1, apply: (expr, p) => `${expr} + ${p}x` },
  { id: 'camou_inv', weight: 1.2, type: 'rational', maxUses: 1, apply: (expr, p) => `${expr} + \\frac{${p}}{x}` },
  { id: 'camou_exp', weight: 1.5, type: 'exponential', maxUses: 1, apply: (expr, p) => `${expr} + ${p}e^{-x}` },
  { id: 'camou_quad', weight: 1.8, type: 'general', maxUses: 1, apply: (expr, p) => `${expr} + ${p}x^2` },

  // 【对称性破缺类】
  { id: 'sym_break_sin', weight: 1.0, type: 'trigonometric', maxUses: 1, apply: (expr, p) => `${expr} + ${p}\\sin(x)` },
  { id: 'sym_break_mul', weight: 1.5, type: 'general', maxUses: 1, apply: (expr, p) => `\\left(${expr}\\right) \\cdot \\left(x + ${p}\\right)` },
  { id: 'sym_break_abs', weight: 1.0, type: 'absolute', maxUses: 1, apply: (expr, p) => `\\left|${expr}\\right| + ${p}x` },
  { id: 'sym_break_sign', weight: 1.0, type: 'general', maxUses: 1, apply: (expr, p) => `\\frac{${expr}}{x + ${p}}` },

  // 【频率/尺度扭曲类】
  { id: 'scale_x', weight: 0.8, type: 'general', maxUses: 2, apply: (expr, p) => expr.replace(/(?<![a-zA-Z\\])x(?![a-zA-Z])/g, `\\left(${p}x\\right)`) },
  { id: 'shift_x', weight: 0.8, type: 'general', maxUses: 2, apply: (expr, p) => expr.replace(/(?<![a-zA-Z\\])x(?![a-zA-Z])/g, `\\left(x + ${p}\\right)`) },
  { id: 'scale_y', weight: 0.8, type: 'general', maxUses: 1, apply: (expr, p) => `${p}\\left(${expr}\\right)` },
  { id: 'shift_y', weight: 0.5, type: 'general', maxUses: 2, apply: (expr, p) => `${expr} + ${p}` },

  // 【复合包裹类】
  { id: 'wrap_exp', weight: 1.2, type: 'exponential', maxUses: 1, apply: (expr, p) => `e^{${expr}} + ${p}` },
  { id: 'wrap_sin', weight: 1.2, type: 'trigonometric', maxUses: 1, apply: (expr, p) => `\\sin\\left(${expr} + ${p}\\right)` },
  { id: 'wrap_abs', weight: 0.8, type: 'absolute', maxUses: 1, apply: (expr, p) => `\\left|${expr}\\right| + ${p}` }
];

// 简单验证函数是否有意义的评估点 (避免全量空集或常数)
function hasValidDomain(exprStr: string): boolean {
  // 避免过度空集，比如被多重根号包围，或者对数里面出现非正
  if (exprStr.includes('\\sqrt{-(x^2') || exprStr.includes('\\sqrt{-\\left(x^2')) {
    return false;
  }
  if (exprStr.includes('\\ln\\left(-\\left|')) {
    return false;
  }
  // 避免出现套娃式无意义分数
  if (exprStr.includes('\\frac{') && (exprStr.match(/\\frac{/g) || []).length > 2) {
    return false;
  }
  // 防止最后简化为无x的纯参数表达式
  if (!exprStr.includes('x')) {
    return false;
  }
  return true; 
}

// 后处理 LaTeX 表达式，去除臃肿的多余括号和符号，提升美感
function postCleanLatex(expr: string): string {
  let s = expr;
  
  // 0. 特殊处理：将类似 2\left(...\right) 提取出来，避免冗余的加括号
  s = s.replace(/\+\s*-\s*/g, '- ');
  s = s.replace(/-\s*-\s*/g, '+ ');
  
  // 1. 清理多重冗余括号，例如 \sin(\left(2x\right)) -> \sin(2x)
  s = s.replace(/\\left\(\\left\((.*?)\\right\)\\right\)/g, '\\left($1\\right)');
  s = s.replace(/\(\\left\((.*?)\\right\)\)/g, '\\left($1\\right)');
  s = s.replace(/\\left\|\\left\((.*?)\\right\)\\right\|/g, '\\left|$1\\right|');
  
  // 2. 将普通括号替换为 \left( \right)，保证渲染时的高度自适应
  // 注意不要替换已经是 \left( 和 \right) 的括号，也不要替换不支持 \left \right 的地方
  s = s.replace(/(?<!\\left)\(/g, '\\left(');
  s = s.replace(/(?<!\\right)\)/g, '\\right)');

  // 2.5 将普通绝对值替换为 \left| \right|
  // 使用简单的状态机或者多次替换来配对 |
  // 这里必须非常小心不要把 \left| 或 \right| 中的 | 误判
  // 我们使用一个安全替换逻辑：如果连续找到两个孤立的 |
  while (s.match(/(?<!\\(?:left|right))\|([^|]+?)(?<!\\(?:left|right))\|/)) {
    s = s.replace(/(?<!\\(?:left|right))\|([^|]+?)(?<!\\(?:left|right))\|/g, '\\left|$1\\right|');
  }

  // 3. 对于简单的数字加减 x 的括号进行解除，例如 \left(x + 2\right) 如果在最外层或加减法中可以不带 left right
  // 但为了保守起见，我们主要清理乘法前面的 1x
  s = s.replace(/(?<![\d.])\b1x(?![a-zA-Z])/g, 'x');
  s = s.replace(/(?<![\d.])\b-1x(?![a-zA-Z])/g, '-x');
  s = s.replace(/(?<![\d.])\b1\\left\(/g, '\\left(');
  s = s.replace(/(?<![\d.])\b-1\\left\(/g, '-\\left(');
  
  // 4. 清理类似 \left(x\right) -> x 的极度简单括号 (只有当内部是单纯的 x 或者数字x 时)
  // 且前面不能是字母或 }（防止 \sinx, \operatorname{arsinh}x 变成非法或丑陋指令）
  // 并且不能紧跟 ^，以防止 \left(-0.5x\right)^2 变成 -0.5x^2 (后者数学意义不同)
  s = s.replace(/(?<![a-zA-Z}])\\left\((-?[\d.]*x)\\right\)(?!\^)/g, '$1');
  
  // 5. 清除开头的多余 + 号
  s = s.replace(/^\s*\+\s*/, '');
  
  // 6. 替换掉加负数的写法，比如 x + -2 变成 x - 2
  s = s.replace(/\+\s*-([\d.]+)/g, '- $1');
  
  return s;
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

    // 后处理净化 LaTeX 表达式
    expr = postCleanLatex(expr);

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
    bestResult.target = postCleanLatex(`\\left(${bestResult.target}\\right) + a`);
    bestResult.params = { a: 2 };
  }

  return bestResult;
}
