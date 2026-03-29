import { logger } from './debug/logger';
import i18n from '../i18n';

export const AI_CONFIG = {
  defaultApiUrl: 'https://vg.v1api.cc/v1/chat/completions', 
  proxyApiUrl: 'https://guessfunc-proxy.iwantbeyondnow.workers.dev/v1/chat/completions', 
  model: 'deepseek-chat',
  maxRetries: 3,
};

class AIManager {
  private history: { role: string, content: string }[] = [];
  public chatHistory: { role: string, content: string }[] = [];
  private currentAbortController: AbortController | null = null;

  getSystemPrompt(): string {
    return localStorage.getItem('guessfunc_system_prompt') || i18n.t('ai.genPromptDefault');
  }

  getChatSystemPrompt(): string {
    return localStorage.getItem('guessfunc_chat_prompt') || i18n.t('ai.chatPromptDefault');
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
      throw new Error(i18n.t('ai.noKeyError', '未配置 API Key 且未启用代理'));
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
        throw new Error(`${i18n.t('ai.apiError', 'API 请求失败')}: ${response.status}`);
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
        throw new Error(i18n.t('ai.timeoutError', '请求超时，请重试'));
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

    const userPrompt = i18n.t('ai.generatePrompt', '生成一个难度系数为 {{diff}} 的题目。', { diff: difficulty.toFixed(2) });

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