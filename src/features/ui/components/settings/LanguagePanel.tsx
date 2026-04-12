import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { GAME_CONSTANTS } from '../../../../utils/constants';

export const LanguagePanel: React.FC = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'zh', name: t('settings.language.zh') },
    { code: 'en', name: t('settings.language.en') }
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    
    // 如果用户没有自定义过AI提示词，且切换了语言，强制触发一下本地状态的清空，让 AIManager 重新获取新的默认提示词
    // 因为翻译已经在 i18n 实例里了，切换语言后 getSystemPrompt() 会直接返回新语言的文本
    // 这里只需清除可能存在的一些特定语言下的临时缓存
    localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.AI_WELCOME);

    // 触发全局事件，让 ApiPanel 重新加载默认提示词
    window.dispatchEvent(new Event('languageChanged'));
  };

  return (
    <div className="p-[24px] flex flex-col gap-[20px] animate-fade-in">
      <div className="flex flex-col gap-[12px]">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "relative flex items-center justify-between p-[16px] rounded-[12px] border transition-all duration-200",
              i18n.language === lang.code
                ? "bg-primary/10 border-primary"
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            <span className={cn(
              "text-[1.05rem] font-medium",
              i18n.language === lang.code ? "text-primary" : "text-foreground"
            )}>
              {lang.name}
            </span>
            {i18n.language === lang.code && (
              <Check className="text-primary" size={20} strokeWidth={2.5} />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-[0.9rem] text-foreground opacity-80 leading-relaxed m-0">
          {t('settings.language.tip')}
        </p>
      </div>
    </div>
  );
};
