<script lang="ts">
  import { Network, Play, Square, Trash2 } from 'lucide-svelte';
  import { canvasStore } from './state/canvas.svelte';
  import CanvasViewport from './CanvasViewport.svelte';

  function handleSimulate() {
    canvasStore.isSimulating = !canvasStore.isSimulating;
  }

  function handleClear() {
    canvasStore.clear();
  }
</script>

<div class="h-full w-full flex flex-col">
  <!-- Toolbar -->
  <div class="shrink-0 flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 font-mono text-xs m-4 mb-0">
    <div class="flex items-center gap-2 text-zinc-300">
      <Network class="h-4 w-4 text-purple-400" />
      <span class="font-bold text-white">GoRuntime Studio Canvas</span>
      <span class="text-zinc-500 hidden sm:inline">({canvasStore.nodes.length} nodes, {canvasStore.edges.length} edges)</span>
    </div>
    <div class="flex items-center gap-2">
      {#if canvasStore.activeTool === 'connect'}
        <span class="px-2 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold animate-pulse">
          Connect Mode
        </span>
      {/if}
      {#if canvasStore.nodes.length > 0}
        <button
          onclick={handleClear}
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-[11px]"
        >
          <Trash2 class="h-3 w-3" /> Clear
        </button>
      {/if}
      <button
        onclick={handleSimulate}
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg {canvasStore.isSimulating ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-semibold transition"
      >
        {#if canvasStore.isSimulating}
          <Square class="h-3 w-3" /> Stop
        {:else}
          <Play class="h-3.5 w-3.5" /> Simulate
        {/if}
      </button>
    </div>
  </div>

  <!-- Viewport -->
  <div class="flex-1 m-4 mt-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 overflow-hidden relative">
    <CanvasViewport />
  </div>
</div>