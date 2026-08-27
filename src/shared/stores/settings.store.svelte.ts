/**
 * @file src/shared/stores/settings.store.svelte.ts
 * @module shared/stores/settings.store
 *
 * @architecture Reactive UI Settings & Visual Theme Store (Svelte 5 Runes)
 * @description Manages application-wide settings, persistent theme selection (`light` | `dark` | `system`),
 * `localStorage` synchronization, and DOM document root element class toggles.
 *
 * @remarks
 * **System Theme Detection:**
 * Listens to `(prefers-color-scheme: dark)` media query evaluation when `theme` mode is configured to `'system'`.
 */

/** Visual theme mode union type. ANCHOR: THEME_MODE_TYPE */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Svelte 5 reactive store holding UI preference settings.
 * ANCHOR: SETTINGS_STORE_CLASS
 */
class SettingsStore {
  /** Modal open state signal rune. */
  isOpen = $state(false);
  /** Active theme selection mode. */
  theme = $state<ThemeMode>('dark');

  /**
   * Initializes theme preferences from `localStorage` if available in browser context.
   */
  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme') as ThemeMode | null;
      if (savedTheme) {
        this.theme = savedTheme;
      }
      this.applyTheme(this.theme);
    }
  }

  /** Updates modal open visibility status. */
  setOpen(open: boolean) {
    this.isOpen = open;
  }

  /**
   * Sets new theme mode, updates `localStorage`, and mutates DOM root classes.
   *
   * @param theme - Selected target theme mode (`'light'`, `'dark'`, `'system'`).
   */
  setTheme(theme: ThemeMode) {
    this.theme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', theme);
    }
    this.applyTheme(theme);
  }

  /**
   * Applies CSS classes (`.dark`, `.light`) to document root element.
   *
   * ANCHOR: APPLY_THEME_INTERNAL
   *
   * @param theme - Visual theme variant to enforce on document root.
   */
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

/** Singleton settings store instance. */
export const settingsStore = new SettingsStore();
