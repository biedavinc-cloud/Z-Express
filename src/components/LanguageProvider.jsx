import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES, translate } from '@/lib/i18n';

// The visitor's own language is used on a first visit when we support it, and an
// explicit choice from the switcher is remembered and always wins afterwards.
function detectBrowserLang() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const tags = [...(window.navigator.languages || []), window.navigator.language].filter(Boolean);
  for (const tag of tags) {
    const code = String(tag).toLowerCase().split('-')[0];
    const match = LANGUAGES.find((language) => language.code === code);
    if (match) return match.code;
  }
  return DEFAULT_LANGUAGE;
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = window.localStorage.getItem('zx_lang');
    return LANGUAGES.some((l) => l.code === stored) ? stored : detectBrowserLang();
  });

  useEffect(() => {
    window.localStorage.setItem('zx_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}

export default LanguageProvider;