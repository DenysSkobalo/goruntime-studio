<script lang="ts">
  import { getGoroutineStack, getRawBaseAddress } from '$core/memory/layout';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
  import { X, Link2, Database, Cpu, Network } from 'lucide-svelte';
  import ConnectorInternals from './ConnectorInternals.svelte';
  import NodeInternals from './NodeInternals.svelte';
  import SchedulerTopology from './SchedulerTopology.svelte';

  let activeTab = $state<'details' | 'scheduler'>('details');
  let selectedNode = $derived(canvasStore.getNode(canvasStore.selectedNodeId));
  let selectedEdge = $derived(canvasStore.getEdge(canvasStore.selectedEdgeId));
  let isOpen = $derived(selectedNode !== null || selectedEdge !== null);

  let edgeData = $derived.by(() => {
    if (!selectedEdge) return null;
    const src = canvasStore.getNode(selectedEdge.source);
    const tgt = canvasStore.getNode(selectedEdge.target);
    if (!src || !tgt) return null;

    const gNode = src.type === 'goroutine' ? src : tgt.type === 'goroutine' ? tgt : null;
    const targetNode = src.type !== 'goroutine' ? src : tgt.type !== 'goroutine' ? tgt : null;
    if (!gNode || !targetNode) return null;

    return {
      edge: selectedEdge,
      gNode,
      targetNode,
      sudogAddress: getRawBaseAddress(selectedEdge.id),
      gAddress: getRawBaseAddress(gNode.id),
      targetAddress: getRawBaseAddress(targetNode.id),
      elemAddress: getGoroutineStack(gNode.goid).elemAddr,
    };
  });

  let nodeBaseAddress = $derived(selectedNode ? getRawBaseAddress(selectedNode.id) : 0n);

  function handleClose() {
    canvasStore.selectNode(null);
    canvasStore.selectEdge(null);
  }
</script>

<aside
  class="fixed right-0 top-14 bottom-0 w-96 bg-[#09090b] border-l border-zinc-800 text-zinc-200 z-40 transition-transform duration-300 shadow-2xl {isOpen ? 'translate-x-0' : 'translate-x-full'}"
>
  {#if isOpen}
    <div class="flex flex-col h-full p-4 overflow-y-auto space-y-4 font-mono">
      <header class="flex items-start justify-between border-b border-zinc-800 pb-3 gap-2">
        <div class="flex items-start gap-2.5 min-w-0 flex-1">
          <div class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5
            {selectedNode?.type === 'goroutine' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
             selectedNode?.type === 'channel' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
             'bg-amber-500/10 text-amber-400 border-amber-500/20'}">
            {#if selectedNode?.type === 'goroutine'}
              <Network class="w-4 h-4" />
            {:else if selectedNode?.type === 'channel'}
              <Database class="w-4 h-4" />
            {:else}
              <Link2 class="w-4 h-4" />
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <h2 class="text-xs font-bold text-zinc-100 uppercase tracking-wider">COMPILER INSPECTOR</h2>
            <div class="text-[11px] text-zinc-400 mt-0.5 leading-tight break-words">
              <span class="text-zinc-500">Target:</span>
              {#if selectedNode}
                <span class="font-bold {selectedNode.type === 'goroutine' ? 'text-emerald-400' : 'text-cyan-400'}">
                  {selectedNode.type === 'goroutine' ? 'Goroutine' : 'Channel'} ({selectedNode.label})
                </span>
              {:else if edgeData}
                <span class="font-bold text-amber-400">
                  runtime.sudog ({edgeData.gNode.label} ↔ {edgeData.targetNode.label})
                </span>
              {/if}
            </div>
          </div>
        </div>

        <button onclick={handleClose} class="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0">
          <X class="w-4 h-4" />
        </button>
      </header>

      <div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
        <button onclick={() => activeTab = 'details'} class="py-1.5 rounded-md transition font-semibold {activeTab === 'details' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400'}">
          Details
        </button>
        <button onclick={() => activeTab = 'scheduler'} class="py-1.5 rounded-md transition font-semibold {activeTab === 'scheduler' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400'}">
          GMP Scheduler
        </button>
      </div>

      {#if activeTab === 'details'}
        {#if edgeData}
          <ConnectorInternals {...edgeData} />
        {:else if selectedNode}
          <NodeInternals node={selectedNode} baseAddress={nodeBaseAddress} />
        {/if}
      {:else if activeTab === 'scheduler'}
        <SchedulerTopology />
      {/if}
    </div>
  {/if}
</aside>
