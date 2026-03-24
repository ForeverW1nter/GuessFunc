/**
 * AI 管理器模块 (AIManager)
 * 负责与 AI 接口进行通信，生成数学函数。
 */

const AIManager = {
    // --- 配置部分 ---
    config: {
        // 玩家自定义Key时使用的直连接口
        defaultApiUrl: 'https://vg.v1api.cc/v1/chat/completions', 
        // 你的代理服务器地址（填入你的 Cloudflare Worker 完整地址）
        // 例如：'https://guessfunc-proxy.yourname.workers.dev/v1/chat/completions'
        proxyApiUrl: 'https://guessfunc-proxy.iwantbeyondnow.workers.dev/v1/chat/completions', 
        model: 'deepseek-chat',
        maxRetries: 3,
    },

    // 对话历史管理
    history: [],
    requestCount: 0,

    // 默认系统提示词定义
    DEFAULT_SYSTEM_PROMPT: `以下是一个猜函数游戏的规则：
给定图象，目标是猜出f(x)的函数表达式。玩家可以输入对比函数、计算特定点的值f(2)、或观察变换后的图象f'(x+1)+2。如果存在参数，需要猜出包含参数的表达式如sin(x+a)。

你现在需要根据用户提供的难度系数生成函数表达式。
生成规则：
1. 可用元素：数字1~5, 变量x。
2. 一元函数：exp, ln, 三角函数, 反三角函数, 双曲三角函数。
3. 二元运算：+, -, *, /, ^。
4. 结构：可以将数放在函数或运算的对应位置生成一个块，块又可以当做数继续迭代。
5. 范围：定义域不一定要是R，但最好在[-10,10]^2的范围内有图像。
6. 题目质量：题目要求优质，可以通过层层剥离分析出来，不要太模板化。注意不是层数越深难度越高，你需要站在玩家的角度考虑难度。

难度系数参考：
- sin(x) 难度 0
- sin(x) + e^x 难度 1.2
- sin(cos(x) + 1) 难度 2.3
- 2tanh(x)(ln(x+5) - ln2) - 2 难度 4.5

重要格式要求：
1. 必须使用标准的 LaTeX 格式（例如：\\sin, \\cos, \\exp, \\ln, \\frac{}{}, ^{}, \\pi, e 等）。
2. 确保所有函数名都有反斜杠前缀。
3. 必须返回一个 JSON 对象，格式如下：{"expression": "LaTeX格式的表达式"}。不要有任何多余的文字。`,

    getSystemPrompt: function() {
        return localStorage.getItem('guessfunc_system_prompt') || this.DEFAULT_SYSTEM_PROMPT;
    },

    setSystemPrompt: function(prompt) {
        if (!prompt || prompt.trim() === '') {
            localStorage.removeItem('guessfunc_system_prompt');
        } else {
            localStorage.setItem('guessfunc_system_prompt', prompt.trim());
        }
    },

    /**
     * 检查是否有可用的 API
     */
    hasValidKey: function() {
        const hasProxy = this.config.proxyApiUrl && !this.config.proxyApiUrl.includes('YOUR_WORKER_DOMAIN_HERE');
        return hasProxy || !!this.getApiKey();
    },

    /**
     * 获取玩家自定义的 API Key
     */
    getApiKey: function() {
        // 1. 检查 URL Hash (用于临时授权)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashKey = hashParams.get('apikey');
        if (hashKey) {
            localStorage.setItem('guessfunc_api_key', hashKey);
            window.location.hash = ''; 
            return hashKey;
        }

        // 2. 检查本地存储 (用户自己填写的)
        return localStorage.getItem('guessfunc_api_key') || '';
    },

    /**
     * 调用 AI 生成一个数学函数 (包含重试逻辑)
     * @param {number} difficulty - 难度系数
     * @returns {Promise<string|null>}
     */
    fetchFunction: async function(difficulty) {
        if (!this.hasValidKey()) {
            if (typeof UIManager !== 'undefined' && UIManager.showMessage) {
                UIManager.showMessage("未配置代理接口且未检测到 API Key，已自动切换为本地随机生成。您可以在“选项 -> API 设置”中填入 Key 以启用 AI。", "info");
            }
            return null;
        }

        let attempts = 0;
        const maxAttempts = this.config.maxRetries;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                if (window.APP_DEBUG) {
                    console.log(`[AIManager] 尝试生成函数 (第 ${attempts}/${maxAttempts} 次)...`);
                }

                const result = await this._doFetch(difficulty);
                if (result) return result;

            } catch (e) {
                console.error(`[AIManager] 第 ${attempts} 次尝试失败:`, e);
            }

            if (attempts < maxAttempts) {
                // 等待一小会儿再重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.error(`[AIManager] 在 ${maxAttempts} 次尝试后仍未成功生成函数。`);
        return null;
    },

    /**
     * 实际执行网络请求
     * @private
     */
    _doFetch: async function(difficulty) {
        const apiKey = this.getApiKey();
        
        // 检查用户是否在设置中选择了使用代理
        const savedProxyPref = localStorage.getItem('guessfunc_use_proxy');
        // 默认使用代理，除非用户明确关闭了代理且填了 Key
        const useProxy = savedProxyPref !== 'false';
        
        // 如果玩家填了 Key 并且关闭了代理，就走直连接口并带上 Key；否则走代理接口（有 Key 就带，没 Key 由代理补全）
        const targetUrl = (apiKey && !useProxy) ? this.config.defaultApiUrl : this.config.proxyApiUrl;
        
        // 构造请求头
        const headers = {
            'Content-Type': 'application/json'
        };
        // 只有在玩家提供了自己的 Key 时，前端才需要发送 Authorization 头
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // 构造用户提示词，仅包含难度信息
        const userPrompt = `生成一个难度系数为 ${difficulty.toFixed(2)} 的题目。`;

        const messages = [
            { role: "system", content: this.getSystemPrompt() },
            ...this.history,
            { role: "user", content: userPrompt }
        ];

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                if (typeof UIManager !== 'undefined' && UIManager.showMessage) {
                    UIManager.showMessage(apiKey ? "API Key 无效，请检查设置。已自动切换为本地随机生成。" : "代理接口授权失败，请检查 Worker 配置。", "error");
                }
            } else if (response.status === 429) {
                if (typeof UIManager !== 'undefined' && UIManager.showMessage) {
                    UIManager.showMessage("请求过于频繁，请稍后再试（已触发防 DDoS 限制）。", "error");
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                if (window.APP_DEBUG) {
                    console.error("[AIManager] API 响应错误:", errData);
                }
            }
            return null;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (window.APP_DEBUG) {
            console.log("[AIManager] AI 原始返回内容:", content);
        }

        const parsed = this._parseJSON(content);
        if (parsed && parsed.expression) {
            // 成功后增加计数并更新历史
            this.requestCount++;
            
            // 历史中仅保留简洁的对话，避免 Token 爆炸
            this.history.push({ role: "user", content: userPrompt });
            this.history.push({ role: "assistant", content: content });
            
            // 限制历史长度（保留最近 3 轮）
            if (this.history.length > 6) {
                this.history = this.history.slice(-6);
            }
            return parsed.expression;
        }
        return null;
    },

    /**
     * 解析 AI 返回的 JSON 字符串，处理 Markdown 代码块等格式问题
     * @private
     */
    _parseJSON: function(str) {
        if (!str) return null;
        try {
            // 1. 尝试直接解析
            return JSON.parse(str);
        } catch (e) {
            try {
                // 2. 尝试提取 Markdown 代码块中的内容
                const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    return JSON.parse(match[1].trim());
                }
                
                // 3. 尝试寻找第一个 { 和最后一个 } 之间的内容
                const firstBrace = str.indexOf('{');
                const lastBrace = str.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonPart = str.substring(firstBrace, lastBrace + 1);
                    return JSON.parse(jsonPart);
                }
            } catch (e2) {
                console.error("Failed to parse JSON even with recovery:", e2, "Original string:", str);
            }
        }
        return null;
    }
};

window.AIManager = AIManager;
