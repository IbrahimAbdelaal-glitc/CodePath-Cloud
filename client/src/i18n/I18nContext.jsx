import { createContext, useCallback, useContext, useMemo } from 'react';
import en from './en.js';

// All interface text lives in en.js and is looked up with t('section.key', params).

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] == null ? `{${k}}` : String(params[k])));
}

const numberFmt = new Intl.NumberFormat('en');
const dateFmt = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' });
const relFmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const plural = new Intl.PluralRules('en');

const count = (key, n) => {
  const forms = en.plurals[key];
  return interpolate(forms[plural.select(n)] ?? forms.other, { n: numberFmt.format(n) });
};

const fmt = {
  number: (n) => numberFmt.format(n ?? 0),
  date: (d) => (d ? dateFmt.format(new Date(d)) : ''),
  timeAgo(d) {
    if (!d) return '';
    const diff = (new Date(d).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return en.common.justNow;
    if (abs < 3600) return relFmt.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return relFmt.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return relFmt.format(Math.round(diff / 86400), 'day');
    return dateFmt.format(new Date(d));
  },
  duration(minutes) {
    if (!minutes) return en.common.notSpecified;
    if (minutes < 60) return count('minutes', minutes);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? interpolate(en.common.hoursAndMinutes, { h: count('hours', h), m: count('minutes', m) }) : count('hours', h);
  },
  count,
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const t = useCallback((key, params) => {
    const value = key.split('.').reduce((o, k) => o?.[k], en);
    if (typeof value !== 'string') {
      if (import.meta.env.DEV) console.warn(`[i18n] missing key "${key}"`);
      return key;
    }
    return interpolate(value, params);
  }, []);

  const value = useMemo(() => ({ lang: 'en', dir: 'ltr', t, fmt }), [t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
