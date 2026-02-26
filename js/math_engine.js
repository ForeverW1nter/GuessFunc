/**
 * 数学引擎模块
 * 负责生成随机表达式、解析表达式、验证等价性
 */

const MathEngine = {
    // 配置
    config: {
        maxDepth: 4, // 默认表达式最大深度 (中等难度)
        functions: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'sqrt', 'abs'], 
        operators: ['+', '-', '*', '/'], 
        constants: [1, 2, 3, 4, 5], 
        variables: ['x'], 
    },

    /**
     * 设置难度
     * @param {string} level 'easy' | 'medium' | 'hard'
     */
    setDifficulty: function(level) {
        switch(level) {
            case 'easy':
                this.config.maxDepth = 2;
                this.config.functions = ['sin', 'cos', 'exp', 'log', 'sqrt', 'abs']; // 减少复杂函数
                break;
            case 'medium':
                this.config.maxDepth = 4;
                this.config.functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'sqrt', 'abs'];
                break;
            case 'hard':
                this.config.maxDepth = 6;
                this.config.functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'sqrt', 'abs'];
                break;
            default:
                this.config.maxDepth = 4;
        }
    },

    /**
     * 生成随机表达式字符串
     * @param {number} depth 当前深度
     * @returns {string} 表达式字符串
     */
    generateRandomExpression: function(depth = 0) {
        // 如果达到最大深度，必须返回终结符（变量或常数）
        if (depth >= this.config.maxDepth) {
            return this._getRandomTerminal();
        }

        // 随机决定生成什么：终结符、一元函数、二元运算
        // 随着深度增加，终结符概率增加
        const rand = Math.random();
        // 深度越深，终结概率越大
        // depth=0: prob=0.1
        // depth=max: prob=0.9
        const terminalProb = 0.1 + (depth / this.config.maxDepth) * 0.8; 

        if (rand < terminalProb) {
            return this._getRandomTerminal();
        } else if (rand < terminalProb + (1 - terminalProb) / 3) {
            // 生成一元函数 (1/3 probability of non-terminal)
            const func = Utils.randomChoice(this.config.functions);
            const inner = this.generateRandomExpression(depth + 1);
            return `${func}(${inner})`;
        } else {
            // 生成二元运算 (2/3 probability of non-terminal)
            const op = Utils.randomChoice(this.config.operators);
            const left = this.generateRandomExpression(depth + 1);
            const right = this.generateRandomExpression(depth + 1);
            return `(${left} ${op} ${right})`;
        }
    },

    /**
     * 获取随机终结符
     * @private
     */
    _getRandomTerminal: function() {
        if (Math.random() < 0.7) {
            return Utils.randomChoice(this.config.variables);
        } else {
            return Utils.randomChoice(this.config.constants);
        }
    },

    /**
     * 辅助函数：将结果转为实数，如果是复数则返回 NaN
     */
    _toReal: function(val) {
        if (typeof val === 'number') return val;
        // 如果是 math.js 的 Complex 对象或其他非数值
        return NaN;
    },

    /**
     * 验证两个表达式是否等价
     * 采用“符号化简 + 数值验证”的综合方式
     * @param {string} targetExpr 目标表达式
     * @param {string} userExpr 用户表达式
     * @returns {boolean} 是否等价
     */
    verifyEquivalence: function(targetExpr, userExpr) {
        // 1. 预处理：解析表达式
        let node1, node2;
        try {
            node1 = math.parse(targetExpr);
            node2 = math.parse(userExpr);
        } catch (e) {
            console.error("Parsing error:", e);
            // 尝试在解析失败时进行更积极的预处理? 
            // 已经在 Utils.latexToMathJs 做了一部分，这里暂不处理
            return false;
        }

        // 2. 符号验证尝试：相减并化简
        try {
            // 构造差异表达式: (target) - (user)
            const diffNode = new math.OperatorNode('-', 'subtract', [node1, node2]);
            
            // 使用 math.simplify 尝试化简
            const simplified = math.simplify(diffNode);
            // 检查是否化简为 0
            const sString = simplified.toString();
            if (sString === '0' || sString === ' -0') {
                console.log("Symbolic verification passed (simplify)!");
                return true;
            }
            
            // 尝试 rationalize (有理化)，对于多项式很有效
            try {
                const rationalized = math.rationalize(diffNode);
                if (rationalized.toString() === '0') {
                    console.log("Symbolic verification passed (rationalize)!");
                    return true;
                }
            } catch (ratError) {
                // rationalize 可能失败，忽略
            }
        } catch (e) {
            console.warn("Symbolic simplification failed, falling back to numerical.", e);
        }

        // 3. 数值验证 (作为补充，防止符号化简失败)
        // 关键改进：增加在定义域内的采样密度
        // 默认点
        const testPoints = [-5, -Math.PI, -2, -1, -0.5, 0, 0.5, 1, 2, Math.PI, 5];
        
        // 增加 [-1, 1] 区间的密集采样 (针对 asin, acos 等)
        for(let i=0; i<10; i++) testPoints.push((Math.random() - 0.5) * 2);
        
        // 增加宽范围采样
        for(let i=0; i<10; i++) testPoints.push((Math.random() - 0.5) * 20);

        let validComparisons = 0;
        const epsilon = 1e-4; // 稍微放宽精度要求，应对浮点误差

        let code1, code2;
        try {
            code1 = node1.compile();
            code2 = node2.compile();
        } catch (e) {
            return false;
        }

        for (let x of testPoints) {
            try {
                const scope = { x: x };
                let val1 = code1.evaluate(scope);
                let val2 = code2.evaluate(scope);

                // 转换为实数 (处理复数结果)
                val1 = this._toReal(val1);
                val2 = this._toReal(val2);

                // 检查定义域
                const isDefined1 = isFinite(val1) && !isNaN(val1);
                const isDefined2 = isFinite(val2) && !isNaN(val2);

                if (!isDefined1 && !isDefined2) {
                    // 两者都无定义，视为一致，但不计入有效比较
                    continue; 
                }

                if (isDefined1 !== isDefined2) {
                    // 一个有定义，一个无定义 -> 不等价
                    console.log(`Domain mismatch at x=${x}: ${val1} vs ${val2}`);
                    return false;
                }

                // 两者都有定义，比较数值
                if (Math.abs(val1 - val2) > epsilon) {
                    console.log(`Numerical mismatch at x=${x}: ${val1} vs ${val2}`);
                    return false;
                }
                
                validComparisons++;
            } catch (e) {
                // 计算出错，跳过
                continue;
            }
        }

        // 如果没有有效比较点，我们无法确定。
        if (validComparisons === 0) {
            console.warn("No valid comparison points found in initial range. Extending search...");
            // 尝试在更广泛的范围内找点，或者针对特定区间找点
            // 尝试找一个有定义的点
            for(let i=0; i<50; i++) {
                // 混合不同尺度的随机数
                const scale = (i % 3 === 0) ? 1 : ((i % 3 === 1) ? 10 : 100);
                const x = (Math.random() - 0.5) * 2 * scale; 
                try {
                    let val1 = code1.evaluate({x});
                    let val2 = code2.evaluate({x});
                    val1 = this._toReal(val1);
                    val2 = this._toReal(val2);
                    
                    const d1 = isFinite(val1) && !isNaN(val1);
                    const d2 = isFinite(val2) && !isNaN(val2);

                    if (d1 && d2) {
                        if (Math.abs(val1 - val2) > epsilon) return false;
                        validComparisons++;
                    } else if (d1 !== d2) {
                         return false;
                    }
                } catch(e) {}
            }
        }

        if (validComparisons === 0) {
            console.log("Verification inconclusive (no valid points). Assuming false.");
            return false;
        }

        console.log(`Numerical verification passed with ${validComparisons} points.`);
        return true;
    },

    /**
     * 检查表达式是否有效（基本语法检查）
     * @param {string} expr 
     * @returns {boolean}
     */
    isValid: function(expr) {
        try {
            math.parse(expr);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// 暴露给全局
window.MathEngine = MathEngine;
