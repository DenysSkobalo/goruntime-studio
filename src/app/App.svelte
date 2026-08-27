<script lang="ts">
  /**
   * @file src/app/App.svelte
   * @module app/App
   *
   * @architecture Application Root Layout & View Router Component
   * @description Root Svelte 5 component handling top-level single-page routing between workspace view
   * and Go runtime documentation, while hosting persistent modal dialog overlays (`StackModal`, `SettingsModal`).
   *
   * @remarks
   * **Hash Navigation Routing:**
   * Listens to browser `hashchange` events to toggle between interactive canvas workspace and specification views (`#docs`),
   * ensuring back/forward browser button support without full page reloads.
   *
   * @see {@link Workspace} Interactive concurrency simulation layout.
   * @see {@link DocsView} Platform documentation and specification guide.
   * @see {@link StackModal} Global Goroutine stack & heap memory inspector.
   * @see {@link SettingsModal} Global application settings & localization preferences modal.
   */
  import { onMount } from 'svelte';
  import Workspace from '$app/views/Workspace.svelte';
  import DocsView from '$features/docs/ui/DocsView.svelte';
  import StackModal from '$features/inspector/ui/StackModal.svelte';
  import SettingsModal from '$shared/ui/SettingsModal.svelte';

  /** Supported top-level view modes. ANCHOR: VIEW_MODE_TYPE */
  type ViewMode = 'workspace' | 'docs';

  /** Active view mode state rune. ANCHOR: CURRENT_VIEW_STATE */
  let currentView = $state<ViewMode>('workspace');

  /**
   * Synchronizes internal view mode state with current window URL location hash.
   * ANCHOR: SYNC_ROUTE_FROM_HASH
   */
  function syncRouteFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#docs')) {
      currentView = 'docs';
    } else {
      currentView = 'workspace';
    }
  }

  /**
   * Programmatically updates active view mode and mutates browser location hash.
   *
   * ANCHOR: NAVIGATE_TO
   *
   * @param view - Target view identifier (`'workspace'` or `'docs'`).
   */
  function navigateTo(view: ViewMode) {
    currentView = view;
    if (view === 'docs') {
      window.location.hash = '#docs';
    } else {
      window.location.hash = '';
    }
  }

  /**
   * Attaches route synchronization on component mount and cleans up event listeners on unmount.
   *
   * ANCHOR: ROUTE_LIFECYCLE
   *
   * @remarks
   * **Why explicit cleanup is returned:**
   * Detaches global `hashchange` window event listener to prevent memory leaks during component tear-down.
   */
  onMount(() => {
    syncRouteFromHash();
    window.addEventListener('hashchange', syncRouteFromHash);
    return () => window.removeEventListener('hashchange', syncRouteFromHash);
  });
</script>

<!-- ANCHOR: ROOT_APP_CONTAINER -->
<div class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
  {#if currentView === 'docs'}
    <DocsView onBack={() => navigateTo('workspace')} />
  {:else}
    <Workspace />
  {/if}
</div>

<!-- ANCHOR: GLOBAL_MODALS -->
<StackModal />
<SettingsModal />
