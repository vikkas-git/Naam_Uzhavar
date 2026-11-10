// What this file does: Global React context providing bilingual language state ('en' | 'ta') with localStorage persistence.

/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * LanguageContext
 * Manages global bilingual state ('en' | 'ta') across the entire application.
 * Persists selected language to localStorage and synchronizes with document.documentElement.lang.
 */
export const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
});

const STORAGE_KEY = 'naam_uzhavar_lang';

function getStoredLanguage(defaultLang = 'en') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('language') ||
        localStorage.getItem('lang');
      if (saved === 'ta' || saved === 'en') {
        return saved;
      }
    }
  } catch {
    // Ignore localStorage access issues
  }
  return defaultLang;
}

function persistLanguage(newLang) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, newLang);
      localStorage.setItem('language', newLang);
      localStorage.setItem('lang', newLang);
    }
  } catch {
    // Ignore localStorage write issues
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = newLang;
  }
}

export function LanguageProvider({ children, initialLang = 'en' }) {
  const [lang, setLangState] = useState(() => getStoredLanguage(initialLang));

  // Sync state to localStorage & document element
  useEffect(() => {
    persistLanguage(lang);
  }, [lang]);

  // Synchronize changes across multiple open tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        (e.key === STORAGE_KEY || e.key === 'language' || e.key === 'lang') &&
        (e.newValue === 'ta' || e.newValue === 'en')
      ) {
        setLangState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setLang = useCallback((nextLang) => {
    if (nextLang === 'ta' || nextLang === 'en') {
      persistLanguage(nextLang);
      setLangState(nextLang);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'ta' ? 'en' : 'ta';
      persistLanguage(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
    }),
    [lang, setLang, toggleLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
