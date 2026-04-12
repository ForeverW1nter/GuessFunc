import { logger } from './debug/logger';
import i18n from '../i18n';
import { SYSTEM_LOGS } from './systemLogs';
import { GAME_CONSTANTS } from './constants';

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
    return localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT) || i18n.t('ai.genPromptDefault');
  }

  getChatSystemPrompt(): string {
    return localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.CHAT_PROMPT) || i18n.t('ai.chatPromptDefault');
  }

  getAiWelcomeMessage(): string {
    return localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.AI_WELCOME) || '';
  }

  setAiWelcomeMessage(msg: string) {
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.AI_WELCOME, msg);
  }

  clearAiWelcomeMessage() {
    localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.AI_WELCOME);
  }

  getApiKey(): string {
    return localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.API_KEY) || '';
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
      throw new Error(i18n.t('ai.noKeyError'));
    }

    this.abortCurrentRequest();
    this.currentAbortController = new AbortController();

    const apiKey = this.getApiKey();
    const savedProxyPref = localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.USE_PROXY);
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
        throw new Error(`${i18n.t('ai.apiError')}: ${response.status}`);
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
        throw new Error(i18n.t('ai.timeoutError'));
      }
      throw e;
    } finally {
      this.currentAbortController = null;
    }
  }

  async fetchFunction(difficulty: number): Promise<string | null> {
    if (!this.hasValidKey()) {
      logger.error(SYSTEM_LOGS.AI_NO_API_KEY);
      return null;
    }

    let attempts = 0;
    const maxAttempts = AI_CONFIG.maxRetries;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        logger.log(SYSTEM_LOGS.AI_GENERATION_ATTEMPT(attempts, maxAttempts));
        const result = await this._doFetch(difficulty);
        if (result) return result;
      } catch (e) {
        logger.error(SYSTEM_LOGS.AI_GENERATION_FAILED(attempts), e);
      }

      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return null;
  }

  private async _doFetch(difficulty: number): Promise<string | null> {
    const apiKey = this.getApiKey();
    const savedProxyPref = localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.USE_PROXY);
    const useProxy = savedProxyPref !== 'false';
    const targetUrl = (apiKey && !useProxy) ? AI_CONFIG.defaultApiUrl : AI_CONFIG.proxyApiUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const userPrompt = i18n.t('ai.generatePrompt', { diff: difficulty.toFixed(2) });

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
      logger.error(SYSTEM_LOGS.AI_API_ERROR, response.status, errData);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    logger.log(SYSTEM_LOGS.AI_RAW_RESPONSE, content);

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
        logger.error(SYSTEM_LOGS.AI_PARSE_RECOVERY_FAILED, e2);
      }
    }
    return null;
  }
}

export const aiManager = new AIManager();