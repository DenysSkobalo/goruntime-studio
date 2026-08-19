<script lang="ts">
  import { Network, Database, Lock, Users, Shuffle } from 'lucide-svelte';

  interface Props {
    node: any;
    isSelected: boolean;
    isConnectSource: boolean;
    isInvalidTarget: boolean;
    onPointerDown: (e: PointerEvent) => void;
  }

  let { node, isSelected, isConnectSource, isInvalidTarget, onPointerDown }: Props = $props();
</script>

<div
  class="absolute select-none shadow-sm"
  style="left: {node.position.x}px; top: {node.position.y}px; z-index: 10;"
  data-node-id={node.id}
  onpointerdown={onPointerDown}
  onclick={(e) => e.stopPropagation()}
  role="button"
  tabindex="0"
  aria-label="{node.type} node {node.label}"
>
  {#if node.type === 'goroutine'}
    <div class="w-[140px] rounded-xl border {isInvalidTarget ? 'border-red-500 bg-red-950/40 shadow-[0_0_0_3px_rgba(239,68,68,0.4)] animate-pulse' : isConnectSource ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : isSelected ? 'border-emerald-500/60 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' : 'border-zinc-700'} bg-zinc-900/95 backdrop-blur-sm p-3 transition-colors hover:border-zinc-600">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Network class="h-3.5 w-3.5" />
        </div>
        <span class="text-[11px] font-bold font-mono text-zinc-100 truncate">{node.label}</span>
      </div>
      <div class="flex items-center justify-between text-[10px] font-mono">
        <span class="text-zinc-500">G{node.goid}</span>
        <span class="px-1.5 py-0.5 rounded-full {node.status === '_Grunning' ? 'bg-emerald-500/15 text-emerald-400' : node.status === '_Gwaiting' ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'} border border-current/20">
          {node.status.replace('_G', '')}
        </span>
      </div>
    </div>
  {:else if node.type === 'channel'}
    <div class="w-[140px] rounded-xl border {isInvalidTarget ? 'border-red-500 bg-red-950/40 shadow-[0_0_0_3px_rgba(239,68,68,0.4)] animate-pulse' : isConnectSource ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : isSelected ? 'border-cyan-500/60 shadow-[0_0_0_2px_rgba(6,182,212,0.2)]' : 'border-zinc-700'} bg-zinc-900/95 backdrop-blur-sm p-3 transition-colors hover:border-zinc-600">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          <Database class="h-3.5 w-3.5" />
        </div>
        <span class="text-[11px] font-bold font-mono text-zinc-100 truncate">{node.label}</span>
      </div>
      <div class="flex items-center gap-1">
        {#each Array(Math.max(node.capacity, 1)) as _, i}
          <div class="h-1.5 flex-1 rounded-full {i < node.values.length ? 'bg-cyan-500' : 'bg-zinc-700'}"></div>
        {/each}
      </div>
      <div class="mt-1.5 text-[10px] font-mono text-zinc-500 flex justify-between">
        <span>{node.values.length}/{node.capacity}</span>
        {#if node.closed}<span class="text-red-400">closed</span>{/if}
      </div>
    </div>
  {:else if node.type === 'mutex'}
    <div class="w-[140px] rounded-xl border {isInvalidTarget ? 'border-red-500 bg-red-950/40 shadow-[0_0_0_3px_rgba(239,68,68,0.4)] animate-pulse' : isConnectSource ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : isSelected ? 'border-amber-500/60 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]' : 'border-zinc-700'} bg-zinc-900/95 backdrop-blur-sm p-3 transition-colors hover:border-zinc-600">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
          <Lock class="h-3.5 w-3.5" />
        </div>
        <span class="text-[11px] font-bold font-mono text-zinc-100 truncate">{node.label}</span>
      </div>
      <div class="text-[10px] font-mono text-zinc-500 flex justify-between">
        <span class={node.locked ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
          {node.locked ? 'LOCKED' : 'UNLOCKED'}
        </span>
        {#if node.waitersCount > 0}
          <span class="text-amber-400">{node.waitersCount} waiters</span>
        {/if}
      </div>
    </div>
  {:else if node.type === 'waitgroup'}
    <div class="w-[140px] rounded-xl border {isInvalidTarget ? 'border-red-500 bg-red-950/40 shadow-[0_0_0_3px_rgba(239,68,68,0.4)] animate-pulse' : isConnectSource ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : isSelected ? 'border-blue-500/60 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-zinc-700'} bg-zinc-900/95 backdrop-blur-sm p-3 transition-colors hover:border-zinc-600">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
          <Users class="h-3.5 w-3.5" />
        </div>
        <span class="text-[11px] font-bold font-mono text-zinc-100 truncate">{node.label}</span>
      </div>
      <div class="text-[10px] font-mono text-zinc-500 flex justify-between">
        <span>cnt: <span class="text-blue-400 font-bold">{node.counter}</span></span>
        <span>wait: <span class="text-zinc-300">{node.waiterCount}</span></span>
      </div>
    </div>
  {:else if node.type === 'select'}
    <div class="w-[140px] rounded-xl border {isInvalidTarget ? 'border-red-500 bg-red-950/40 shadow-[0_0_0_3px_rgba(239,68,68,0.4)] animate-pulse' : isConnectSource ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : isSelected ? 'border-purple-500/60 shadow-[0_0_0_2px_rgba(168,85,247,0.2)]' : 'border-zinc-700'} bg-zinc-900/95 backdrop-blur-sm p-3 transition-colors hover:border-zinc-600">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
          <Shuffle class="h-3.5 w-3.5" />
        </div>
        <span class="text-[11px] font-bold font-mono text-zinc-100 truncate">{node.label}</span>
      </div>
      <div class="text-[10px] font-mono text-zinc-500">
        {node.cases.length} cases
      </div>
    </div>
  {/if}
</div>