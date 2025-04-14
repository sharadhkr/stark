import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: {
        translation: {
          welcome: 'Hello! How can I assist you today?',
          listening: 'I am listening...',
          speak: 'Speak now',
          stop: 'Stop listening',
          typeHere: 'Type your message here...',
          send: 'Send',
          close: 'Close',
          selectLanguage: 'Select Language',
        },
      },
      hi: {
        translation: {
          welcome: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?',
          listening: 'मैं सुन रहा हूँ...',
          speak: 'अब बोलें',
          stop: 'सुनना बंद करें',
          typeHere: 'यहाँ अपना संदेश टाइप करें...',
          send: 'भेजें',
          close: 'बंद करें',
          selectLanguage: 'भाषा चुनें',
        },
      },
    },
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
    },
  });

export default i18next;