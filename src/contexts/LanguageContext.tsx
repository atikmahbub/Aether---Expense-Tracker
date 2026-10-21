import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs, { ConfigType } from 'dayjs';
import 'dayjs/locale/bn';
import {
  Language,
  TranslationKey,
  translations,
} from '@trackingPortal/i18n/translations';

const LANGUAGE_STORAGE_KEY = 'app_language';

type TranslateParams = Record<string, string | number>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslateParams) => string;
  /**
   * Formats a date for display in the active language. The locale is applied
   * per call, never globally, so keys and parsing elsewhere stay in English.
   */
  formatDate: (date: ConfigType, format: string) => string;
  /**
   * Translates text that is already English (Yup validation messages), by
   * matching it against the English dictionary. Unknown text is returned as is.
   */
  translateText: (text: string) => string;
}

const translate = (
  language: Language,
  key: TranslationKey,
  params?: TranslateParams,
) => {
  const template = translations[language][key] ?? translations.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
};

// English text -> key, for translateText.
const KEY_BY_ENGLISH = new Map<string, TranslationKey>(
  (Object.keys(translations.en) as TranslationKey[]).map(key => [
    translations.en[key] as string,
    key,
  ]),
);

const translateEnglish = (language: Language, text: string) => {
  const key = KEY_BY_ENGLISH.get(text);
  return key ? translate(language, key) : text;
};

// Bangla short months are clipped (অক্টো), so Bangla always spells them out.
const localizeFormat = (language: Language, format: string) =>
  language === 'bn' ? format.replace(/M+/g, m => (m === 'MMM' ? 'MMMM' : m)) : format;

// Mirrors the provider's language for code outside React (services).
let activeLanguage: Language = 'en';

/** Translates outside React components, e.g. in API services. */
export const translateNow = (key: TranslationKey, params?: TranslateParams) =>
  translate(activeLanguage, key, params);

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key, params) => translate('en', key, params),
  formatDate: (date, format) => dayjs(date).format(format),
  translateText: text => text,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(v => {
        if (v === 'en' || v === 'bn') setLanguageState(v);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next).catch(() => {});
  }, []);

  activeLanguage = language;

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key, params) => translate(language, key, params),
    formatDate: (date, format) =>
      dayjs(date).locale(language).format(localizeFormat(language, format)),
    translateText: text => translateEnglish(language, text),
  }), [language, setLanguage]);

  // Like ThemeProvider: hold the first frame until the saved language is
  // known, so the loader doesn't flash English for a Bangla user.
  if (!loaded) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => useContext(LanguageContext);
