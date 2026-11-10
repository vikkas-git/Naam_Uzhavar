// What this file does: Custom React hook providing translation helper 't' and language switching based on LanguageContext.

import { useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';

const translations = { en, ta };

/**
 * Custom hook to access translation dictionary with interpolation support.
 * @param {string} [namespace] - Optional namespace prefix (e.g. 'home', 'roleSelect')
 * @returns {{ t: Function, lang: string, setLang: Function, toggleLang: Function }}
 *
 * Example usage:
 *   const { t } = useT();
 *   t('buyerDashboard.orders.tabActive', { n: 3 })
 *
 *   const { t } = useT('home');
 *   t('tagline')
 */
export function useT(namespace = '') {
  const { lang, setLang, toggleLang } = useLanguage();

  const resolvePath = useCallback((dict, path) => {
    if (!dict || !path) return undefined;
    const keys = path.split('.');
    let current = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  }, []);

  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath) return '';

      const currentDict = translations[lang] || translations.en;
      const fallbackDict = translations.en;

      // Try resolving directly first
      let resolved = resolvePath(currentDict, keyPath);

      // If namespace is provided, try with namespace prefix
      if (resolved === undefined && namespace) {
        resolved = resolvePath(currentDict, `${namespace}.${keyPath}`);
      }

      // If still not found, check fallback English dictionary
      if (resolved === undefined) {
        resolved = resolvePath(fallbackDict, keyPath);
        if (resolved === undefined && namespace) {
          resolved = resolvePath(fallbackDict, `${namespace}.${keyPath}`);
        }
      }

      // If still not found, return keyPath as safe fallback
      if (resolved === undefined) {
        return keyPath;
      }

      if (typeof resolved !== 'string') {
        return resolved;
      }

      // Interpolation: replace {var} or {n} with params[var]
      if (params && typeof params === 'object') {
        return Object.keys(params).reduce((str, pKey) => {
          const regex = new RegExp(`\\{${pKey}\\}`, 'g');
          return str.replace(regex, String(params[pKey]));
        }, resolved);
      }

      return resolved;
    },
    [lang, namespace, resolvePath]
  );

  return { t, lang, setLang, toggleLang };
}

export default useT;
