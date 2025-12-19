import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import các file JSON vừa tạo
import translationVI from './locales/vi.json';
import translationEN from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: translationVI },
      en: { translation: translationEN }
    },
    lng: 'vi',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { 
      useSuspense: false // Giữ nguyên để tránh lỗi Hook trên React 19
    }
  });

export default i18n;