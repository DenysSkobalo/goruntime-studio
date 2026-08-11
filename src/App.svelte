<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from './lib/shared/Navigation.svelte';
  import SettingsModal from './lib/shared/SettingsModal.svelte';
  import InspectorView from './lib/inspector/InspectorView.svelte';
  import CanvasView from './lib/canvas/CanvasView.svelte';
  import { i18n } from './lib/i18n/i18n.svelte';
  import { themeStore } from './lib/theme/theme.svelte';

  type Mode = 'inspector' | 'canvas';
  let activeMode = $state<Mode>('inspector');

  onMount(() => {
    document.documentElement.lang = i18n.lang;
    themeStore.sync();

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themeStore.theme === 'system') {
        themeStore.sync();
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });
</script>

<main class="min-h-screen flex flex-col">
  <Navigation bind:activeMode />

  <SettingsModal />

  <div class="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
    {#key activeMode}
      <div class="animate-fade-in">
        {#if activeMode === 'inspector'}
          <InspectorView />
        {:else}
          <CanvasView />
        {/if}
      </div>
    {/key}
  </div>
</main>
