<script lang="ts">
  import Header from '$features/header/ui/Header.svelte';
  import Toolbar from '$features/toolbar/ui/Toolbar.svelte';
  import CanvasViewport from '$features/canvas/ui/CanvasViewport.svelte';
  import InspectorPanel from '$features/inspector/ui/InspectorPanel.svelte';
  import StackModal from '$features/inspector/ui/StackModal.svelte';
  import SettingsModal from '$shared/ui/SettingsModal.svelte';
  import RuntimeDocsView from '$features/docs/ui/DocsView.svelte';
  import { onMount } from 'svelte';

  let currentHash = $state(typeof window !== 'undefined' ? window.location.hash : '');

  onMount(() => {
    const handleHashChange = () => {
      currentHash = window.location.hash;
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  });

  let isDocsView = $derived(currentHash.startsWith('#docs'));
</script>

<div class="flex flex-col h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 select-none">
  <Header />

  <main class="relative flex-1 w-full h-full overflow-hidden">
    {#if isDocsView}
      <RuntimeDocsView />
    {:else}
      <Toolbar />
      <CanvasViewport />
      <InspectorPanel />
    {/if}
  </main>

  <StackModal />
  <SettingsModal />
</div>
