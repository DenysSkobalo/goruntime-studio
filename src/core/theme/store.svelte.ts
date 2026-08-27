/**
 * @file src/core/theme/store.svelte.ts
 * @module core/theme/store
 *
 * @architecture Reactive UI Theme State Management Engine (Svelte 5 Runes)
 * @description Manages global visual theme state ('dark' | 'light' | 'system'), handles Web Storage
 * persistence, dynamically resolves OS-level media queries (`prefers-color-scheme`), and synchronizes
 * dark mode CSS classes on the root HTML element.
 *
 * @remarks
 * **Design & State Synchronization Mechanics:**
 * - **Svelte 5 Signal-Based Runes**: Uses `$state` for primitive reactivity and `$derived` for computed effective theme resolution.
 * - **FOUC Mitigation & SSR Safety**: All Web Storage calls are wrapped in defensive `try/catch` blocks to guard against
 *   SecurityError exceptions (e.g., restricted iframe policies, private browsing storage blocking) and SSR runtime reference errors.
 * - **CSS Variable & Framework Integration**: Toggles the `.dark` utility class directly on `document.documentElement`,
 *   enabling seamless integration with Tailwind CSS `darkMode: 'class'` selector strategy and root CSS custom properties.
 *
 * @see {@link https://svelte.dev/docs/svelte/$state Svelte 5 Runes Specification}
 * @see {@link https://www.w3.org/TR/mediaqueries-5/#prefers-color-scheme W3C Media Queries Level 5: prefers-color-scheme}
 */

/**
 * Valid theme selection modes.
 *
 * ANCHOR: THEME_TYPES
 */
export type Theme = 'dark' | 'light' | 'system';

/**
 * Storage key prefix for persisting selected theme preference in browser `localStorage`.
 * Uses project namespace `grs:` to prevent key collision with host environment applications.
 *
 * ANCHOR: STORAGE_CONSTANTS
 */
const STORAGE_KEY = 'grs:theme';

/**
 * Safely resolves the initial theme selection state upon module instantiation.
 *
 * ANCHOR: INITIAL_THEME_RESOLVER
 *
 * @remarks
 * **Why defensive extraction is required:**
 * Accessing `localStorage` can throw runtime `SecurityError` exceptions in sandboxed iframes or private browsing modes,
 * or `ReferenceError` during Server-Side Rendering (SSR). If access fails or stored data is corrupted,
 * execution gracefully falls back to `'system'`.
 *
 * @returns Saved valid {@link Theme} setting, or `'system'` default.
 * @internal
 */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['dark', 'light', 'system'].includes(stored)) return stored;
  } catch {
    /* noop: Fallback to system preference if storage is blocked or inaccessible */
  }
  return 'system';
}

/**
 * Evaluates the concrete active color scheme ('dark' or 'light') based on explicit theme selection or OS system preferences.
 *
 * ANCHOR: EFFECTIVE_THEME_RESOLVER
 *
 * @param theme - Configured theme preference mode.
 * @returns Evaluated target rendering theme (`'dark'` or `'light'`).
 *
 * @internal
 */
function getEffective(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Synchronizes the target effective theme state directly with the DOM document root.
 *
 * ANCHOR: DOM_CLASS_MUTATION
 *
 * @remarks
 * **Why target document.documentElement:**
 * Mutating class list on `<html>` (`document.documentElement`) allows top-level CSS variable overrides
 * and Tailwind CSS `.dark` variant cascade down the entire DOM tree efficiently without requiring re-renders.
 *
 * @param effective - Evaluated binary theme state ('dark' | 'light').
 * @internal
 */
function applyClass(effective: 'dark' | 'light') {
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Reactive state store managing application color scheme lifecycle and persistence.
 *
 * ANCHOR: THEME_STORE_CLASS
 */
class ThemeStore {
  /** Active user theme preference setting ('dark' | 'light' | 'system'). */
  theme = $state<Theme>(getInitialTheme());

  /** Derived concrete visual state ('dark' | 'light') automatically recalculated on state mutations. */
  effectiveTheme = $derived<'dark' | 'light'>(getEffective(this.theme));

  /**
   * Persists current theme setting to `localStorage` and updates DOM root element CSS classes.
   *
   * ANCHOR: STORE_SYNC
   *
   * @remarks
   * Evaluates DOM mutations first before attempting Web Storage persistence to guarantee visual feedback
   * even if storage access throws an error.
   */
  sync() {
    applyClass(this.effectiveTheme);
    try {
      localStorage.setItem(STORAGE_KEY, this.theme);
    } catch {
      /* noop: Gracefully ignore storage write failures in restricted environments */
    }
  }

  /**
   * Updates user theme selection preference and triggers reactivity & DOM synchronization.
   *
   * @param next - New target theme mode.
   */
  setTheme(next: Theme) {
    this.theme = next;
    this.sync();
  }

  /**
   * Toggles between explicit 'dark' and 'light' modes based on the current effective visual state.
   */
  toggle() {
    this.setTheme(this.effectiveTheme === 'dark' ? 'light' : 'dark');
  }
}

/**
 * Singleton instance of the reactive theme store.
 *
 * ANCHOR: THEME_SINGLETON
 */
export const themeStore = new ThemeStore();
