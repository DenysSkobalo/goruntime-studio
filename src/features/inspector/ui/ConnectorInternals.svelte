<script lang="ts">
  import { formatHex } from '$core/memory/layout';
  import type { CanvasEdge, CanvasNode } from '$lib/types/nodes';
  import { MessageSquare, Cpu, Database, Lock, ArrowLeftRight, Shield } from 'lucide-svelte';
  import NodeHeader from './NodeHeader.svelte';

  interface Props {
    edge: CanvasEdge;
    gNode: CanvasNode;
    targetNode: CanvasNode;
    sudogAddress: bigint;
    gAddress: bigint;
    targetAddress: bigint;
    elemAddress: bigint;
  }

  let {
    edge,
    gNode,
    targetNode,
    sudogAddress,
    gAddress,
    targetAddress,
    elemAddress,
  }: Props = $props();

  let isMutex = $derived(targetNode.type === 'mutex');
  let isChannel = $derived(targetNode.type === 'channel');
</script>

<div class="space-y-4 font-mono">
  <!-- Metadata Box -->
  <div class="glow-card p-3.5 space-y-2.5 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
    <div class="flex justify-between items-center">
      <span class="text-zinc-400">Connector ID:</span>
      <span class="text-rose-400 font-bold">{edge.id}</span>
    </div>
    <div class="flex justify-between items-center">
      <span class="text-zinc-400">sudog Heap Address:</span>
      <span class="text-amber-400 font-bold">{formatHex(sudogAddress)}</span>
    </div>
  </div>

  <!-- Topology Routing Box -->
  <div class="glow-card p-3.5 space-y-2.5 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
    <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
      TOPOLOGY ROUTING
    </div>
    <div class="flex items-center justify-between gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
        <Cpu class="w-3.5 h-3.5" />
        <span>{gNode.label}</span>
      </div>

      <ArrowLeftRight class="w-3.5 h-3.5 text-zinc-500 shrink-0" />

      {#if isMutex}
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
          <Lock class="w-3.5 h-3.5" />
          <span>{targetNode.label}</span>
        </div>
      {:else}
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
          <Database class="w-3.5 h-3.5" />
          <span>{targetNode.label}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Struct Memory Layout Card -->
  <div class="glow-card p-3.5 space-y-3 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
    <NodeHeader nodeType="sudog" title="runtime.sudog Descriptor" />

    <div class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80 space-y-2 leading-relaxed">
      <div class="text-purple-400/80 italic text-[11px]">// src/runtime/runtime2.go</div>
      <div>
        <span class="text-purple-400">type</span> <span class="text-amber-300 font-bold">sudog</span> <span class="text-purple-400">struct</span> &#123;
      </div>
      
      <div class="pl-4 flex justify-between items-center">
        <span>g <span class="text-purple-400">*g</span></span>
        <span class="text-emerald-400 font-bold">{formatHex(gAddress)}</span>
      </div>

      <div class="pl-4 flex justify-between items-center">
        <span>next <span class="text-purple-400">*sudog</span></span>
        <span class="text-zinc-500">nil</span>
      </div>

      <div class="pl-4 flex justify-between items-center">
        <span>prev <span class="text-purple-400">*sudog</span></span>
        <span class="text-zinc-500">nil</span>
      </div>

      <div class="pl-4 flex justify-between items-center">
        <span>elem <span class="text-purple-400">unsafe.Pointer</span></span>
        <span class="text-amber-300 font-bold">{formatHex(elemAddress)}</span>
      </div>

      <div class="pl-4 flex justify-between items-center">
        <span>c <span class="text-purple-400">*hchan</span></span>
        {#if isChannel}
          <span class="text-cyan-400 font-bold">{formatHex(targetAddress)}</span>
        {:else}
          <span class="text-zinc-500 font-bold">nil</span>
        {/if}
      </div>

      {#if isMutex}
        <div class="pl-4 flex justify-between items-center">
          <span>acquiretime <span class="text-purple-400">int64</span></span>
          <span class="text-sky-400 font-bold">0</span>
        </div>
      {/if}

      <div>&#125;</div>
    </div>
  </div>

  <!-- Mechanism Explanation Box -->
  {#if isMutex}
    <div class="glow-card p-3.5 space-y-2 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
      <div class="flex items-center gap-2 text-amber-400 font-bold">
        <Shield class="w-4 h-4" />
        <span>Semaphore Wait Queue (semaRoot)</span>
      </div>
      <p class="text-zinc-300 leading-relaxed font-sans text-xs">
        Вказівник <code class="text-amber-300 font-mono">elem</code> вказує на фрейм стека горутини <code class="text-emerald-400 font-mono">{gNode.label}</code>. При конкурентному виклику <code class="text-amber-300 font-mono">mu.Lock()</code> об'єкт <code class="text-zinc-200 font-mono">sudog</code> розміщується у черзі очікування семафори <code class="text-purple-300 font-mono">semaRoot</code> (сбалансоване дерево Treap) через виклик <code class="text-zinc-200 font-mono">runtime.semacquire1</code>.
      </p>
    </div>
  {:else}
    <div class="glow-card p-3.5 space-y-2 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
      <div class="flex items-center gap-2 text-cyan-400 font-bold">
        <MessageSquare class="w-4 h-4" />
        <span>Direct Stack Transfer</span>
      </div>
      <p class="text-zinc-300 leading-relaxed font-sans text-xs">
        Вказівник <code class="text-amber-300 font-mono">elem</code> вказує безпосередньо на змінну у фреймі стека <code class="text-emerald-400 font-mono">{gNode.label}</code>. Передача даних здійснюється викликом <code class="text-zinc-200 font-mono">runtime.memmove</code> без зайвих алокацій у Heap.
      </p>
    </div>
  {/if}
</div>