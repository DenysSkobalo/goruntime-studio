<script lang="ts">
  import { formatHex } from '$core/memory/layout';
  import type { CanvasEdge, CanvasNode } from '$shared/types/nodes';
  import NodeHeader from './NodeHeader.svelte';
  import { ArrowLeftRight, Cpu, Database } from 'lucide-svelte';

  interface Props {
    edge: CanvasEdge;
    gNode: CanvasNode;
    targetNode: CanvasNode;
    sudogAddress: bigint;
    gAddress: bigint;
    targetAddress: bigint;
    elemAddress: bigint;
  }

  let { edge, gNode, targetNode, sudogAddress, gAddress, targetAddress, elemAddress }: Props = $props();
</script>

<div class="space-y-4 font-mono text-xs">
  <div class="glow-card p-3.5 space-y-2 border border-zinc-800 bg-zinc-900/60 rounded-xl">
    <div class="flex justify-between items-center">
      <span class="text-zinc-400">sudog Heap Address:</span>
      <span class="text-amber-400 font-bold">{formatHex(sudogAddress)}</span>
    </div>
  </div>

  <div class="glow-card p-3.5 space-y-3 border border-zinc-800 bg-zinc-900/60 rounded-xl">
    <NodeHeader nodeType="sudog" title="runtime.sudog Link" />
    <div class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2">
      <div class="flex justify-between">
        <span class="text-zinc-400">g (*g):</span>
        <span class="text-emerald-400 font-bold">{formatHex(gAddress)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-400">elem (unsafe.Pointer):</span>
        <span class="text-amber-300 font-bold">{formatHex(elemAddress)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-400">c (*hchan):</span>
        <span class="text-cyan-400 font-bold">{formatHex(targetAddress)}</span>
      </div>
    </div>
  </div>

  <!-- Опис технології Direct Stack Transfer -->
  <div class="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-200/90 leading-relaxed text-[11px]">
    <div class="flex items-center gap-2 font-bold text-cyan-400 mb-1">
      <ArrowLeftRight class="w-4 h-4 shrink-0" />
      Direct Stack Transfer
    </div>
    Вказівник <code class="text-amber-300">elem</code> вказує безпосередньо на змінну у фреймі стека {gNode.label}. Передача даних здійснюється викликом <code class="text-emerald-400">runtime.memmove</code> без зайвих алокацій у Heap.
  </div>
</div>
