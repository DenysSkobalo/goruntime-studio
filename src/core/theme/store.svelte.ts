export type Theme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'grs:theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['dark', 'light', 'system'].includes(stored)) return stored;
  } catch { /* noop */ }
  return 'system';
}

function getEffective(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyClass(effective: 'dark' | 'light') {
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

class ThemeStore {
  theme = $state<Theme>(getInitialTheme());
  effectiveTheme = $derived<'dark' | 'light'>(getEffective(this.theme));

  sync() {
    applyClass(this.effectiveTheme);
    try {
      localStorage.setItem(STORAGE_KEY, this.theme);
    } catch { /* noop */ }
  }

  setTheme(next: Theme) {
    this.theme = next;
    this.sync();
  }

  toggle() {
    this.setTheme(this.effectiveTheme === 'dark' ? 'light' : 'dark');
  }
}

export const themeStore = new ThemeStore();
