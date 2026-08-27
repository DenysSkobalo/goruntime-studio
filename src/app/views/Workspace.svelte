<script lang="ts">
  /**
   * @file src/app/views/Workspace.svelte
   * @module app/views/Workspace
   *
   * @architecture Interactive Workspace View Component
   * @description Primary workspace layout combining navigation header, deadlock/concurrency analyzer banner,
   * tool palette sidebar, 2D canvas viewport, inspector drawer, and reactive snapshot sync bridge.
   *
   * @remarks
   * **Reactive State Synchronization Bridge:**
   * Uses `$effect` to watch `timeline.currentSnapshot` and trigger `syncCanvasWithSnapshot`, dynamically updating
   * 2D spatial canvas nodes and edges whenever execution timeline step shifts.
   *
   * @see {@link timeline} Reactive timeline snapshot store.
   * @see {@link syncCanvasWithSnapshot} Canvas state synchronization engine.
   * @see {@link canvasStore} Interactive 2D canvas store.
   */
  import { onMount } from 'svelte';
  import Header from '$features/header/ui/Header.svelte';
  import Toolbar from '$features/toolbar/ui/Toolbar.svelte';
  import CanvasView from '$features/canvas/ui/CanvasView.svelte';
  import InspectorPanel from '$features/inspector/ui/InspectorPanel.svelte';
  import AnalyzerBanner from '$features/analyzer/ui/AnalyzerBanner.svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';
  import { syncCanvasWithSnapshot } from '$features/canvas/model/sync.bridge';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';

  /**
   * Initializes timeline store with 2 logical processors ($P$) and main canvas workspace layout.
   * ANCHOR: WORKSPACE_INITIALIZATION
   */
  onMount(() => {
    timeline.init(2);
    canvasStore.initMainWorkspace();
  });

  /**
   * Reactive effect syncing 2D canvas layout nodes and edges with timeline execution snapshots.
   * ANCHOR: SNAPSHOT_SYNC_EFFECT
   */
  $effect(() => {
    if (timeline.currentSnapshot) {
      syncCanvasWithSnapshot(timeline.currentSnapshot);
    }
  });
</script>

<!-- ANCHOR: WORKSPACE_LAYOUT_CONTAINER -->
<div class="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#09090b]">
  <Header />
  <AnalyzerBanner />

  <div class="flex flex-1 overflow-hidden relative">
    <Toolbar />
    <div class="flex-1 overflow-hidden relative">
      <CanvasView />
    </div>
    <InspectorPanel />
  </div>
</div>
