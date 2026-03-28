import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import { Info, Cpu, X, Settings2, MessageSquare } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_CHAT_SYSTEM_PROMPT } from '../../../../utils/aiManager';

export const ApiPanel: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useUIStore();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('guessfunc_api_key') || '');
  const [useProxy, setUseProxy] = useState(() => localStorage.getItem('guessfunc_use_proxy') !== 'false');
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem('guessfunc_system_prompt') || DEFAULT_SYSTEM_PROMPT);
  const [chatPrompt, setChatPrompt] = useState(() => localStorage.getItem('guessfunc_chat_prompt') || DEFAULT_CHAT_SYSTEM_PROMPT);
  const [showKey, setShowKey] = useState(false);

  const handleSaveApi = () => {
    localStorage.setItem('guessfunc_api_key', apiKey);
    localStorage.setItem('guessfunc_use_proxy', useProxy.toString());
    addToast(t('settings.api.saveSuccess'), 'success');
  };

  const handleSavePrompt = () => {
    localStorage.setItem('guessfunc_system_prompt', systemPrompt);
    localStorage.setItem('guessfunc_chat_prompt', chatPrompt);
    // 提示词改变后，清除欢迎语缓存，以便下次打开重新生成
    localStorage.removeItem('guessfunc_ai_welcome');
    addToast(t('settings.api.promptSaveSuccess'), 'success');
  };

  const handleResetPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setChatPrompt(DEFAULT_CHAT_SYSTEM_PROMPT);
    localStorage.removeItem('guessfunc_system_prompt');
    localStorage.removeItem('guessfunc_chat_prompt');
    // {t('settings.api.resetPromptBtn')}时也清除欢迎语缓存
    localStorage.removeItem('guessfunc_ai_welcome');
    addToast(t('settings.api.promptResetSuccess'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[rgba(var(--primary-color-rgb),0.1)] p-[16px] rounded-[12px] flex items-start gap-[12px] border-l-[4px] border-app-primary shadow-[0_2px_8px_rgba(var(--primary-color-rgb),0.1)]">
        <Info size={24} className="text-app-primary shrink-0 mt-0.5" />
        <p className="m-0 text-[0.95rem] text-app-text leading-relaxed">
          {t('settings.api.keyDesc')}<a href="https://vg.v1api.cc/" target="_blank" rel="noreferrer" className="text-app-primary hover:underline font-medium">vg.v1api.cc</a>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 font-semibold text-app-text">
            <Cpu size={18} /> API Key
          </label>
          <div className="relative">
            <input 
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                const val = e.target.value;
                setApiKey(val);
                // 填入key后自动关闭代理接口
                if (val.trim().length > 0) {
                  setUseProxy(false);
                }
              }}
              placeholder={t('settings.api.keyPlaceholder')}
              className="w-full bg-transparent border-2 border-card-border text-app-text px-4 py-3 rounded-xl pr-12 focus:border-app-primary outline-none transition-colors"
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text opacity-50 hover:opacity-100 transition-opacity"
            >
              {showKey ? <X size={18} /> : <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-app-text">{t('settings.api.useProxy')} <span className="text-sm opacity-60">{t('settings.api.useProxySub')}</span></span>
          <div 
            onClick={() => setUseProxy(!useProxy)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${useProxy ? 'bg-app-primary' : 'bg-card-border'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${useProxy ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </div>

        <button 
          onClick={handleSaveApi}
          className="w-full bg-[#2A2A2E] border border-[#3A3A3E] text-white font-medium py-[10px] rounded-lg hover:border-app-primary hover:text-app-primary transition-all flex items-center justify-center gap-2"
        >
          <Settings2 size={16} /> {t('settings.api.saveBtn')}
        </button>
      </div>

      <div className="h-px bg-card-border w-full" />

      <div className="space-y-4">
        <h3 className="m-0 font-bold text-lg text-app-text flex items-center gap-2">
          <MessageSquare size={20} className="text-app-primary" /> {t('settings.api.promptSettings')}
        </h3>
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-app-text text-sm">{t('settings.api.genPrompt')}</label>
          <textarea 
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={t('settings.api.genPromptPlaceholder')}
            rows={6}
            className="w-full bg-card-bg border-2 border-card-border text-app-text px-4 py-3 rounded-xl focus:border-app-primary outline-none transition-colors resize-y min-h-[120px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-app-text text-sm">{t('settings.api.propPrompt')}</label>
          <textarea 
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder={t('settings.api.propPromptPlaceholder')}
            rows={5}
            className="w-full bg-card-bg border-2 border-card-border text-app-text px-4 py-3 rounded-xl focus:border-app-primary outline-none transition-colors resize-y min-h-[100px]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={handleSavePrompt}
            className="flex-1 bg-app-primary text-white font-semibold py-[12px] rounded-lg hover:brightness-110 transition-all shadow-btn hover:shadow-btn-hover hover:-translate-y-[2px]"
          >
            {t('settings.api.savePromptBtn')}
          </button>
          <button 
            onClick={handleResetPrompt}
            className="flex-1 bg-transparent border-2 border-card-border text-app-text font-semibold py-[12px] rounded-lg hover:border-app-primary hover:text-app-primary hover:bg-app-primary/5 transition-all hover:-translate-y-[2px]"
          >
            恢复默认
          </button>
        </div>
      </div>
    </div>
  );
};