<script lang="ts">
  /**
   * @file src/routes/+pages.svelte
   * @module routes/pages
   *
   * @architecture Root Application Layout & Routing Dispatcher
   * @description Top-level Svelte single-page app layout component managing hash-based navigation dispatcher
   * (`#docs` fragment matching) between interactive simulation canvas workspace and Go runtime documentation view.
   *
   * @remarks
   * **Hash Routing Strategy:**
   * Uses native `window.location.hash` and `hashchange` window event listeners to allow deep linking into runtime documentation
   * (`#docs#goroutine`, `#docs#channel`, `#docs#sudog`) without full page reloads.
   *
   * @see {@link CanvasViewport} Interactive 2D simulation canvas.
   * @see {@link RuntimeDocsView} Go concurrency specifications view.
   */
  import Header from '$features/header/ui/Header.svelte';
  import Toolbar from '$features/toolbar/ui/Toolbar.svelte';
  import CanvasViewport from '$features/canvas/ui/CanvasViewport.svelte';
  import InspectorPanel from '$features/inspector/ui/InspectorPanel.svelte';
  import StackModal from '$features/inspector/ui/StackModal.svelte';
  import SettingsModal from '$shared/ui/SettingsModal.svelte';
  import RuntimeDocsView from '$features/docs/ui/DocsView.svelte';
  import { onMount } from 'svelte';

  /** Active URL location hash state. ANCHOR: CURRENT_HASH_STATE */
  let currentHash = $state(typeof window !== 'undefined' ? window.location.hash : '');

  /**
   * Attaches window hash change listener on component mount.
   *
   * ANCHOR: ROUTING_LIFECYCLE
   *
   * @remarks
   * **Why cleanup function is returned:**
   * Prevents memory leaks by removing the global `hashchange` listener when the root layout unmounts.
   */
  onMount(() => {
    const handleHashChange = () => {
      currentHash = window.location.hash;
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  });

  /** Derived boolean identifying documentation view routing (`#docs`). ANCHOR: IS_DOCS_VIEW_DERIVED */
  let isDocsView = $derived(currentHash.startsWith('#docs'));
</script>

<!-- ANCHOR: APP_LAYOUT_CONTAINER -->
<div class="flex flex-col h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 select-none">
  <Header />

  <!-- ANCHOR: MAIN_VIEWPORT_DISPATCHER -->
  <main class="relative flex-1 w-full h-full overflow-hidden">
    {#if isDocsView}
      <RuntimeDocsView />
    {:else}
      <Toolbar />
      <CanvasViewport />
      <InspectorPanel />
    {/if}
  </main>

  <!-- ANCHOR: MODALS_CONTAINER -->
  <StackModal />
  <SettingsModal />
</div>
