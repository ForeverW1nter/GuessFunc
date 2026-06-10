import { ComputeEngine } from '@cortex-js/compute-engine';

// -----------------------------------------------------------------------------
// 现代架构的数学验证引擎
// 核心思想：摒弃脆弱的正则表达式字符串匹配，完全采用抽象语法树(AST)和数值采样
// 工具选型：@cortex-js/compute-engine (原生支持 LaTeX 和符号计算)
// -----------------------------------------------------------------------------

// 单例模式复用 Compute Engine 实例，提升性能
export const ce = new ComputeEngine();
// 声明 x, y 为实数，这是函数的基本自变量
ce.declare('x', 'number');
ce.declare('y', 'number');

// 记录已声明的参数，避免重复声明引发异常
export const declaredParams = new Set<string>(['x', 'y']);
