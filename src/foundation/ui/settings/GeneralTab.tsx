import { useTranslation } from 'react-i18next';
import { useSystemUIStore } from '../useSystemUIStore';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const GeneralTab = () => {
  const { language, setLanguage } = useSystemUIStore();
  const { t } = useTranslation();

  const locales = [
    { id: 'zh', title: t('settings.general.chinese', '中文 (简体)'), sub: t('settings.general.chineseSub', 'Translation Support'), titleClass: 'font-sans font-medium tracking-widest text-sm mb-1' },
    { id: 'en', title: t('settings.general.english', 'English'), sub: t('settings.general.englishSub', 'System Default'), titleClass: 'font-mono tracking-widest text-sm uppercase mb-1' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">
          {t('settings.general.localization', 'Localization')}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('settings.general.localizationDesc', 'Set your preferred interface language.')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {locales.map(lang => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={cn(
              "relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 min-w-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
              language === lang.id 
                ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
            )}
          >
            <span className={`${lang.titleClass} truncate w-full text-left`}>{lang.title}</span>
            <span className={cn("text-xs font-sans truncate w-full text-left", language === lang.id ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>
              {lang.sub}
            </span>
            {language === lang.id && <CheckCircle2 size={18} className="absolute top-5 end-5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
};
