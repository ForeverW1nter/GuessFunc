/**
 * 数学引擎模块
 * 负责生成随机表达式、解析表达式、验证等价性
 */

const MathEngine = {
    // 配置
    config: {
        minDepth: 2, // 默认表达式最小深度
        maxDepth: 3, // 默认表达式最大深度 (中等难度)
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
                this.config.minDepth = 1;
                this.config.maxDepth = 2;
                this.config.functions = ['sin', 'cos', 'exp', 'log', 'sqrt', 'abs'];
                break;
            case 'medium':
                this.config.minDepth = 2;
                this.config.maxDepth = 3;
                this.config.functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'sqrt', 'abs'];
                break;
            case 'hard':
                this.config.minDepth = 3;
                this.config.maxDepth = 5;
                this.config.functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'sqrt', 'abs'];
                break;
            default:
                this.config.minDepth = 2;
                this.config.maxDepth = 3;
        }
    },

    /**
     * 生成随机表达式字符串
     * @param {number} depth 当前深度
     * @returns {string} 表达式字符串
     */
    generateRandomExpression: function(depth = 0) {
        // 如果达到最大深度，必须返回终结符
        if (depth >= this.config.maxDepth) {
            return this._getRandomTerminal();
        }

        // 随机决定生成什么：终结符、一元函数、二元运算
        const rand = Math.random();
        
        // 深度越深，终结概率越大
        const terminalProb = 0.1 + (depth / this.config.maxDepth) * 0.8;

        // 强制执行 minDepth
        if (depth < this.config.minDepth || rand > terminalProb) {
            // 生成非终结符 (函数或操作符)
            if (Math.random() < 0.4) { // 40% 概率生成一元函数
                let func = Utils.randomChoice(this.config.functions);
                func = func.replace(/\{.+/, ''); // 清洗
                const inner = this.generateRandomExpression(depth + 1);
                return `${func}(${inner})`;
            } else { // 60% 概率生成二元运算
                const op = Utils.randomChoice(this.config.operators);
                const left = this.generateRandomExpression(depth + 1);
                const right = this.generateRandomExpression(depth + 1);
                return `(${left} ${op} ${right})`;
            }
        } else {
            // 达到 minDepth 后，有概率生成终结符
            return this._getRandomTerminal();
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
     * 预处理用户输入的 LaTeX 风格的表达式
     * @param {string} expr 
     * @returns {string}
     */
    preprocessLatex: function(expr) {
        if (!expr) return "";
        let processed = expr.trim();

        // --- 全新重构，严格按顺序执行 ---

        // 1. 预处理：移除 \left 和 \right
        processed = processed.replace(/\\left/g, '').replace(/\\right/g, '');

        // 2. 最优先处理“容器”类命令，解放其内容
        processed = processed.replace(/\\frac{([^{}]+)}{([^{}]+)}/g, '(($1)/($2))');
        processed = processed.replace(/\\sqrt{([^{}]+)}/g, 'sqrt($1)');

        // 3. 标准化函数名 (统一为 math.js 使用的名称)
        processed = processed.replace(/\\arcsin/g, 'asin');
        processed = processed.replace(/\\arccos/g, 'acos');
        processed = processed.replace(/\\arctan/g, 'atan');
        processed = processed.replace(/\\sin/g, 'sin');
        processed = processed.replace(/\\cos/g, 'cos');
        processed = processed.replace(/\\tan/g, 'tan');
        processed = processed.replace(/\\ln/g, 'log');      // \ln -> log (自然对数)
        processed = processed.replace(/\\log/g, 'log10');   // \log -> log10
        processed = processed.replace(/\\sqrt/g, 'sqrt');
        processed = processed.replace(/\\exp/g, 'exp');
        processed = processed.replace(/\\pi/g, 'pi');
        processed = processed.replace(/\\cdot/g, '*');

        // 4. 为无括号的函数添加括号 (例如: acos x -> acos(x), atan2 -> atan(2))
        const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'sqrt', 'exp', 'abs'];
        funcs.forEach(fn => {
            const regex = new RegExp(`\\b${fn}\\s*([a-zA-Z0-9\\.]+)`, 'g');
            processed = processed.replace(regex, `${fn}($1)`);
        });

        // 5. 将所有剩余的 TeX 分组括号 {} 转换为标准括号 ()
        processed = processed.replace(/\{/g, '(').replace(/\}/g, ')');

        // 6. 处理特殊格式（绝对值）
        processed = processed.replace(/\|([^|]+)\|/g, 'abs($1)');

        // 7. 插入隐式乘法（安全模式）
        processed = processed.replace(/([0-9\.]+)([a-zA-Z\(])/g, '$1*$2'); // 3x, 3(x+1)
        processed = processed.replace(/\)([a-zA-Z0-9\(])/g, ')*$1');   // (x+1)x, (x+1)2
        processed = processed.replace(/([xy])\(/g, '$1*('); // x(x+1)

        return processed;
    },

    /**
     * 检查表达式是否在指定区间内有定义
     * @param {string} expr 表达式
     * @returns {boolean} 是否有定义
     */
    isDefinedInRange: function(expr) {
        try {
            const node = math.parse(expr);
            const code = node.compile();
            // 在 (-10, 10) 区间内测试 10 个点
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * 20 - 10;
                const result = code.evaluate({ x: x });
                // 如果结果是有效的实数，则认为有定义
                if (isFinite(result) && typeof result === 'number') {
                    return true;
                }
            }
        } catch (e) {
            // 解析或计算失败，视为无定义
            return false;
        }
        // 所有测试点都无定义
        return false;
    },

    /**
     * 递归计算表达式节点的深度
     * @param {math.Node} node 
     * @returns {number}
     */
    getExpressionDepth: function(node) {
        if (!node) return 0;
        if (node.isSymbolNode || node.isConstantNode) {
            return 1;
        }
        if (node.isOperatorNode || node.isFunctionNode) {
            if (!node.args || node.args.length === 0) return 1;
            // 深度 = 1 + 所有子节点中的最大深度
            return 1 + Math.max(...node.args.map(arg => this.getExpressionDepth(arg)));
        }
        return 1; // 对未知节点返回基础深度
    },

    /**
     * 获取表达式化简后的深度
     * @param {string} expr 
     * @returns {number}
     */
    getSimplifiedDepth: function(expr) {
        try {
            const simplifiedNode = math.simplify(expr);
            return this.getExpressionDepth(simplifiedNode);
        } catch (e) {
            return 0; // 如果化简或解析失败，返回0
        }
    },

    /**
     * 验证两个表达式是否等价
     * 采用“符号化简 + 数值验证”的综合方式
     * @param {string} targetExpr 目标表达式
     * @param {string} userExpr 用户表达式
     * @returns {boolean} 是否等价
     */
    verifyEquivalence: function(targetExpr, userExpr) {
        // 预处理双方，确保格式统一
        const processedTargetExpr = this.preprocessLatex(targetExpr);
        const processedUserExpr = this.preprocessLatex(userExpr);

        let node1, node2;
        try {
            node1 = math.parse(processedTargetExpr);
            node2 = math.parse(processedUserExpr);
        } catch (e) {
            Logger.error("Parsing error after preprocessing:", e, 
                {target: processedTargetExpr, user: processedUserExpr});
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
                Logger.log("Symbolic verification passed (simplify)!");
                return true;
            }
            
            // 尝试 rationalize (有理化)，对于多项式很有效
            try {
                const rationalized = math.rationalize(diffNode);
                if (rationalized.toString() === '0') {
                    Logger.log("Symbolic verification passed (rationalize)!");
                    return true;
                }
            } catch (ratError) {
                // rationalize 可能失败，忽略
            }
        } catch (e) {
            Logger.warn("Symbolic simplification failed, falling back to numerical.", e);
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
                    Logger.log(`Domain mismatch at x=${x}: ${val1} vs ${val2}`);
                    return false;
                }

                // 两者都有定义，比较数值
                if (Math.abs(val1 - val2) > epsilon) {
                    Logger.log(`Numerical mismatch at x=${x}: ${val1} vs ${val2}`);
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
            Logger.warn("No valid comparison points found in initial range. Extending search...");
            // 尝试在更广泛的范围内找点
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
            Logger.log("Verification inconclusive (no valid points). Assuming false.");
            return false;
        }

        Logger.log(`Numerical verification passed with ${validComparisons} points.`);
        return true;
    },

    /**
     * 检查表达式是否有效（基本语法检查）
     * @param {string} expr 
     * @returns {boolean}
     */
    isValid: function(expr) {
        try {
            // 在验证前先进行预处理
            const processedExpr = this.preprocessLatex(expr);
            math.parse(processedExpr);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// 暴露给全局
window.MathEngine = MathEngine;
