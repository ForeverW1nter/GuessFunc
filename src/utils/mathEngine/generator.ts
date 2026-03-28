// src/utils/mathEngine/generator.ts
// Math engine generator

// Remove unused evaluateEquivalence if present

type NodeType = 'var' | 'const' | 'unary' | 'binary';

export abstract class ASTNode {
  abstract type: NodeType;
  abstract toString(): string;
  abstract evaluate(x: number): number;
  abstract getComplexity(): number;
  
  // 添加一个方法来判断该节点是否为纯常数树（不包含变量 x）
  abstract isConstant(): boolean;
  // 添加一个方法来计算如果该节点是纯常数，它的值是多少
  abstract getConstantValue(): number;
}

class VarNode extends ASTNode {
  type: NodeType = 'var';
  name: string;
  constructor(name: string = 'x') {
    super();
    this.name = name;
  }
  override toString() { return this.name; }
  override evaluate(x: number) { return x; }
  override getComplexity() { return 0; }
  override isConstant() { return false; }
  override getConstantValue(): number { throw new Error('Not a constant'); }
}

class ConstNode extends ASTNode {
  type: NodeType = 'const';
  public value: number;
  constructor(value: number) { 
    super(); 
    this.value = value;
  }
  override toString() { return this.value.toString(); }
  override evaluate() { return this.value; }
  override getComplexity() { return 0.1; }
  override isConstant() { return true; }
  override getConstantValue() { return this.value; }
}

type UnaryOp = 'exp' | 'ln' | 'sin' | 'cos' | 'tan' | 'arcsin' | 'arccos' | 'arctan' | 'sinh' | 'cosh' | 'tanh';

const UNARY_WEIGHTS: Record<UnaryOp, number> = {
  'sin': 0.2, 'cos': 0.2, 'tan': 0.5,
  'exp': 0.4, 'ln': 0.5,
  'arcsin': 0.8, 'arccos': 0.8, 'arctan': 0.6,
  'sinh': 0.7, 'cosh': 0.7, 'tanh': 0.8
};

class UnaryNode extends ASTNode {
  type: NodeType = 'unary';
  public op: UnaryOp;
  public child: ASTNode;
  
  constructor(op: UnaryOp, child: ASTNode) { 
    super(); 
    this.op = op;
    this.child = child;
  }
  
  override toString() {
    const inner = this.child.toString();
    if (this.op === 'exp') return `e^{${inner}}`;
    return `\\${this.op}\\left(${inner}\\right)`;
  }
  
  override evaluate(x: number) {
    const val = this.child.evaluate(x);
    switch (this.op) {
      case 'sin': return Math.sin(val);
      case 'cos': return Math.cos(val);
      case 'tan': return Math.tan(val);
      case 'exp': return Math.exp(val);
      case 'ln': return Math.log(val);
      case 'arcsin': return Math.asin(val);
      case 'arccos': return Math.acos(val);
      case 'arctan': return Math.atan(val);
      case 'sinh': return Math.sinh(val);
      case 'cosh': return Math.cosh(val);
      case 'tanh': return Math.tanh(val);
    }
  }

  override getComplexity(): number {
    // 如果子节点是常数，当前节点其实也是常数（比如 sin(1)），复杂度极低
    if (this.child.isConstant()) {
      return 0.1;
    }
    // 嵌套惩罚：如果子节点不是简单的变量或常数，增加额外复杂度
    const childComp = this.child.getComplexity();
    const penalty = (this.child.type === 'var' || this.child.type === 'const') ? 0 : 0.5;
    return UNARY_WEIGHTS[this.op] + childComp * 1.2 + penalty;
  }

  override isConstant() { return this.child.isConstant(); }
  override getConstantValue() { return this.evaluate(0); }
}

type BinaryOp = '+' | '-' | '*' | '/' | '^';

const BINARY_WEIGHTS: Record<BinaryOp, number> = {
  '+': 0.2, '-': 0.2, '*': 0.4, '/': 0.6, '^': 0.8
};

class BinaryNode extends ASTNode {
  type: NodeType = 'binary';
  public op: BinaryOp;
  public left: ASTNode;
  public right: ASTNode;

  constructor(op: BinaryOp, left: ASTNode, right: ASTNode) { 
    super(); 
    this.op = op;
    this.left = left;
    this.right = right;
  }
  
  override toString() {
    const l = this.left.toString();
    const r = this.right.toString();
    
    const isLeftAddSub = this.left.type === 'binary' && ((this.left as BinaryNode).op === '+' || (this.left as BinaryNode).op === '-');
    const isRightAddSub = this.right.type === 'binary' && ((this.right as BinaryNode).op === '+' || (this.right as BinaryNode).op === '-');
    const isRightMulDiv = this.right.type === 'binary' && ((this.right as BinaryNode).op === '*' || (this.right as BinaryNode).op === '/');

    const wrapLeft = isLeftAddSub && (this.op === '*' || this.op === '^');
    const wrapRight = (isRightAddSub && (this.op === '*' || this.op === '-')) || (isRightMulDiv && this.op === '*');

    const lStr = wrapLeft ? `\\left(${l}\\right)` : l;
    const rStr = wrapRight ? `\\left(${r}\\right)` : r;

    if (this.op === '/') return `\\frac{${l}}{${r}}`;
    if (this.op === '^') return `{${lStr}}^{${r}}`;
    if (this.op === '*') return `${lStr} \\cdot ${rStr}`;
    return `${lStr} ${this.op} ${rStr}`;
  }
  
  override evaluate(x: number) {
    const lVal = this.left.evaluate(x);
    const rVal = this.right.evaluate(x);
    switch (this.op) {
      case '+': return lVal + rVal;
      case '-': return lVal - rVal;
      case '*': return lVal * rVal;
      case '/': return lVal / rVal;
      case '^': return Math.pow(lVal, rVal);
    }
  }

  override getComplexity(): number {
    // 如果左右都是常数，当前节点其实也是常数（比如 2+3），复杂度极低
    if (this.left.isConstant() && this.right.isConstant()) {
      return 0.1;
    }
    // 特殊情况化简：0 乘以任何数、任何数乘以 0 都是 0
    if (this.op === '*' && ((this.left.isConstant() && this.left.getConstantValue() === 0) || (this.right.isConstant() && this.right.getConstantValue() === 0))) {
      return 0.1;
    }
    // 特殊情况化简：任何数的 0 次方都是 1
    if (this.op === '^' && this.right.isConstant() && this.right.getConstantValue() === 0) {
      return 0.1;
    }
    return BINARY_WEIGHTS[this.op] + this.left.getComplexity() + this.right.getComplexity();
  }

  override isConstant() { return this.left.isConstant() && this.right.isConstant(); }
  override getConstantValue() { return this.evaluate(0); }
}

// ---------------------------------------------------------
// 生成器逻辑
// ---------------------------------------------------------

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomNode(currentDepth: number, maxDepth: number): ASTNode {
  // 叶子节点
  if (currentDepth >= maxDepth || Math.random() < 0.3 / (currentDepth + 1)) {
    if (Math.random() < 0.6) {
      return new VarNode();
    } else {
      const val = Math.floor(Math.random() * 5) + 1; // 1~5
      return new ConstNode(val);
    }
  }

  // 内部节点
  if (Math.random() < 0.5) {
    // Unary
    const ops: UnaryOp[] = ['sin', 'cos', 'tan', 'exp', 'ln', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh'];
    const op = getRandomElement(ops);
    return new UnaryNode(op, generateRandomNode(currentDepth + 1, maxDepth));
  } else {
    // Binary
    const ops: BinaryOp[] = ['+', '-', '*', '/', '^'];
    const op = getRandomElement(ops);
    return new BinaryNode(op, generateRandomNode(currentDepth + 1, maxDepth), generateRandomNode(currentDepth + 1, maxDepth));
  }
}

// 检查在 [-10, 10] 范围内是否有合理图像
function hasValidGraph(node: ASTNode): boolean {
  let validPoints = 0;
  let tooLargePoints = 0;
  
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() * 20) - 10; // [-10, 10]
    const y = node.evaluate(x);
    
    if (Number.isFinite(y)) {
      if (Math.abs(y) <= 100) {
        validPoints++;
      } else {
        tooLargePoints++;
      }
    }
  }
  
  // 至少要有 10 个有效点，且有效点比例不能太低
  return validPoints >= 10 && (validPoints >= tooLargePoints * 0.5);
}

// 后处理化简一下多余的常数计算或者无意义的节点，不过为了简单起见，可以依靠难度筛选机制
export function generateFunctionByDifficulty(targetDifficulty: number): string {
  // 如果难度很低，直接返回预设
  if (targetDifficulty <= 0.5) {
    const basics = ['x', 'x^2', '\\sin(x)', '\\cos(x)', '\\ln(x)', 'e^x'];
    return getRandomElement(basics);
  }

  // 用户难度系数 (0~5) 映射到内部复杂度
  // 参考：sin(x)+e^x 用户为 1.2，内部为 0.8 -> 比例约 1.5
  const internalTarget = targetDifficulty / 1.5;

  const maxAttempts = 1000;
  let bestNode: ASTNode | null = null;
  let minDiffError = Infinity;

  // 根据目标难度动态调整最大深度
  const maxDepth = Math.min(5, Math.ceil(targetDifficulty * 1.5));

  for (let i = 0; i < maxAttempts; i++) {
    // 强制根节点至少包含 x，避免生成全是常数的式子
    const node = generateRandomNode(0, maxDepth);
    
    // 确保生成的式子包含 x
    const str = node.toString();
    if (!str.includes('x')) continue;

    const comp = node.getComplexity();
    const diffError = Math.abs(comp - internalTarget);

    if (diffError < 0.3 && hasValidGraph(node)) {
      // 进一步优化：不要太模板化，结构好
      return node.toString();
    }

    if (diffError < minDiffError && hasValidGraph(node)) {
      minDiffError = diffError;
      bestNode = node;
    }
  }

  // 如果找不到非常贴合的，返回最接近的
  return bestNode ? bestNode.toString() : 'x^2';
}
