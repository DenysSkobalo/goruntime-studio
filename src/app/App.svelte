<script lang="ts">
  import { onMount } from 'svelte';
  import Workspace from '$app/views/Workspace.svelte';
  import DocsView from '$features/docs/ui/DocsView.svelte';

  type ViewMode = 'workspace' | 'docs';

  let currentView = $state<ViewMode>('workspace');

  function syncRouteFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#docs')) {
      currentView = 'docs';
    } else {
      currentView = 'workspace';
    }
  }

  function navigateTo(view: ViewMode) {
    currentView = view;
    if (view === 'docs') {
      window.location.hash = '#docs';
    } else {
      window.location.hash = '';
    }
  }

  onMount(() => {
    syncRouteFromHash();
    window.addEventListener('hashchange', syncRouteFromHash);
    return () => window.removeEventListener('hashchange', syncRouteFromHash);
  });
</script>

<div class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
  {#if currentView === 'docs'}
    <DocsView onBack={() => navigateTo('workspace')} />
  {:else}
    <Workspace />
  {/if}
</div>
