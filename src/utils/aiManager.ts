import { logger } from './debug/logger';

export const AI_CONFIG = {
  defaultApiUrl: 'https://vg.v1api.cc/v1/chat/completions', 
  proxyApiUrl: 'https://guessfunc-proxy.iwantbeyondnow.workers.dev/v1/chat/completions', 
  model: 'deepseek-chat',
  maxRetries: 3,
};

export const DEFAULT_SYSTEM_PROMPT = `以下是一个猜函数游戏的规则：
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
3. 必须返回一个 JSON 对象，格式如下：{"expression": "LaTeX格式的表达式"}。不要有任何多余的文字。`;

export const DEFAULT_CHAT_SYSTEM_PROMPT = `你是一个数学游戏《猜函数》的智能助手。玩家正在尝试猜测一个隐藏的数学函数。
请注意：玩家在游戏中是可以直接看到函数图像的！
你必须根据玩家给出的问题，判断隐藏函数的性质，并只能回答“是”、“否”或“不知道”。
不要解释原因，不要给出推导过程，不要泄露函数本身。只输出这三个词之一。`;

class AIManager {
  private history: { role: string, content: string }[] = [];
  public chatHistory: { role: string, content: string }[] = [];
  private currentAbortController: AbortController | null = null;

  getSystemPrompt(): string {
    return localStorage.getItem('guessfunc_system_prompt') || DEFAULT_SYSTEM_PROMPT;
  }

  getChatSystemPrompt(): string {
    return localStorage.getItem('guessfunc_chat_prompt') || DEFAULT_CHAT_SYSTEM_PROMPT;
  }

  getAiWelcomeMessage(): string {
    return localStorage.getItem('guessfunc_ai_welcome') || '';
  }

  setAiWelcomeMessage(msg: string) {
    localStorage.setItem('guessfunc_ai_welcome', msg);
  }

  clearAiWelcomeMessage() {
    localStorage.removeItem('guessfunc_ai_welcome');
  }

  getApiKey(): string {
    return localStorage.getItem('guessfunc_api_key') || '';
  }

  hasValidKey(): boolean {
    // 只要有代理地址或者填了Key就算有效
    const hasProxy = !!AI_CONFIG.proxyApiUrl && !AI_CONFIG.proxyApiUrl.includes('YOUR_WORKER_DOMAIN_HERE');
    return hasProxy || !!this.getApiKey();
  }

  clearChatHistory() {
    this.chatHistory = [];
  }

  abortCurrentRequest() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  async fetchChatResponse(userMessage: string, targetFunction: string): Promise<string> {
    if (!this.hasValidKey()) {
      throw new Error('未配置 API Key 且未启用代理');
    }

    this.abortCurrentRequest();
    this.currentAbortController = new AbortController();

    const apiKey = this.getApiKey();
    const savedProxyPref = localStorage.getItem('guessfunc_use_proxy');
    const useProxy = savedProxyPref !== 'false';
    const targetUrl = (apiKey && !useProxy) ? AI_CONFIG.defaultApiUrl : AI_CONFIG.proxyApiUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const messages = [
      { role: "system", content: `${this.getChatSystemPrompt()}\n当前目标函数是: ${targetFunction}` },
      ...this.chatHistory,
      { role: "user", content: userMessage }
    ];

    try {
      // 10 秒超时
      const timeoutId = setTimeout(() => this.abortCurrentRequest(), 10000);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: messages,
          max_tokens: 500, // 增加 token 上限，避免欢迎语被截断
          temperature: 0.7 // 稍微提高温度，让欢迎语更自然
        }),
        signal: this.currentAbortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      this.chatHistory.push({ role: "user", content: userMessage });
      this.chatHistory.push({ role: "assistant", content: content });
      
      if (this.chatHistory.length > 10) {
        this.chatHistory = this.chatHistory.slice(-10);
      }

      return content;
    } catch (error: unknown) {
      const e = error as Error;
      if (e.name === 'AbortError') {
        throw new Error('请求超时，请重试');
      }
      throw e;
    } finally {
      this.currentAbortController = null;
    }
  }

  async fetchFunction(difficulty: number): Promise<string | null> {
    if (!this.hasValidKey()) {
      logger.error('No valid API key or proxy found for AI Manager');
      return null;
    }

    let attempts = 0;
    const maxAttempts = AI_CONFIG.maxRetries;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        logger.log(`[AIManager] 尝试生成函数 (第 ${attempts}/${maxAttempts} 次)...`);
        const result = await this._doFetch(difficulty);
        if (result) return result;
      } catch (e) {
        logger.error(`[AIManager] 第 ${attempts} 次尝试失败:`, e);
      }

      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return null;
  }

  private async _doFetch(difficulty: number): Promise<string | null> {
    const apiKey = this.getApiKey();
    const savedProxyPref = localStorage.getItem('guessfunc_use_proxy');
    const useProxy = savedProxyPref !== 'false';
    const targetUrl = (apiKey && !useProxy) ? AI_CONFIG.defaultApiUrl : AI_CONFIG.proxyApiUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

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
        model: AI_CONFIG.model,
        messages: messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      logger.error("[AIManager] API 响应错误:", response.status, errData);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    logger.log("[AIManager] AI 原始返回内容:", content);

    const parsed = this._parseJSON(content);
    if (parsed && parsed.expression) {
      this.history.push({ role: "user", content: userPrompt });
      this.history.push({ role: "assistant", content: content });
      
      if (this.history.length > 6) {
        this.history = this.history.slice(-6);
      }
      return parsed.expression;
    }
    return null;
  }

  private _parseJSON(str: string): Record<string, string> | null {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      try {
        const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          return JSON.parse(match[1].trim());
        }
        
        const firstBrace = str.indexOf('{');
        const lastBrace = str.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonPart = str.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonPart);
        }
      } catch (e2: unknown) {
        logger.error("Failed to parse JSON even with recovery", e2);
      }
    }
    return null;
  }
}

export const aiManager = new AIManager();