<script lang="ts">
  import { canvasStore } from '../canvas/state/canvas.svelte';
  import NodeInternals from './components/NodeInternals.svelte';
  import ConnectorInternals from './components/ConnectorInternals.svelte';
  import SchedulerTopology from './components/SchedulerTopology.svelte';
  import { X, Code2, Layers, Link2 } from 'lucide-svelte';

  let activeTab = $state<'internals' | 'gmp'>('internals');

  let selectedNode = $derived(
    canvasStore.selectedNodeId ? canvasStore.getNode(canvasStore.selectedNodeId) : null
  );

  let selectedEdge = $derived(
    canvasStore.selectedEdgeId ? canvasStore.getEdge(canvasStore.selectedEdgeId) : null
  );

  let isOpen = $derived(selectedNode !== null || selectedEdge !== null);

  function closeInspector() {
    canvasStore.selectNode(null);
    canvasStore.selectEdge(null);
  }
</script>

<aside
  class="fixed right-0 top-14 bottom-0 w-96 max-w-[calc(100vw-3.5rem)] z-40 border-l border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex flex-col shadow-2xl transition-all duration-300 ease-in-out transform overflow-hidden {isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}"
  aria-label="Compiler Inspector Panel"
>
  {#if isOpen}
    <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 space-y-3 max-w-full overflow-hidden">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            {#if selectedEdge}
              <Link2 class="h-4 w-4 text-rose-400" />
            {:else}
              <Code2 class="h-4 w-4 text-emerald-400" />
            {/if}
          </div>
          <div class="min-w-0">
            <h2 class="font-mono text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider truncate">
              Compiler Inspector
            </h2>
            <p class="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
              {#if selectedEdge}
                Target: <span class="text-rose-400 font-bold">Connector ({selectedEdge.id})</span>
              {:else if selectedNode}
                Target: <span class="text-emerald-400 font-bold">{selectedNode.label}</span>
              {/if}
            </p>
          </div>
        </div>

        <button
          onclick={closeInspector}
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 shrink-0"
          title="Close Inspector"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-[11px]">
        <button
          onclick={() => activeTab = 'internals'}
          class="flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-all duration-200 truncate
            {activeTab === 'internals'
              ? 'bg-zinc-900 dark:bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'}"
        >
          <Code2 class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{selectedEdge ? 'Connector (sudog)' : 'Нода (Internals)'}</span>
        </button>

        <button
          onclick={() => activeTab = 'gmp'}
          class="flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-all duration-200 truncate
            {activeTab === 'gmp'
              ? 'bg-zinc-900 dark:bg-zinc-800 text-indigo-400 shadow-sm border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'}"
        >
          <Layers class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">GMP Scheduler</span>
        </button>
      </div>
    </div>

    <!-- Main Content Container with Explicit Props -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 relative max-w-full">
      {#if activeTab === 'internals'}
        <div class="w-full transition-opacity duration-200 ease-in-out opacity-100">
          {#if selectedEdge}
            <ConnectorInternals edge={selectedEdge} />
          {:else if selectedNode}
            <NodeInternals node={selectedNode} />
          {/if}
        </div>
      {:else}
        <div class="w-full transition-opacity duration-200 ease-in-out opacity-100">
          <SchedulerTopology />
        </div>
      {/if}
    </div>
  {/if}
</aside>