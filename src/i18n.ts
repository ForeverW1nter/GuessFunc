import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { GAME_CONSTANTS } from './utils/constants';

import zhTranslation from './locales/zh/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  zh: {
    translation: zhTranslation
  },
  en: {
    translation: enTranslation
  }
};

// 尝试从 localStorage 获取语言，否则默认中文
const savedLanguage = localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.I18N_LANG) || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 默认语言
    fallbackLng: 'en', // 找不到中文时降级到英文
    interpolation: {
      escapeValue: false // react 已经安全处理了 xss
    }
  });

// 监听语言变化并保存
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.I18N_LANG, lng);
});

export default i18n;
