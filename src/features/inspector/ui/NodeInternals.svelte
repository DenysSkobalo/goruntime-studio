<script lang="ts">
  import { ELEM_SIZE_MAP, type CanvasNode, type ChannelElemType, type ChannelNode, type GoroutineNode } from '$shared/types/nodes';
  import { formatHex, getGoroutineStack } from '$core/memory/layout';
  import NodeHeader from './NodeHeader.svelte';
  import InfoRow from '$shared/ui/InfoRow.svelte';
  import StatusBadge from '$shared/ui/StatusBadge.svelte';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
  import { ExternalLink, BookOpen, Database, Cpu, Plus, Minus } from 'lucide-svelte';

  let { node, baseAddress }: { node: CanvasNode; baseAddress: bigint } = $props();
  let hexAddress = $derived(formatHex(baseAddress));

  const CHANNEL_ELEM_OPTIONS: { value: ChannelElemType; label: string }[] = [
    { value: 'string', label: 'chan string' },
    { value: 'int64', label: 'chan int64' },
    { value: 'bool', label: 'chan bool' },
    { value: 'struct{}', label: 'chan struct{}' },
  ];

  function handleLabelInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (val.trim()) {
      canvasStore.setNodeLabel(node.id, val.trim());
    }
  }

  // TODO: tsgoruntime-kernel має відповідати за динамічний рефлекшин типів (runtime._type / abi.Type),
  // автоматичний розрахунок elemsize залежно від архітектури (32/64-bit), а також серіалізацію/валідацію
  // елементів буфера відповідно до обраного типу.
  function handleTypeSelect(e: Event) {
    const val = (e.target as HTMLSelectElement).value as ChannelElemType;
    canvasStore.setChannelElemType(node.id, val);
  }

  function updateCapacity(delta: number) {
    if (node.type === 'channel') {
      canvasStore.setChannelCapacity(node.id, node.capacity + delta);
    }
  }

  let stack = $derived(node.type === 'goroutine' ? getGoroutineStack((node as GoroutineNode).goid) : null);
</script>

<div class="space-y-4 font-mono text-xs">

  <!-- BLOCK 1: TARGET IDENTITY -->
  <div class="glow-card p-3.5 space-y-2 border border-zinc-800 bg-zinc-900/60 rounded-xl">
    <div class="flex items-center justify-between text-zinc-400">
      <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Target Identity</span>
      <span class="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase {node.type === 'goroutine' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}">
        {node.type}
      </span>
    </div>
    <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 space-y-2">
      <InfoRow label="Node ID" value={node.id} />
      <div class="flex justify-between items-center">
        <span class="text-zinc-400">Variable Name:</span>
        <input
          type="text"
          value={node.label}
          oninput={handleLabelInput}
          class="w-28 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-100 font-bold text-right focus:border-emerald-500 outline-none text-xs"
        />
      </div>
      <InfoRow label="Heap Address" value={hexAddress} valueClass="text-amber-400 font-bold" />
    </div>
  </div>

  {#if node.type === 'goroutine'}
    {@const g = node as GoroutineNode}

    <!-- BLOCK 2: DESCRIPTOR runtime.g -->
    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <NodeHeader nodeType="goroutine" title="Descriptor: runtime.g" />
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1.5 text-[11px]">
        <InfoRow label="stack.lo" value={stack ? formatHex(stack.stackLo) : '0x0'} valueClass="text-emerald-400 font-bold" />
        <InfoRow label="stack.hi" value={stack ? formatHex(stack.stackHi) : '0x0'} valueClass="text-emerald-400 font-bold" />
        <InfoRow label="sched.sp" value={stack ? formatHex(stack.schedSp) : '0x0'} valueClass="text-amber-300 font-bold" />
        <InfoRow label="atomicstatus" value={g.status === '_Grunning' ? '2 (_Grunning)' : g.status === '_Gwaiting' ? '4 (_Gwaiting)' : '1 (_Grunnable)'} valueClass="text-purple-300 font-bold" />
        <InfoRow label="goid" value={g.goid} valueClass="text-emerald-400 font-bold" />
        <InfoRow label="sched.pc" value="0x00000045e120" valueClass="text-zinc-400" />
      </div>
    </div>

    <!-- BLOCK 3: STATE runtime.g -->
    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <div class="flex items-center gap-2 font-bold text-emerald-400 text-xs">
        <Cpu class="w-4 h-4" />
        <span>State: runtime.g</span>
      </div>
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-zinc-400">status:</span>
          <StatusBadge variant={g.status === '_Grunning' ? 'emerald' : g.status === '_Gwaiting' ? 'amber' : 'zinc'}>
            {g.status}
          </StatusBadge>
        </div>
        <InfoRow label="active_function" value={g.label} valueClass="text-emerald-300 font-bold" />
      </div>
    </div>

    <!-- BLOCK 4: DOCUMENTATION -->
    <div class="glow-card p-3 space-y-2 border border-zinc-800 bg-zinc-950/80 rounded-xl">
      <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Documentation & Specification</span>
      <div class="flex items-center gap-2">
        <a href="https://github.com/golang/go/blob/master/src/runtime/runtime2.go#L400" target="_blank" rel="noopener noreferrer" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-400 text-[10px] transition">
          <span>runtime2.go</span><ExternalLink class="w-3 h-3" />
        </a>
        <a href="#docs#goroutine" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-[10px] transition">
          <BookOpen class="w-3 h-3" /><span>Platform Spec</span>
        </a>
      </div>
    </div>

  {:else if node.type === 'channel'}
    {@const ch = node as ChannelNode}
    {@const elemSize = ELEM_SIZE_MAP[ch.elemType]}

    <!-- BLOCK 2: DESCRIPTOR runtime.hchan -->
    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <NodeHeader nodeType="channel" title="Descriptor: runtime.hchan" />
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-2 text-[11px]">
        <div class="flex justify-between items-center">
          <span class="text-zinc-400">Element Type:</span>
          <select
            value={ch.elemType}
            onchange={handleTypeSelect}
            class="bg-zinc-900 border border-zinc-700 text-cyan-400 font-bold rounded px-2 py-0.5 outline-none focus:border-cyan-500 cursor-pointer"
          >
            {#each CHANNEL_ELEM_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>

        <InfoRow label="qcount" value={ch.values.length} valueClass="text-cyan-400 font-bold" />
        <InfoRow label="dataqsiz" value={ch.capacity} valueClass="text-cyan-400 font-bold" />
        <InfoRow label="buf (unsafe.Pointer)" value={hexAddress} valueClass="text-amber-400 font-bold" />
        <InfoRow label="elemsize" value={`${elemSize} B`} valueClass="text-emerald-400 font-bold" />
        <InfoRow label="closed" value={ch.closed ? '1 (true)' : '0 (false)'} valueClass={ch.closed ? 'text-rose-400 font-bold' : 'text-emerald-400'} />
      </div>
    </div>

    <!-- BLOCK 3: STATE runtime.hchan -->
    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <div class="flex items-center gap-2 font-bold text-cyan-400 text-xs">
        <Database class="w-4 h-4" />
        <span>State: runtime.hchan</span>
      </div>
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-3">
        <!-- Custom Stepper -->
        <div class="flex justify-between items-center">
          <span class="text-zinc-400">dataqsiz (Capacity):</span>
          <div class="flex items-center border border-zinc-700 bg-zinc-900 rounded-lg overflow-hidden">
            <button
              onclick={() => updateCapacity(-1)}
              class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border-r border-zinc-700"
            >
              <Minus class="w-3 h-3" />
            </button>
            <span class="w-10 text-center font-bold text-cyan-400 text-xs">{ch.capacity}</span>
            <button
              onclick={() => updateCapacity(1)}
              class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border-l border-zinc-700"
            >
              <Plus class="w-3 h-3" />
            </button>
          </div>
        </div>

        <InfoRow label="qcount (Buffered)" value={ch.values.length} valueClass="text-cyan-400 font-bold" />
        <InfoRow label="closed" value={String(ch.closed)} valueClass={ch.closed ? 'text-rose-400 font-bold' : 'text-emerald-400'} />

        <div class="space-y-1 pt-1 border-t border-zinc-800">
          <span class="text-zinc-500 text-[10px] uppercase font-bold">Ring Buffer Elements:</span>
          <div class="flex gap-1.5 flex-wrap">
            {#if ch.values.length === 0}
              <span class="text-zinc-600 text-[10px] italic">empty</span>
            {:else}
              {#each ch.values as val, idx}
                <span class="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700/50 rounded text-[10px] font-bold">
                  [{idx}]: {val}
                </span>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- BLOCK 4: DOCUMENTATION -->
    <div class="glow-card p-3 space-y-2 border border-zinc-800 bg-zinc-950/80 rounded-xl">
      <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Documentation & Specification</span>
      <div class="flex items-center gap-2">
        <a href="https://github.com/golang/go/blob/master/src/runtime/chan.go#L32" target="_blank" rel="noopener noreferrer" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-400 text-[10px] transition">
          <span>chan.go</span><ExternalLink class="w-3 h-3" />
        </a>
        <a href="#docs#channel" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 text-cyan-300 text-[10px] transition">
          <BookOpen class="w-3 h-3" /><span>Platform Spec</span>
        </a>
      </div>
    </div>
  {/if}

</div>
