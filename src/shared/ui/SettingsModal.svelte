<script lang="ts">
  import { themeStore } from '$core/theme/store.svelte';
  import { settingsStore } from '$shared/stores/settings.store.svelte';  
  import { Sun, Moon, Monitor, X, Check } from 'lucide-svelte';
  import { i18n } from '$core/i18n';

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

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if settingsStore.open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    onclick={close}
  >
    <div
      class="glow-card relative w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-slide-in border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h2 class="text-base font-bold text-zinc-900 dark:text-white font-mono">Settings</h2>
        <button
          onclick={close}
          class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">{i18n.t('nav.theme')}</h3>
        <div class="grid grid-cols-3 gap-3 font-mono">
          {#each themes as t}
            <button
              onclick={() => themeStore.setTheme(t.key)}
              class="flex flex-col items-center gap-2 rounded-xl border p-3 relative transition {themeStore.theme === t.key ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}"
            >
              <t.icon class="h-5 w-5" />
              <span class="text-xs">{t.label}</span>
              {#if themeStore.theme === t.key}<Check class="h-3 w-3 text-emerald-500 absolute top-2 right-2" />{/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">{i18n.t('nav.language')}</h3>
        <div class="flex flex-col gap-2 font-mono">
          {#each langs as lang}
            <button
              onclick={() => i18n.setLang(lang.code)}
              class="flex items-center justify-between rounded-xl border px-4 py-3 transition {i18n.lang === lang.code ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}"
            >
              <span class="text-xs">{lang.label}</span>
              {#if i18n.lang === lang.code}<Check class="h-4 w-4 text-emerald-500" />{/if}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
