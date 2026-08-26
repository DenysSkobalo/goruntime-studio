<script lang="ts">
  import Modal from '$shared/ui/Modal.svelte';
  import { settingsStore } from '$shared/stores/settings.store.svelte';
  import { i18n } from '$core/i18n';
  import type { Lang } from '$core/i18n/types';
  import { Settings, Sun, Moon, Monitor, Check } from '@lucide/svelte';

  const themes = [
    { id: 'light', labelKey: 'settingsModal.themeLight', icon: Sun },
    { id: 'dark', labelKey: 'settingsModal.themeDark', icon: Moon },
    { id: 'system', labelKey: 'settingsModal.themeSystem', icon: Monitor },
  ] as const;

  const languages: { id: Lang; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'uk', label: 'Українська' },
  ];
</script>

<Modal
  isOpen={settingsStore.isOpen}
  title={i18n.t('settingsModal.title')}
  subtitle={i18n.t('settingsModal.subtitle')}
  icon={Settings}
  maxWidth="md"
  onClose={() => settingsStore.setOpen(false)}
>
  <div class="space-y-6 font-mono text-xs">
    <!-- Theme Selection -->
    <div class="space-y-2.5">
      <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
        {i18n.t('settingsModal.themeSection')}
      </label>
      <div class="grid grid-cols-3 gap-2.5">
        {#each themes as t}
          {@const Icon = t.icon}
          {@const isActive = settingsStore.theme === t.id}
          <button
            onclick={() => settingsStore.setTheme(t.id)}
            class="relative flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer {isActive
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'}"
          >
            {#if isActive}
              <div class="absolute top-2 right-2 text-emerald-400">
                <Check class="w-3.5 h-3.5" />
              </div>
            {/if}
            <Icon class="w-5 h-5 mb-2" />
            <span class="font-semibold text-[11px]">{i18n.t(t.labelKey)}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Language Selection -->
    <div class="space-y-2.5">
      <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
        {i18n.t('settingsModal.languageSection')}
      </label>
      <div class="grid grid-cols-2 gap-2.5">
        {#each languages as lang}
          {@const isActive = i18n.lang === lang.id}
          <button
            onclick={() => i18n.setLang(lang.id)}
            class="relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer {isActive
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'}"
          >
            <span class="text-xs">{lang.label}</span>
            {#if isActive}
              <Check class="w-4 h-4 text-emerald-400" />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
</Modal>
