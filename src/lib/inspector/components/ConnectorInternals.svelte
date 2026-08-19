<script lang="ts">
  import type { ExtendedCanvasEdge } from '../../canvas/state/canvas.svelte';
  import { canvasStore } from '../../canvas/state/canvas.svelte';
  import NodeHeader from './NodeHeader.svelte';
  import { ArrowRightLeft, Cpu, Database, MemoryStick } from 'lucide-svelte';

  let { edge }: { edge: ExtendedCanvasEdge | null } = $props();

  let sourceNode = $derived(
    edge ? canvasStore.getNode(edge.source) : null
  );
  let targetNode = $derived(
    edge ? canvasStore.getNode(edge.target) : null
  );

  function getRawBaseAddress(id: string, type: string): bigint {
    if (!id) return 0xc000083000n;
    let hash = 0n;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31n + BigInt(id.charCodeAt(i))) & 0xffffffffffffffffn;
    }
    const slotIndex = Math.abs(Number(hash % 64n));
    const stepBytes = type === 'goroutine' ? 512n : 128n;
    const baseAddr = 0xc000083000n + BigInt(slotIndex) * stepBytes;
    return baseAddr - (baseAddr % 8n);
  }

  function formatHex(addr: bigint): string {
    return `0x${addr.toString(16)}`;
  }

  let sudogBase = $derived(
    edge ? getRawBaseAddress(edge.id, 'sudog') : 0n
  );
  let sudogAddr = $derived(formatHex(sudogBase));

  let gAddr = $derived.by(() => {
    if (!sourceNode) return 'nil (0x0)';
    return formatHex(getRawBaseAddress(sourceNode.id, sourceNode.type));
  });

  let chanAddr = $derived.by(() => {
    if (!targetNode) return 'nil (0x0)';
    return formatHex(getRawBaseAddress(targetNode.id, targetNode.type));
  });

  let elemAddr = $derived.by(() => {
    if (!sourceNode) return formatHex(sudogBase + 64n);
    const sourceBase = getRawBaseAddress(sourceNode.id, sourceNode.type);
    const stackLo = sourceBase + 0x800n;
    return formatHex(stackLo + 128n);
  });
</script>

{#if edge}
  <div class="space-y-4 font-mono text-xs max-w-full overflow-hidden">
    <!-- Connector Meta -->
    <div class="inner-card p-3 space-y-2 border-rose-500/30">
      <div class="flex items-center justify-between text-[11px]">
        <span class="text-zinc-400">Connector ID:</span>
        <span class="font-bold text-rose-400 truncate ml-2">{edge.id}</span>
      </div>
      <div class="flex items-center justify-between text-[11px]">
        <span class="text-zinc-400">sudog Heap Address:</span>
        <span class="text-amber-400 font-bold">{sudogAddr}</span>
      </div>
    </div>

    <!-- Topology Routing -->
    <div class="glow-card p-3 space-y-2 border-zinc-800">
      <div class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Topology Routing</div>
      <div class="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-[11px] gap-1">
        <div class="flex items-center gap-1 text-emerald-400 font-bold truncate">
          <Cpu class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{sourceNode?.label ?? 'Source'}</span>
        </div>
        <ArrowRightLeft class="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        <div class="flex items-center gap-1 text-cyan-400 font-bold truncate">
          <Database class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{targetNode?.label ?? 'Target'}</span>
        </div>
      </div>
    </div>

    <!-- Go Runtime Layout: runtime.sudog -->
    <div class="glow-card p-4 space-y-3">
      <NodeHeader nodeType="sudog" title="runtime.sudog Descriptor" />

      <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2 text-[11px] overflow-x-hidden">
        <div class="text-zinc-500 font-bold">// src/runtime/runtime2.go</div>
        <div class="text-purple-400">type <span class="text-amber-300">sudog</span> struct &#123;</div>
        
        <div class="pl-3 space-y-1">
          <div class="flex justify-between items-center gap-2">
            <span class="text-zinc-300 truncate">g <span class="text-purple-400">*g</span></span>
            <span class="text-emerald-400 font-bold shrink-0">{gAddr}</span>
          </div>
          <div class="flex justify-between items-center gap-2">
            <span class="text-zinc-300 truncate">next <span class="text-purple-400">*sudog</span></span>
            <span class="text-zinc-500 shrink-0">nil</span>
          </div>
          <div class="flex justify-between items-center gap-2">
            <span class="text-zinc-300 truncate">prev <span class="text-purple-400">*sudog</span></span>
            <span class="text-zinc-500 shrink-0">nil</span>
          </div>
          <div class="flex justify-between items-center gap-2">
            <span class="text-zinc-300 truncate">elem <span class="text-purple-400">unsafe.Pointer</span></span>
            <span class="text-amber-400 font-bold shrink-0">{elemAddr}</span>
          </div>
          <div class="flex justify-between items-center gap-2">
            <span class="text-zinc-300 truncate">c <span class="text-purple-400">*hchan</span></span>
            <span class="text-cyan-400 font-bold shrink-0">{chanAddr}</span>
          </div>
        </div>

        <div class="text-purple-400">&#125;</div>
      </div>
    </div>

    <!-- Direct Stack Transfer Info -->
    <div class="inner-card p-3 space-y-1.5 border-cyan-500/20">
      <div class="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px]">
        <MemoryStick class="h-3.5 w-3.5" />
        <span>Direct Stack Transfer</span>
      </div>
      <p class="text-[11px] text-zinc-300 leading-relaxed">
        Вказівник <code class="text-amber-300">elem</code> вказує безпосередньо на фрейм стека <code class="text-emerald-300">{sourceNode?.label ?? 'goroutine'}</code>. Передача даних здійснюється викликом <code class="text-purple-300">runtime.memmove</code> без зайвих алокацій у Heap.
      </p>
    </div>
  </div>
{/if}