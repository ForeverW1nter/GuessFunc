import { useTranslation } from 'react-i18next';
import { useSystemUIStore } from '../useSystemUIStore';
import { RadioCard } from '../components/RadioCard';

export const GeneralTab = () => {
  const { language, setLanguage } = useSystemUIStore();
  const { t } = useTranslation();

  const locales = [
    { id: 'zh', title: t('settings.general.chinese', '中文 (简体)'), sub: t('settings.general.chineseSub', 'Translation Support'), titleClass: 'font-sans font-medium tracking-widest text-sm' },
    { id: 'en', title: t('settings.general.english', 'English'), sub: t('settings.general.englishSub', 'System Default'), titleClass: 'font-mono tracking-widest text-sm uppercase' }
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
          <RadioCard
            key={lang.id}
            title={lang.title}
            subtitle={lang.sub}
            selected={language === lang.id}
            onSelect={() => setLanguage(lang.id)}
            layout="vertical"
            titleClass={lang.titleClass}
            className="p-5"
          />
        ))}
      </div>
    </div>
  );
};
