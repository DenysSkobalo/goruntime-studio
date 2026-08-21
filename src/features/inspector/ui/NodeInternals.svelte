<!-- src/lib/inspector/components/NodeInternals.svelte -->
<script lang="ts">
    import { addOffset, formatHex, getGoroutineStack } from '$core/memory/layout';
    import type { CanvasNode } from '$lib/types/nodes';
  import { Cpu, Database, Layers, Lock, Sliders } from 'lucide-svelte';
    import { timeline } from '../model/timeline.store.svelte';
    import { stackModalStore } from '$lib/stores/stack-modal.store.svelte';
    import NodeHeader from './NodeHeader.svelte';

  interface Props {
    node: CanvasNode;
    baseAddress: bigint;
  }

  let { node, baseAddress }: Props = $props();

  let stack = $derived(
    node.type === 'goroutine' ? getGoroutineStack(node.goid) : null
  );

  let bufPtr = $derived(addOffset(baseAddress, 0x0010n));
  let recvqPtr = $derived(addOffset(baseAddress, 0x0038n));
  let sendqPtr = $derived(addOffset(baseAddress, 0x0048n));

  let semaPtr = $derived(addOffset(baseAddress, 0x0004n));

  let mutexStateVal = $derived.by(() => {
    if (node.type !== 'mutex') return 0;
    let val = 0;
    if (node.locked) val |= 1;
    if (node.starving) val |= 4;
    val |= (node.waitersCount << 3);
    return val;
  });

  function handleLiveCapacityChange(e: Event) {
    if (node.type !== 'channel') return;
    const input = e.target as HTMLInputElement;
    const newCap = Math.max(0, Math.min(8, parseInt(input.value, 10) || 0));

    // 1. Оновлюємо стан на самому Canvas-вузлі
    (node as any).capacity = newCap;

    // 2. Оновлюємо стан каналу у рантайм-сナップшотах (MEM_ADDRESSES.CH1 або за адресою)
    const chanAddress = node.id.includes('2') ? '0x00c000082080' : '0x00c000082000';
    timeline.updateChannelCapacity(chanAddress, newCap);
  }
</script>

<div class="space-y-4 font-mono">
  <!-- Heap Base Address Header -->
  <div class="glow-card p-3.5 space-y-2 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
    <div class="flex justify-between items-center">
      <span class="text-zinc-400">Node ID:</span>
      <span class="text-zinc-200 font-bold">{node.id}</span>
    </div>
    <div class="flex justify-between items-center">
      <span class="text-zinc-400">Heap Base Address:</span>
      <span class="text-amber-400 font-bold">{formatHex(baseAddress)}</span>
    </div>
  </div>

  <!-- RUNTIME STATE -->
  <div class="glow-card p-3.5 space-y-2.5 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
    <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
      RUNTIME STATE
    </div>

    {#if node.type === 'goroutine'}
      <div class="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
        <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Cpu class="w-3.5 h-3.5" />
          <span>goid: {node.goid}</span>
        </div>

        <button
          onclick={() => stackModalStore.open(node.goid)}
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition"
          title="Open Virtual Stack Inspector"
        >
          <Layers class="w-3.5 h-3.5 text-emerald-400" />
          <span>Inspect Stack</span>
        </button>
      </div>
    {:else if node.type === 'channel'}
      <div class="space-y-2">
        <div class="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
            <Database class="w-3.5 h-3.5" />
            <span>cap: {node.capacity}</span>
          </div>
          <div class="text-right">
            <span class="text-zinc-400">buffered: </span>
            <span class="text-cyan-300 font-bold">{node.values.length}</span>
            {#if node.closed}
              <span class="ml-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">CLOSED</span>
            {/if}
          </div>
        </div>

        <!-- Інтерактивний контролер ємності для каналу -->
        <div class="flex items-center justify-between bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/30 text-xs">
          <span class="text-cyan-400 font-bold flex items-center gap-1.5">
            <Sliders class="w-3.5 h-3.5" /> Live Capacity (dataqsiz):
          </span>
          <input
            type="number"
            min="0"
            max="8"
            value={node.capacity}
            oninput={handleLiveCapacityChange}
            class="w-12 rounded border border-cyan-500/50 bg-zinc-950 px-1.5 py-0.5 text-center font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
    {:else if node.type === 'mutex'}
      <div class="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
        <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
          <Lock class="w-3.5 h-3.5" />
          <span>state: {node.locked ? 'LOCKED' : 'UNLOCKED'}</span>
        </div>
        <div class="text-right text-[11px]">
          <span class="text-zinc-400">waiters: </span>
          <span class="text-amber-300 font-bold">{node.waitersCount}</span>
          {#if node.starving}
            <span class="ml-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">STARVING</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- STRUCT DESCRIPTOR -->
  <div class="glow-card p-3.5 space-y-3 text-xs border border-zinc-800/80 bg-zinc-900/60 rounded-xl">
    <NodeHeader nodeType={node.type} title="{node.type} Descriptor" />

    <div class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80 space-y-2 leading-relaxed">
      {#if node.type === 'goroutine' && stack}
        <div class="text-purple-400/80 italic text-[11px]">// src/runtime/runtime2.go</div>
        <div>
          <span class="text-purple-400">type</span> <span class="text-amber-300 font-bold">g</span> <span class="text-purple-400">struct</span> &#123;
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>stack.lo <span class="text-purple-400">uintptr</span></span>
          <span class="text-emerald-400 font-bold">{formatHex(stack.stackLo)}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>stack.hi <span class="text-purple-400">uintptr</span></span>
          <span class="text-emerald-400 font-bold">{formatHex(stack.stackHi)}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>sched.sp <span class="text-purple-400">uintptr</span></span>
          <span class="text-amber-300 font-bold">{formatHex(stack.schedSp)}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>atomicstatus <span class="text-purple-400">uint32</span></span>
          <span class="text-sky-400 font-bold">{node.status}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>goid <span class="text-purple-400">int64</span></span>
          <span class="text-sky-400 font-bold">{node.goid}</span>
        </div>
        <div>&#125;</div>
      {:else if node.type === 'channel'}
        <div class="text-purple-400/80 italic text-[11px]">// src/runtime/chan.go</div>
        <div>
          <span class="text-purple-400">type</span> <span class="text-amber-300 font-bold">hchan</span> <span class="text-purple-400">struct</span> &#123;
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>qcount <span class="text-purple-400">uint</span></span>
          <span class="text-cyan-300 font-bold">{node.values.length}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>dataqsiz <span class="text-purple-400">uint</span></span>
          <span class="text-emerald-400 font-bold">{node.capacity}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>buf <span class="text-purple-400">unsafe.Pointer</span></span>
          <span class="text-amber-300 font-bold">{formatHex(bufPtr)}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>recvq <span class="text-purple-400">waitq</span></span>
          <span class="text-emerald-400 font-bold">{formatHex(recvqPtr)}</span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>sendq <span class="text-purple-400">waitq</span></span>
          <span class="text-emerald-400 font-bold">{formatHex(sendqPtr)}</span>
        </div>
        <div>&#125;</div>
      {:else if node.type === 'mutex'}
        <div class="text-purple-400/80 italic text-[11px]">// src/sync/mutex.go</div>
        <div>
          <span class="text-purple-400">type</span> <span class="text-amber-300 font-bold">Mutex</span> <span class="text-purple-400">struct</span> &#123;
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>state <span class="text-purple-400">int32</span></span>
          <span class="text-amber-300 font-bold" title="Bitmask: locked | woken | starving | (waiters << 3)">
            {mutexStateVal} <span class="text-zinc-500 font-normal text-[10px]">(0b{mutexStateVal.toString(2).padStart(4, '0')})</span>
          </span>
        </div>
        <div class="pl-4 flex justify-between items-center">
          <span>sema <span class="text-purple-400">uint32</span></span>
          <span class="text-emerald-400 font-bold">{formatHex(semaPtr)}</span>
        </div>
        <div>&#125;</div>
      {/if}
    </div>
  </div>
</div>