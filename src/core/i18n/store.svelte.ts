import type { Lang } from './types';
import { en } from './translations/en';
import { uk } from './translations/uk';

const STORAGE_KEY = 'grs:lang';

const dictionaries: Record<Lang, Record<string, string>> = {
  en,
  uk,
};

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && (stored === 'en' || stored === 'uk')) return stored;
  } catch { /* noop */ }
  return 'uk';
}

class I18nStore {
  lang = $state<Lang>(getInitialLang());

  t(key: string, params?: Record<string, unknown>): string {
    const dict = dictionaries[this.lang];
    let text = dict[key] ?? dictionaries['en'][key] ?? key;

    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, String(v));
      });
    }

    return text;
  }

  setLang(next: Lang) {
    this.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* noop */ }
    document.documentElement.lang = next;
  }
}

export const i18n = new I18nStore();
