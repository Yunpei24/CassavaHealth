import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from '../locales/fr.json';
import en from '../locales/en.json';

const STORAGE_KEY = 'user-language';
const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Detected language:', savedLanguage);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Default to French
        console.log('No saved language, defaulting to French');
        callback('fr');
      }
    } catch (error) {
      console.log('Error reading language from storage', error);
      callback('fr');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      console.log('Saving language to storage:', lng);
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language to storage', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Add event listener for language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});
export default i18n;