import { en } from './locales/en';
import { uk } from './locales/uk';
import type { Lang, Translations } from './types';

const STORAGE_KEY = 'grs:lang';

const translations: Record<Lang, Translations> = { en, uk };

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && (stored === 'en' || stored === 'uk')) return stored;
  } catch {
    /* noop */
  }
  return 'en';
}

class I18nStore {
  lang = $state<Lang>(getInitialLang());

  setLang(next: Lang) {
    this.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop */
    }
  }

  t(keyPath: string): string {
    const current = translations[this.lang] || translations.en;
    const keys = keyPath.split('.');
    let obj: unknown = current;
    for (const key of keys) {
      if (obj && typeof obj === 'object' && key in obj) {
        obj = (obj as Record<string, unknown>)[key];
      } else {
        return keyPath;
      }
    }
    return typeof obj === 'string' ? obj : keyPath;
  }
}

export const i18n = new I18nStore();
