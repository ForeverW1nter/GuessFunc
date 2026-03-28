import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useGameStore } from '../../../store/useGameStore';
import { aiManager } from '../../../utils/aiManager';
import { Bot, User } from 'lucide-react';

export const AiChatModal: React.FC = () => {
  const { t } = useTranslation();
  const { isAiChatOpen, setAiChatOpen, addToast } = useUIStore();
  const { targetFunction } = useGameStore();
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 当目标函数改变时（开始新关卡），清空聊天记录
  useEffect(() => {
    aiManager.clearChatHistory();
    setMessages([]);
    setHasInitialized(false); // 重置初始化状态
  }, [targetFunction]);

  // 当界面打开且未初始化时，生成欢迎语
  useEffect(() => {
    if (isAiChatOpen && !hasInitialized) {
      setHasInitialized(true);
      const initWelcome = async () => {
        // 如果已经缓存了欢迎语，直接使用
        const cachedWelcome = aiManager.getAiWelcomeMessage();
        if (cachedWelcome) {
          setMessages([{ role: 'ai', content: cachedWelcome }]);
          return;
        }

        setIsLoading(true);
        try {
          const prompt = `你是《猜函数》游戏中的 AI 助手。现在玩家打开了聊天面板。
请根据你作为游戏内助手的身份，用友好且带有一点引导性的语气向玩家打个招呼。
请务必在欢迎语中向玩家说明以下几点（这是你的核心规则，你必须告诉玩家）：
1. 玩家可以问你关于“当前目标函数”的数学特征问题（例如：“函数是否经过原点？”、“导数是否始终大于0？”等）。
2. 你是一个非常严格的助手，你只能回答 "是"、"否" 或 "不知道"，绝不会给出其他解释。
3. 你绝不会直接泄露目标函数的表达式。

请直接输出你的欢迎语，不要包含任何多余的解释，保持语句通顺自然。`;
          
          const response = await aiManager.fetchChatResponse(prompt, targetFunction);
          
          // 为了不让这条系统提示词污染真实的对话历史，我们可以将历史记录中的最后两轮（即刚发的 prompt 和 AI 的回答）删掉，
          // 然后手动将生成的欢迎语作为第一条历史记录插入。
          if (aiManager.chatHistory.length >= 2) {
            aiManager.chatHistory.splice(-2, 2);
            aiManager.chatHistory.push({ role: "assistant", content: response });
          }

          // 缓存欢迎语，这样下次换关卡时如果提示词没变，就不用再生成了
          aiManager.setAiWelcomeMessage(response);
          setMessages([{ role: 'ai', content: response }]);
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : '初始化失败';
          setMessages([{ role: 'ai', content: t('ai.welcomeError', { error: errorMsg }), isError: true } as unknown as { role: 'ai', content: string }]);
        } finally {
          setIsLoading(false);
        }
      };
      initWelcome();
    }
  }, [isAiChatOpen, hasInitialized, targetFunction, t]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isAiChatOpen) return null;

  const handleClose = () => {
    setAiChatOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiManager.fetchChatResponse(userMessage, targetFunction);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : t('ai.sendError');
      addToast(errorMsg, 'error');
      // 如果发生错误（比如超时），AI回复一条标红的错误信息
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg, isError: true } as unknown as { role: 'ai', content: string }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full md:max-w-[600px] h-full md:h-[90vh] bg-modal-bg text-modal-text md:rounded-[16px] shadow-modal overflow-hidden border-none md:border md:border-card-border flex flex-col animate-zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0">
          <div className="flex items-center gap-[12px]">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-app-primary"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
            <h2 className="m-0 text-[1.25rem] font-semibold text-app-text">{t('ai.title')}</h2>
          </div>
          <button 
            onClick={handleClose}
            className="w-[40px] h-[40px] flex items-center justify-center text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] hover:rotate-90 rounded-full transition-all"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-[20px] flex flex-col gap-[16px] bg-app-bg custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start max-w-[85%] gap-[8px] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'ai' ? (
                  <div className="w-[28px] h-[28px] rounded-full bg-app-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="w-[28px] h-[28px] rounded-full bg-[#2A2A2E] flex items-center justify-center shrink-0 shadow-sm border border-[#3A3A3E]">
                    <User size={16} className="text-[#A0A0A5]" />
                  </div>
                )}
                <div 
                  className={`px-[16px] py-[10px] rounded-[16px] text-[0.95rem] leading-[1.5] shadow-sm whitespace-pre-wrap
                    ${msg.role === 'user' 
                        ? 'bg-[#2A2A2E] text-white rounded-tr-[4px] border border-[#3A3A3E]' 
                        : (msg as unknown as { isError?: boolean }).isError 
                          ? 'bg-red-500/10 text-red-400 rounded-tl-[4px] border border-red-500/20'
                          : 'bg-[rgba(var(--primary-color-rgb),0.1)] text-[#D4D4D6] rounded-tl-[4px] border border-[rgba(var(--primary-color-rgb),0.2)]'
                      }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-[12px] animate-fade-in">
              <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary border border-[rgba(var(--primary-color-rgb),0.2)]">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
              </div>
              <div className="px-[16px] py-[12px] rounded-[16px] bg-card-bg border border-card-border rounded-tl-[4px] flex items-center">
                <div className="flex gap-[6px]">
                  <div className="w-[8px] h-[8px] rounded-full bg-app-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-[8px] h-[8px] rounded-full bg-app-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-[8px] h-[8px] rounded-full bg-app-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-[16px] border-t border-card-border bg-card-bg shrink-0">
          <div className="flex items-center gap-[12px]">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ai.inputPlaceholder')}
              className="flex-1 bg-app-bg border-2 border-card-border text-app-text px-[16px] py-[12px] rounded-[12px] focus:border-app-primary outline-none transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-[48px] h-[48px] flex items-center justify-center bg-app-primary text-white rounded-[12px] hover:brightness-110 transition-all shadow-btn hover:shadow-btn-hover hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={input.trim() && !isLoading ? 'ml-[2px]' : ''}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
