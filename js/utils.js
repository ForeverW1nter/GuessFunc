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


};

// 暴露给全局
window.Utils = Utils;

/**
 * 全局日志记录器
 * 根据 window.APP_DEBUG 的值决定是否输出日志
 */
const Logger = {
    log: function(...args) {
        if (window.APP_DEBUG) {
            console.log(...args);
        }
    },
    warn: function(...args) {
        if (window.APP_DEBUG) {
            console.warn(...args);
        }
    },
    error: function(...args) {
        if (window.APP_DEBUG) {
            console.error(...args);
        }
    }
};

// 暴露给全局
window.Logger = Logger;
