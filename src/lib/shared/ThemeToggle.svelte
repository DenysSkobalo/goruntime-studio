<script lang="ts">
  import { Sun, Moon, Monitor } from 'lucide-svelte';
  import { themeStore } from '../theme/theme.svelte';
  import { i18n } from '../i18n/i18n.svelte';

  const modes = [
    { key: 'light' as const, icon: Sun, label: 'Light' },
    { key: 'dark' as const, icon: Moon, label: 'Dark' },
    { key: 'system' as const, icon: Monitor, label: 'System' },
  ];
</script>

<div class="flex items-center gap-1 rounded-lg border border-default bg-elevated p-1">
  <span class="sr-only">{i18n.t('nav.theme')}</span>
  {#each modes as mode}
    <button
      onclick={() => themeStore.setTheme(mode.key)}
      class="relative flex items-center justify-center rounded-md p-1.5 transition-all
        {themeStore.theme === mode.key
          ? 'bg-surface text-accent-primary shadow-sm'
          : 'text-muted hover:text-default'}"
      title={mode.label}
    >
      <mode.icon class="h-3.5 w-3.5" />
    </button>
  {/each}
</div>
