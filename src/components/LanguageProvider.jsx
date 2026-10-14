import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translate } from '@/lib/i18n';

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('zx_lang');
    return LANGUAGES.some((l) => l.code === stored) ? stored : 'en';
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