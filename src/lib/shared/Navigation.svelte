<script lang="ts">
  import { Activity, Network, Menu, X, Settings } from 'lucide-svelte';
  import { i18n } from '../i18n/i18n.svelte';
  import { settingsStore } from './settingsStore.svelte';

  let { activeMode = $bindable() }: { activeMode: 'inspector' | 'canvas' } = $props();
  let mobileOpen = $state(false);
</script>

<header class="sticky top-0 z-40 w-full h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
    <!-- Logo -->
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Activity class="h-4 w-4" />
      </div>
      <h1 class="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
        {i18n.t('app.title')}
      </h1>
    </div>

    <!-- Desktop nav -->
    <div class="hidden items-center gap-3 md:flex">
      <nav class="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1">
        <button
          onclick={() => activeMode = 'inspector'}
          class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-mono font-semibold transition-all
            {activeMode === 'inspector'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}"
        >
          <Activity class="h-3.5 w-3.5" />
          {i18n.t('nav.inspector')}
        </button>

        <button
          onclick={() => activeMode = 'canvas'}
          class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-mono font-semibold transition-all
            {activeMode === 'canvas'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}"
        >
          <Network class="h-3.5 w-3.5" />
          {i18n.t('nav.canvas')}
        </button>
      </nav>

      <!-- Settings trigger -->
      <button
        onclick={() => settingsStore.setOpen(true)}
        class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        aria-label="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>

    <!-- Mobile hamburger -->
    <div class="flex items-center gap-2 md:hidden">
      <!-- Settings trigger -->
      <button
        onclick={() => settingsStore.setOpen(true)}
        class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
        aria-label="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>

      <button
        onclick={() => mobileOpen = !mobileOpen}
        class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
      >
        {#if mobileOpen}
          <X class="h-4 w-4" />
        {:else}
          <Menu class="h-4 w-4" />
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileOpen}
    <div class="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 md:hidden animate-fade-in">
      <nav class="flex flex-col gap-2">
        <button
          onclick={() => { activeMode = 'inspector'; mobileOpen = false; }}
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono transition-all
            {activeMode === 'inspector' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}"
        >
          <Activity class="h-4 w-4" />
          {i18n.t('nav.inspector')}
        </button>
        <button
          onclick={() => { activeMode = 'canvas'; mobileOpen = false; }}
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono transition-all
            {activeMode === 'canvas' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}"
        >
          <Network class="h-4 w-4" />
          {i18n.t('nav.canvas')}
        </button>
      </nav>
    </div>
  {/if}
</header>
