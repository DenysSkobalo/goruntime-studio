<script lang="ts">
  import type {
    CanvasNode,
    ChannelElemType,
    ChannelNode,
    GoroutineNode,
  } from '$shared/types/nodes';
  import { formatHex, getGoroutineStack, ELEM_SIZE_MAP } from '$core/memory/layout';
  import { GO_RUNTIME_LINKS } from '$shared/config/links';
  import NodeHeader from './NodeHeader.svelte';
  import InfoRow from '$shared/ui/InfoRow.svelte';
  import StatusBadge from '$shared/ui/StatusBadge.svelte';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
  import { i18n } from '$core/i18n';
  import {
    ExternalLink,
    BookOpen,
    Database,
    Cpu,
    Plus,
    Minus,
    Code2,
    ChevronRight,
  } from '@lucide/svelte';
  import { handleDocLinkClick } from '$shared/lib/navigation';

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

  function handleTypeSelect(e: Event) {
    const val = (e.target as HTMLSelectElement).value as ChannelElemType;
    canvasStore.setChannelElemType(node.id, val);
  }

  function updateCapacity(delta: number) {
    if (node.type === 'channel') {
      canvasStore.setChannelCapacity(node.id, node.capacity + delta);
    }
  }

  function onSpecClick(e: MouseEvent, primitiveId: string) {
    handleDocLinkClick(e, `#docs#${primitiveId}`);
  }

  let stack = $derived(
    node.type === 'goroutine' ? getGoroutineStack((node as GoroutineNode).goid) : null,
  );
</script>

<div class="space-y-4 font-mono text-xs">
  <div class="glow-card p-3.5 space-y-2 border border-zinc-800 bg-zinc-900/60 rounded-xl">
    <div class="flex items-center justify-between text-zinc-400">
      <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
        {i18n.t('inspector.targetIdentity')}
      </span>
      <span
        class="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase {node.type ===
        'goroutine'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}"
      >
        {node.type}
      </span>
    </div>
    <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 space-y-2">
      <InfoRow label="Node ID" value={node.id} />
      <div class="flex justify-between items-center">
        <span class="text-zinc-400">{i18n.t('inspector.variableName')}:</span>
        <input
          type="text"
          value={node.label}
          oninput={handleLabelInput}
          class="w-28 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-100 font-bold text-right focus:border-emerald-500 outline-none text-xs"
        />
      </div>
      <InfoRow
        label={i18n.t('inspector.heapAddress')}
        value={hexAddress}
        valueClass="text-amber-400 font-bold"
      />
    </div>
  </div>

  {#if node.type === 'goroutine'}
    {@const g = node as GoroutineNode}
    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <NodeHeader nodeType="goroutine" title={i18n.t('inspector.descriptorG')} />
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1.5 text-[11px]">
        <InfoRow
          label="stack.lo"
          value={stack ? formatHex(stack.stackLo) : '0x0'}
          valueClass="text-emerald-400 font-bold"
        />
        <InfoRow
          label="stack.hi"
          value={stack ? formatHex(stack.stackHi) : '0x0'}
          valueClass="text-emerald-400 font-bold"
        />
        <InfoRow
          label="sched.sp"
          value={stack ? formatHex(stack.schedSp) : '0x0'}
          valueClass="text-amber-300 font-bold"
        />
        <InfoRow
          label="atomicstatus"
          value={g.status === '_Grunning'
            ? '2 (_Grunning)'
            : g.status === '_Gwaiting'
              ? '4 (_Gwaiting)'
              : '1 (_Grunnable)'}
          valueClass="text-purple-300 font-bold"
        />
        <InfoRow label="goid" value={g.goid} valueClass="text-emerald-400 font-bold" />
      </div>
    </div>

    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <div class="flex items-center gap-2 font-bold text-emerald-400 text-xs">
        <Cpu class="w-4 h-4" />
        <span>{i18n.t('inspector.stateG')}</span>
      </div>
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-zinc-400">status:</span>
          <StatusBadge
            variant={g.status === '_Grunning'
              ? 'emerald'
              : g.status === '_Gwaiting'
                ? 'amber'
                : 'zinc'}
          >
            {g.status}
          </StatusBadge>
        </div>
        <InfoRow label="active_function" value={g.label} valueClass="text-emerald-300 font-bold" />
      </div>
    </div>

    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-950/80 rounded-xl">
      <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
        {i18n.t('inspector.docAndSpec')}
      </span>
      <div class="flex flex-col gap-2 w-full">
        <a
          href={GO_RUNTIME_LINKS.GOROUTINE_SPEC}
          target="_blank"
          rel="noopener noreferrer"
          class="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-400 text-xs font-semibold transition group"
        >
          <span class="flex items-center gap-2">
            <Code2 class="w-4 h-4 text-zinc-400 group-hover:text-emerald-400" />
            <span>Go Source (runtime2.go)</span>
          </span>
          <ExternalLink class="w-3.5 h-3.5 shrink-0 text-zinc-500" />
        </a>

        <a
          href="#docs#goroutine"
          target="_blank"
          rel="noopener noreferrer"
          onclick={(e) => onSpecClick(e, 'goroutine')}
          class="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 text-xs font-semibold transition cursor-pointer group"
        >
          <span class="flex items-center gap-2">
            <BookOpen class="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{i18n.t('docs.platformSpec')}</span>
          </span>
          <ChevronRight
            class="w-4 h-4 shrink-0 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform"
          />
        </a>
      </div>
    </div>
  {:else if node.type === 'channel'}
    {@const ch = node as ChannelNode}
    {@const elemSize = ELEM_SIZE_MAP[ch.elemType]}

    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <NodeHeader nodeType="channel" title={i18n.t('inspector.descriptorHchan')} />
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-2 text-[11px]">
        <div class="flex justify-between items-center">
          <span class="text-zinc-400">{i18n.t('inspector.elementType')}:</span>
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
        <InfoRow
          label="buf (unsafe.Pointer)"
          value={hexAddress}
          valueClass="text-amber-400 font-bold"
        />
        <InfoRow label="elemsize" value={`${elemSize} B`} valueClass="text-emerald-400 font-bold" />
      </div>
    </div>

    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-900/60 rounded-xl">
      <div class="flex items-center gap-2 font-bold text-cyan-400 text-xs">
        <Database class="w-4 h-4" />
        <span>{i18n.t('inspector.stateHchan')}</span>
      </div>
      <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-zinc-400">dataqsiz (Capacity):</span>
          <div
            class="flex items-center border border-zinc-700 bg-zinc-900 rounded-lg overflow-hidden"
          >
            <button
              onclick={() => updateCapacity(-1)}
              class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border-r border-zinc-700 cursor-pointer"
            >
              <Minus class="w-3 h-3" />
            </button>
            <span class="w-10 text-center font-bold text-cyan-400 text-xs">{ch.capacity}</span>
            <button
              onclick={() => updateCapacity(1)}
              class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border-l border-zinc-700 cursor-pointer"
            >
              <Plus class="w-3 h-3" />
            </button>
          </div>
        </div>

        <InfoRow
          label="qcount (Buffered)"
          value={ch.values.length}
          valueClass="text-cyan-400 font-bold"
        />
      </div>
    </div>

    <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-950/80 rounded-xl">
      <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
        {i18n.t('inspector.docAndSpec')}
      </span>
      <div class="flex flex-col gap-2 w-full">
        <a
          href={GO_RUNTIME_LINKS.CHANNEL_SPEC}
          target="_blank"
          rel="noopener noreferrer"
          class="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-400 text-xs font-semibold transition group"
        >
          <span class="flex items-center gap-2">
            <Code2 class="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" />
            <span>Go Source (chan.go)</span>
          </span>
          <ExternalLink class="w-3.5 h-3.5 shrink-0 text-zinc-500" />
        </a>

        <a
          href="#docs#channel"
          target="_blank"
          rel="noopener noreferrer"
          onclick={(e) => onSpecClick(e, 'channel')}
          class="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 text-xs font-semibold transition cursor-pointer group"
        >
          <span class="flex items-center gap-2">
            <BookOpen class="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{i18n.t('docs.platformSpec')}</span>
          </span>
          <ChevronRight
            class="w-4 h-4 shrink-0 text-cyan-500/60 group-hover:translate-x-0.5 transition-transform"
          />
        </a>
      </div>
    </div>
  {/if}
</div>
