import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import { Info, Cpu, X, Settings2, MessageSquare } from 'lucide-react';
import { ToggleSwitch } from '../ToggleSwitch';
import { GAME_CONSTANTS } from '../../../../utils/constants';

export const ApiPanel: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useUIStore();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.API_KEY) || '');
  const [useProxy, setUseProxy] = useState(() => localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.USE_PROXY) !== 'false');
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT) || t('ai.genPromptDefault'));
  const [chatPrompt, setChatPrompt] = useState(() => localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.CHAT_PROMPT) || t('ai.chatPromptDefault'));
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const handleLanguageChanged = () => {
      if (!localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT)) {
        setSystemPrompt(t('ai.genPromptDefault'));
      }
      if (!localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.CHAT_PROMPT)) {
        setChatPrompt(t('ai.chatPromptDefault'));
      }
    };

    window.addEventListener('languageChanged', handleLanguageChanged);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [t]);

  const handleSaveApi = () => {
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.API_KEY, apiKey);
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.USE_PROXY, useProxy.toString());
    addToast(t('settings.api.saveSuccess'), 'success');
  };

  const handleSavePrompt = () => {
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT, systemPrompt);
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.CHAT_PROMPT, chatPrompt);
    // 提示词改变后，清除欢迎语缓存，以便下次打开重新生成
    localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.AI_WELCOME);
    addToast(t('settings.api.promptSaveSuccess'), 'success');
  };

  const handleResetPrompt = () => {
    setSystemPrompt(t('ai.genPromptDefault'));
    setChatPrompt(t('ai.chatPromptDefault'));
    localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT);
    localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.CHAT_PROMPT);
    // {t('settings.api.resetPromptBtn')}时也清除欢迎语缓存
    localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.AI_WELCOME);
    addToast(t('settings.api.promptResetSuccess'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[rgba(var(--primary-color-rgb),0.1)] p-[16px] rounded-[12px] flex items-start gap-[12px] border-l-[4px] border-primary shadow-[0_2px_8px_rgba(var(--primary-color-rgb),0.1)]">
        <Info size={24} className="text-primary shrink-0 mt-0.5" />
        <p className="m-0 text-[0.95rem] text-foreground leading-relaxed">
          {t('settings.api.keyDesc')}<a href="https://vg.v1api.cc/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">vg.v1api.cc</a>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 font-semibold text-foreground">
            <Cpu size={18} /> {t('settings.api.keyLabel')}
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
              className="w-full bg-transparent border-2 border-border text-foreground px-4 py-3 rounded-xl pr-12 focus:border-primary outline-none transition-colors"
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground opacity-50 hover:opacity-100 transition-opacity"
            >
              {showKey ? <X size={18} /> : <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-foreground">{t('settings.api.useProxy')} <span className="text-sm opacity-60">{t('settings.api.useProxySub')}</span></span>
          <ToggleSwitch checked={useProxy} onChange={setUseProxy} />
        </div>

        <button 
          onClick={handleSaveApi}
          className="w-full bg-[#2A2A2E] border border-[#3A3A3E] text-white font-medium py-[10px] rounded-lg hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Settings2 size={16} /> {t('settings.api.saveBtn')}
        </button>
      </div>

      <div className="h-px bg-card-border w-full" />

      <div className="space-y-4">
        <h3 className="m-0 font-bold text-lg text-foreground flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" /> {t('settings.api.promptSettings')}
        </h3>
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-foreground text-sm">{t('settings.api.genPrompt')}</label>
          <textarea 
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={t('settings.api.genPromptPlaceholder')}
            rows={6}
            className="w-full bg-card border-2 border-border text-foreground px-4 py-3 rounded-xl focus:border-primary outline-none transition-colors resize-y min-h-[120px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-foreground text-sm">{t('settings.api.propPrompt')}</label>
          <textarea 
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder={t('settings.api.propPromptPlaceholder')}
            rows={5}
            className="w-full bg-card border-2 border-border text-foreground px-4 py-3 rounded-xl focus:border-primary outline-none transition-colors resize-y min-h-[100px]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={handleSavePrompt}
            className="flex-1 bg-primary text-white font-semibold py-[12px] rounded-lg hover:brightness-110 transition-all shadow-btn hover:shadow-btn-hover hover:-translate-y-[2px]"
          >
            {t('settings.api.savePromptBtn')}
          </button>
          <button 
            onClick={handleResetPrompt}
            className="flex-1 bg-transparent border-2 border-border text-foreground font-semibold py-[12px] rounded-lg hover:border-primary hover:text-primary hover:bg-primary/5 transition-all hover:-translate-y-[2px]"
          >
            {t('settings.api.resetPromptBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};