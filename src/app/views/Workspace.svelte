<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$features/header/ui/Header.svelte';
  import Toolbar from '$features/toolbar/ui/Toolbar.svelte';
  import CanvasView from '$features/canvas/ui/CanvasView.svelte';
  import InspectorPanel from '$features/inspector/ui/InspectorPanel.svelte';
  import AnalyzerBanner from '$features/analyzer/ui/AnalyzerBanner.svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';
  import { syncCanvasWithSnapshot } from '$features/canvas/model/sync.bridge';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';

  onMount(() => {
    timeline.init(2);
    canvasStore.initMainWorkspace();
  });

  $effect(() => {
    if (timeline.currentSnapshot) {
      syncCanvasWithSnapshot(timeline.currentSnapshot);
    }
  });
</script>

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
