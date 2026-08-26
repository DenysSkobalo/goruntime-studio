export type ThemeMode = 'light' | 'dark' | 'system';

class SettingsStore {
  isOpen = $state(false);
  theme = $state<ThemeMode>('dark');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme') as ThemeMode | null;
      if (savedTheme) {
        this.theme = savedTheme;
      }
      this.applyTheme(this.theme);
    }
  }

  setOpen(open: boolean) {
    this.isOpen = open;
  }

  setTheme(theme: ThemeMode) {
    this.theme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', theme);
    }
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
      root.classList.toggle('light', !systemDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
      root.classList.toggle('light', theme === 'light');
    }
  }
}

export const settingsStore = new SettingsStore();
