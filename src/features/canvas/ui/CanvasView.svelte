<script lang="ts">
  /**
   * @file src/features/canvas/ui/CanvasView.svelte
   * @module features/canvas/ui/CanvasView
   *
   * @architecture Primary Viewport Container Component
   * @description Top-level full-screen layout container holding the interactive 2D runtime topology canvas viewport.
   *
   * @remarks
   * Serves as the outer visual boundary and background container (`bg-zinc-950`) for interactive node graph inspection.
   *
   * @see {@link CanvasViewport} Interactive viewport managing pointer interactions, node positioning, and edge rendering.
   */
  import CanvasViewport from './CanvasViewport.svelte';
</script>

<!-- ANCHOR: CANVAS_VIEW_CONTAINER -->
<div class="h-full w-full relative bg-zinc-950 overflow-hidden">
  <CanvasViewport />
</div>
