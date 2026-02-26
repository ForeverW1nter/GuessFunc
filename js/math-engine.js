/**
 * Math Engine for Guess the Function
 * Handles expression parsing, differentiation, and equivalence checking.
 */

const MathEngine = {
    // Cache for derivatives to improve performance
    derivativeCache: {
        targetFuncStr: null,
        derivatives: []
    },

    /**
     * Evaluate an expression symbolically, replacing f(x), f'(x) etc. with the target function.
     */
    evaluateSymbolically: function(userInput, targetFuncStr) {
        try {
            // 1. Basic validation of user input
            let userNode;
            try {
                userNode = math.parse(userInput);
            } catch (e) {
                throw new Error("表达式语法错误，请检查括号或运算符。");
            }

            // Update cache if target function changed
            if (this.derivativeCache.targetFuncStr !== targetFuncStr) {
                try {
                    const targetNode = math.parse(targetFuncStr);
                    const derivatives = [targetNode];
                    for (let i = 1; i <= 5; i++) {
                        derivatives[i] = math.derivative(derivatives[i-1], 'x');
                    }
                    this.derivativeCache = { targetFuncStr, derivatives };
                } catch (e) {
                    console.error("Target function parse error:", e);
                    throw new Error("目标函数定义不合法。");
                }
            }

            const derivatives = this.derivativeCache.derivatives;

            // Normalize input aliases
            let processedInput = userInput
                .replace(/arcsin/g, 'asin')
                .replace(/arccos/g, 'acos')
                .replace(/arctan/g, 'atan');

            // Normalize input to handle f'(x), f''(x) etc.
            processedInput = processedInput.replace(/f('+)\((.*?)\)/g, (match, primes, args) => {
                return `__f${primes.length}__(${args})`;
            });
            processedInput = processedInput.replace(/f\((.*?)\)/g, '__f0__($1)');

            let node = math.parse(processedInput);
            
            // Transform the node to substitute __fN__ functions
            const finalTransformed = node.transform(function (n, path, parent) {
                if (n.type === 'FunctionNode' && n.name.startsWith('__f') && n.name.endsWith('__')) {
                    const match = n.name.match(/\d+/);
                    if (!match) return n;
                    const order = parseInt(match[0]);
                    const arg = n.args[0]; 
                    
                    if (order >= derivatives.length) return n;
                    const derivNode = derivatives[order];
                    
                    // Replace 'x' in derivNode with 'arg'
                    // We use clone() to avoid modifying the cached node
                    return derivNode.cloneDeep().transform(function (sn) {
                        if (sn.type === 'SymbolNode' && sn.name === 'x') {
                            return arg;
                        }
                        return sn;
                    });
                }
                return n;
            });

            // IMPORTANT: Simplify the result to prevent exponential growth of the string representation
            // but use a timeout or basic simplification if it's too complex.
            try {
                return math.simplify(finalTransformed);
            } catch (e) {
                return finalTransformed;
            }
        } catch (e) {
            console.error("Symbolic Evaluation Error:", e);
            throw e;
        }
    },

    /**
     * Check if two expressions are algebraically equivalent.
     * We use a combination of symbolic simplification and numeric sampling.
     * @param {string} expr1 - First expression string.
     * @param {string} expr2 - Second expression string.
     * @returns {boolean}
     */
    isEquivalent: function(expr1, expr2) {
        try {
            // 1. Cheap string comparison
            const s1 = expr1.replace(/\s/g, '');
            const s2 = expr2.replace(/\s/g, '');
            if (s1 === s2) return true;

            // 2. Numeric check (sampling) - usually faster and more robust
            let node1, node2;
            try {
                node1 = math.parse(expr1);
                node2 = math.parse(expr2);
            } catch (e) {
                return false;
            }

            const code1 = node1.compile();
            const code2 = node2.compile();

            const testPoints = [-5, -2, -1, -0.5, 0.1, 0.5, 1, 2, 5]; 
            const epsilon = 1e-8;

            let validPoints = 0;
            for (let x of testPoints) {
                try {
                    const v1 = code1.evaluate({x: x});
                    const v2 = code2.evaluate({x: x});
                    
                    const val1 = typeof v1 === 'number' ? v1 : (v1 && v1.re !== undefined ? v1.re : NaN);
                    const val2 = typeof v2 === 'number' ? v2 : (v2 && v2.re !== undefined ? v2.re : NaN);

                    if (isNaN(val1) || isNaN(val2) || !isFinite(val1) || !isFinite(val2)) continue; 
                    
                    validPoints++;
                    if (Math.abs(val1 - val2) > epsilon) {
                        return false;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (validPoints > 0) return true;

            // 3. Symbolic check as a fallback (limited)
            // Only try simplify if the strings are not too long to avoid hangs
            if (expr1.length < 500 && expr2.length < 500) {
                try {
                    const simplified1 = math.simplify(node1).toString();
                    const simplified2 = math.simplify(node2).toString();
                    if (simplified1 === simplified2) return true;
                } catch (e) {}
            }

            return false;
        } catch (e) {
            console.error("Equivalence Check Error:", e);
            return false;
        }
    }
};
