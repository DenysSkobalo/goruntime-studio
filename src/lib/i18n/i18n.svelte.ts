import type { Translation } from './types';
import { en } from './translations/en';
import { uk } from './translations/uk';

export type Lang = 'en' | 'uk';

const translations: Record<Lang, Translation> = { en, uk };

const STORAGE_KEY = 'grs:lang';

function detectBrowserLang(): Lang {
    const raw = navigator.language || navigator.languages?.[0] || 'en';
    const primary = raw.split('-')[0].toLowerCase();
    return primary === 'uk' || primary === 'ua' ? 'uk' : 'en';
}

function getInitialLang(): Lang {
    try {
        const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
        if (stored && (stored === 'en' || stored === 'uk')) return stored;
    } catch { /* noop */ }
    return detectBrowserLang();
}

function getNestedValue(obj: unknown, path: string): string | undefined {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = (current as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }
    return typeof current === 'string' ? current : undefined;
}

class I18nStore {
    lang = $state<Lang>(getInitialLang());

    private get tObj(): Translation {
        return translations[this.lang];
    }

    setLang(next: Lang) {
        this.lang = next;
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch { /* noop */ }
        document.documentElement.lang = next;
    }

    t(key: string, vars?: Record<string, string | number>): string {
        const raw = getNestedValue(this.tObj, key);
        if (raw === undefined) {
            if (import.meta.env.DEV) {
                console.warn(`[i18n] Missing key: "${key}" for lang "${this.lang}"`);
            }
            return key;
        }
        if (!vars) return raw;
        return raw.replace(/{([^}]+)}/g, (_, varKey) => {
            const replacement = vars[varKey];
            return replacement !== undefined ? String(replacement) : `{${varKey}}`;
        });
    }
}

export const i18n = new I18nStore();