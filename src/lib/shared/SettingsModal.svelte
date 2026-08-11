<script lang="ts">
  import { Sun, Moon, Monitor, X, Check } from 'lucide-svelte';
  import { i18n } from '../i18n/i18n.svelte';
  import { themeStore } from '../theme/theme.svelte';
  import { settingsStore } from './settingsStore.svelte';

  const themes = [
    { key: 'light' as const, icon: Sun, label: 'Light' },
    { key: 'dark' as const, icon: Moon, label: 'Dark' },
    { key: 'system' as const, icon: Monitor, label: 'System' },
  ];

  const langs = [
    { code: 'en' as const, label: 'English' },
    { code: 'uk' as const, label: 'Українська' },
  ];

  function close() {
    settingsStore.setOpen(false);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if settingsStore.open}
  <!-- Backdrop — scrollable, centered -->
  <div
    class="fixed inset-0 z-50 overflow-y-auto animate-fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    role="dialog"
    aria-modal="true"
  >
    <div class="flex min-h-full items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <!-- Modal -->
      <div class="glow-card relative w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-slide-in">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Settings</h2>
          <button
            onclick={close}
            class="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Theme Section -->
        <div class="space-y-3">
          <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {i18n.t('nav.theme')}
          </h3>
          <div class="grid grid-cols-3 gap-3">
            {#each themes as t}
              <button
                onclick={() => themeStore.setTheme(t.key)}
                class="flex flex-col items-center gap-2 rounded-xl border p-3 transition-all relative
                  {themeStore.theme === t.key
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}"
              >
                <t.icon class="h-5 w-5" />
                <span class="text-xs font-semibold">{t.label}</span>
                {#if themeStore.theme === t.key}
                  <Check class="h-3 w-3 text-emerald-500 absolute top-2 right-2" />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Language Section -->
        <div class="space-y-3">
          <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {i18n.t('nav.language')}
          </h3>
          <div class="flex flex-col gap-2">
            {#each langs as lang}
              <button
                onclick={() => i18n.setLang(lang.code)}
                class="flex items-center justify-between rounded-xl border px-4 py-3 transition-all
                  {i18n.lang === lang.code
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}"
              >
                <span class="text-sm font-semibold">{lang.label}</span>
                {#if i18n.lang === lang.code}
                  <Check class="h-4 w-4 text-emerald-500" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
