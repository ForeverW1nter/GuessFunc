import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationZH from './locales/zh/translation.json';
import { useSystemUIStore } from '../ui/useSystemUIStore';

const resources = {
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationZH,
  },
};

// Initialize i18n synchronously with the persisted language
const initialLang = useSystemUIStore.getState().language || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Listen to Zustand store changes to update i18n instance automatically
useSystemUIStore.subscribe((state, prevState) => {
  if (state.language !== prevState.language) {
    i18n.changeLanguage(state.language);
  }
});

export default i18n;
