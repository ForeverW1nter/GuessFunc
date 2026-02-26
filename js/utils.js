/**
 * 工具函数模块
 * 提供通用的 URL 解析、编码解码等功能
 */

const Utils = {
    /**
     * 获取 URL 参数
     * @param {string} name 参数名
     * @returns {string|null} 参数值
     */
    getQueryParam: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    /**
     * 设置 URL 参数（不刷新页面）
     * @param {string} key 参数名
     * @param {string} value 参数值
     */
    setQueryParam: function(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },

    /**
     * 加密关卡字符串 (AES)
     * @param {string} expression 目标表达式
     * @returns {string} 编码后的字符串
     */
    encodeLevel: function(expression) {
        if (!expression) return "";
        try {
            // 使用 CryptoJS 进行 AES 加密
            const key = CryptoJS.enc.Utf8.parse("GuessFuncSecretK"); // 16 bytes key
            const iv = CryptoJS.enc.Utf8.parse("GuessFuncSecretI");  // 16 bytes IV
            const encrypted = CryptoJS.AES.encrypt(expression, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            // URL 安全的 Base64
            let str = encrypted.toString();
            str = str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            return str;
        } catch (e) {
            console.error("Encoding error:", e);
            return "";
        }
    },

    /**
     * 解密关卡字符串 (AES)
     * @param {string} encoded 编码后的字符串
     * @returns {string} 解码后的表达式
     */
    decodeLevel: function(encoded) {
        if (!encoded) return null;
        try {
            // 恢复 URL 安全的 Base64
            let str = encoded.replace(/-/g, '+').replace(/_/g, '/');
            while (str.length % 4) str += '=';
            
            const key = CryptoJS.enc.Utf8.parse("GuessFuncSecretK");
            const iv = CryptoJS.enc.Utf8.parse("GuessFuncSecretI");
            const decrypted = CryptoJS.AES.decrypt(str, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decoding error:", e);
            return null;
        }
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text 要复制的文本
     */
    copyToClipboard: function(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert("链接已复制到剪贴板！");
            }).catch(err => {
                console.error('Could not copy text: ', err);
                prompt("请手动复制链接：", text);
            });
        } else {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                alert("链接已复制到剪贴板！");
            } catch (err) {
                prompt("请手动复制链接：", text);
            }
            document.body.removeChild(textArea);
        }
    },

    /**
     * 生成随机整数
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {number}
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 从数组中随机选择一个元素
     * @param {Array} arr 数组
     * @returns {*} 随机元素
     */
    randomChoice: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * 将 LaTeX 转换为 Math.js 可识别的表达式
     * @param {string} latex
     * @returns {string}
     */
    latexToMathJs: function(latex) {
        if (!latex) return "";
        let s = latex;

        // 1. 标准化函数名和符号
        s = s.replace(/\\left/g, "").replace(/\\right/g, "");
        s = s.replace(/\\sin/g, "sin");
        s = s.replace(/\\cos/g, "cos");
        s = s.replace(/\\tan/g, "tan");
        s = s.replace(/\\arcsin/g, "asin");
        s = s.replace(/\\arccos/g, "acos");
        s = s.replace(/\\arctan/g, "atan");
        s = s.replace(/\\ln/g, "log"); 
        s = s.replace(/\\log/g, "log10");
        s = s.replace(/\\sqrt/g, "sqrt");
        s = s.replace(/\\exp/g, "exp");
        s = s.replace(/\\cdot/g, "*");
        s = s.replace(/\\pi/g, "pi");
        
        // 2. 处理分数 \frac{a}{b} -> ((a)/(b))
        // 简单处理多层嵌套
        for (let i = 0; i < 5; i++) {
            s = s.replace(/\\frac{([^{}]+)}{([^{}]+)}/g, "(($1)/($2))");
        }
        
        // 3. 处理指数 ^{...} -> ^(...)
        s = s.replace(/\^\{([^{}]+)\}/g, "^($1)");
        
        // 4. 处理绝对值 |...| -> abs(...)
        s = s.replace(/\|([^|]+)\|/g, "abs($1)");

        // 5. 关键修复：处理函数参数无括号的情况 (如 sin 2x -> sin(2x))
        // 匹配模式：函数名 + 空格 + 参数 (直到遇到运算符或结束)
        // 注意：这只是一个启发式修复，不能覆盖所有复杂情况
        const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'sqrt', 'exp', 'abs'];
        funcs.forEach(fn => {
            // 匹配 fn 后跟空格，然后捕获非运算符字符序列
            // 排除已经有括号的情况
            const regex = new RegExp(`\\b${fn}\\s+([a-zA-Z0-9\\.]+)`, 'g');
            s = s.replace(regex, `${fn}($1)`);
            
            // 处理 sin2x -> sin(2x) 这种情况 (函数名后紧跟数字)
            const regex2 = new RegExp(`\\b${fn}(\\d+[a-zA-Z0-9\\.]*)`, 'g');
            s = s.replace(regex2, `${fn}($1)`);
        });

        // 6. 关键修复：处理隐式乘法 (如 2x -> 2*x, x sin x -> x * sin(x))
        // 为了防止破坏函数名 (例如 atan 被当做 a*tan)，我们需要先保护长函数名
        const longFuncs = ['asin', 'acos', 'atan', 'log10', 'sqrt'];
        // 替换为占位符
        longFuncs.forEach((fn, index) => {
            s = s.replace(new RegExp(fn, 'g'), `__FN${index}__`);
        });

        // 数字接变量: 2x -> 2*x
        s = s.replace(/(\d)([a-zA-Z])/g, "$1*$2");
        
        // 变量接变量: 这里还是不处理 xy -> x*y，以免误伤
        
        // 变量/数字/闭括号 接 函数 (短名字)
        // 注意：此时长函数名已经是占位符了，不用担心 atan 被匹配成 a*tan
        // 但是占位符本身可能被匹配吗？ __FN0__
        // 我们的正则只匹配 tan, sin, cos, exp, log, abs
        const shortFuncs = ['sin', 'cos', 'tan', 'exp', 'log', 'abs'];
        shortFuncs.forEach(fn => {
            const regex = new RegExp(`([a-zA-Z0-9\\)])\\s*${fn}`, 'g');
            s = s.replace(regex, `$1*${fn}`);
        });

        // 闭括号接开括号: )( -> )*(
        s = s.replace(/\)\s*\(/g, ")*(");
        // 数字接开括号: 2( -> 2*(
        s = s.replace(/(\d)\s*\(/g, "$1*(");
        
        // 恢复长函数名
        longFuncs.forEach((fn, index) => {
            s = s.replace(new RegExp(`__FN${index}__`, 'g'), fn);
        });
        // 变量接开括号: x( -> x*(  (排除函数调用)
        // 这步很难区分 func( 和 x(。
        // 假设所有函数都已经处理为 func(...)，那么剩下的 word(...) 可能是隐式乘法？
        // 暂不处理，避免误伤函数。

        // 7. 清理多余空格
        s = s.replace(/\s+/g, "");

        return s;
    }
};

// 暴露给全局
window.Utils = Utils;
