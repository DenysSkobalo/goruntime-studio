<script lang="ts">
    import { getGoroutineStack, getRawBaseAddress } from '$core/memory/layout';
    import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
  import { X, Link2, Code2, Layers } from 'lucide-svelte';
    import ConnectorInternals from './ConnectorInternals.svelte';
    import NodeInternals from './NodeInternals.svelte';
    import SchedulerTopology from './SchedulerTopology.svelte';

  let activeTab = $state<'details' | 'scheduler'>('details');

  let panelWidth = $state(384);
  let isResizing = $state(false);

  let selectedNode = $derived(canvasStore.getNode(canvasStore.selectedNodeId));
  let selectedEdge = $derived(canvasStore.getEdge(canvasStore.selectedEdgeId));

  let isOpen = $derived(selectedNode !== null || selectedEdge !== null);

  let targetInfo = $derived.by(() => {
    if (selectedEdge) {
      return {
        label: `Connector (${selectedEdge.id})`,
        colorClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10 border-rose-500/20',
        structName: 'runtime.sudog',
      };
    }
    if (selectedNode) {
      switch (selectedNode.type) {
        case 'goroutine':
          return {
            label: `Node (${selectedNode.label})`,
            colorClass: 'text-emerald-400',
            bgClass: 'bg-emerald-500/10 border-emerald-500/20',
            structName: 'runtime.g',
          };
        case 'channel':
          return {
            label: `Node (${selectedNode.label})`,
            colorClass: 'text-cyan-400',
            bgClass: 'bg-cyan-500/10 border-cyan-500/20',
            structName: 'runtime.hchan',
          };
        case 'mutex':
          return {
            label: `Node (${selectedNode.label})`,
            colorClass: 'text-amber-400',
            bgClass: 'bg-amber-500/10 border-amber-500/20',
            structName: 'sync.Mutex',
          };
        case 'waitgroup':
          return {
            label: `Node (${selectedNode.label})`,
            colorClass: 'text-blue-400',
            bgClass: 'bg-blue-500/10 border-blue-500/20',
            structName: 'sync.WaitGroup',
          };
        case 'select':
          return {
            label: `Node (${selectedNode.label})`,
            colorClass: 'text-purple-400',
            bgClass: 'bg-purple-500/10 border-purple-500/20',
            structName: 'runtime.hselect',
          };
      }
    }
    return {
      label: '',
      colorClass: 'text-zinc-400',
      bgClass: 'bg-zinc-500/10 border-zinc-500/20',
      structName: 'Node',
    };
  });

  let edgeData = $derived.by(() => {
    if (!selectedEdge) return null;
    const src = canvasStore.getNode(selectedEdge.source);
    const tgt = canvasStore.getNode(selectedEdge.target);
    if (!src || !tgt) return null;

    const gNode = src.type === 'goroutine' ? src : tgt.type === 'goroutine' ? tgt : null;
    const targetNode = src.type !== 'goroutine' ? src : tgt.type !== 'goroutine' ? tgt : null;

    if (!gNode || !targetNode) return null;

    const sudogAddr = getRawBaseAddress(selectedEdge.id);
    const gAddr = getRawBaseAddress(gNode.id);
    const targetAddr = getRawBaseAddress(targetNode.id);
    const stack = getGoroutineStack(gNode.goid);

    return {
      edge: selectedEdge,
      gNode,
      targetNode,
      sudogAddress: sudogAddr,
      gAddress: gAddr,
      targetAddress: targetAddr,
      elemAddress: stack.elemAddr,
    };
  });

  let nodeBaseAddress = $derived(selectedNode ? getRawBaseAddress(selectedNode.id) : 0n);

  function handleClose() {
    canvasStore.selectNode(null);
    canvasStore.selectEdge(null);
  }

  function handleResizeStart(e: PointerEvent) {
    e.preventDefault();
    isResizing = true;
    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeEnd);
  }

  function handleResizeMove(e: PointerEvent) {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    const maxAllowedWidth = Math.min(750, window.innerWidth - 280);
    panelWidth = Math.max(320, Math.min(newWidth, maxAllowedWidth));
  }

  function handleResizeEnd() {
    isResizing = false;
    window.removeEventListener('pointermove', handleResizeMove);
    window.removeEventListener('pointerup', handleResizeEnd);
  }
</script>

<aside
  style="width: {panelWidth}px;"
  class="fixed right-0 top-14 bottom-0 bg-[#09090b] border-l border-zinc-800/80 text-zinc-200 z-40 transition-transform duration-300 ease-in-out shadow-2xl {isOpen ? 'translate-x-0' : 'translate-x-full'}"
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onpointerdown={handleResizeStart}
    class="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-emerald-500/50 active:bg-emerald-500 transition-colors z-50"
    title="Drag to resize Inspector"
  ></div>

  {#if isOpen}
    <div class="flex flex-col h-full p-4 overflow-y-auto space-y-4 animate-fade-in">
      <header class="flex items-start justify-between border-b border-zinc-800/80 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 {targetInfo.bgClass} {targetInfo.colorClass}">
            <Link2 class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-xs font-bold font-mono text-zinc-100 uppercase tracking-wider">
              COMPILER INSPECTOR
            </h2>
            <p class="text-[11px] font-mono text-zinc-400 mt-0.5">
              Target: <span class="font-semibold {targetInfo.colorClass}">{targetInfo.label}</span>
            </p>
          </div>
        </div>

        <button 
          onclick={handleClose} 
          class="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Close Inspector"
        >
          <X class="w-4 h-4" />
        </button>
      </header>

      <div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800 font-mono text-xs">
        <button
          onclick={() => activeTab = 'details'}
          class="flex items-center justify-center gap-1.5 py-1.5 rounded-md transition font-semibold {activeTab === 'details' ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
        >
          <Code2 class="w-3.5 h-3.5" />
          <span>{targetInfo.structName}</span>
        </button>

        <button
          onclick={() => activeTab = 'scheduler'}
          class="flex items-center justify-center gap-1.5 py-1.5 rounded-md transition font-semibold {activeTab === 'scheduler' ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>GMP Scheduler</span>
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