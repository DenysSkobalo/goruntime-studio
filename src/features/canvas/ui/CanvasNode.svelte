<script lang="ts">
  import { Network, Database } from '@lucide/svelte';
  import type { CanvasNode, ChannelNode, GoroutineNode } from '$shared/types/nodes';

  interface Props {
    node: CanvasNode;
    isSelected: boolean;
    isConnectSource: boolean;
    isValidTarget: boolean;
    isInvalidTarget: boolean;
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
  }

  let {
    node,
    isSelected,
    isConnectSource,
    isValidTarget,
    isInvalidTarget,
    onPointerDown,
    onPointerUp,
  }: Props = $props();

  const isGoroutine = $derived(node.type === 'goroutine');

  const cardStyle = $derived.by(() => {
    if (isInvalidTarget) {
      return 'border-rose-500/80 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.4)] opacity-60 cursor-not-allowed';
    }
    if (isValidTarget) {
      return isGoroutine
        ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.4)] animate-pulse'
        : 'border-cyan-400 shadow-[0_0_0_3px_rgba(6,182,212,0.4)] animate-pulse';
    }
    if (isConnectSource) {
      return 'border-amber-400 shadow-[0_0_0_3px_rgba(245,158,11,0.35)] animate-pulse';
    }
    if (isSelected) {
      return isGoroutine
        ? 'border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
        : 'border-cyan-400 shadow-[0_0_0_2px_rgba(6,182,212,0.5),0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/50';
    }
    return isGoroutine
      ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]'
      : 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)]';
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<div
  class="absolute top-0 left-0 select-none cursor-grab active:cursor-grabbing"
  style="transform: translate3d({node.position.x}px, {node.position.y}px, 0); z-index: 10;"
  data-node-id={node.id}
  onpointerdown={onPointerDown}
  onpointerup={onPointerUp}
  onclick={(e) => e.stopPropagation()}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <div
    class="w-[145px] rounded-xl border {cardStyle} bg-zinc-900/95 backdrop-blur-md p-3 font-mono transition-[border-color,box-shadow,background-color] duration-150"
  >
    <div class="flex items-center gap-2 mb-2">
      <div
        class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 {isGoroutine
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}"
      >
        {#if isGoroutine}
          <Network class="h-3.5 w-3.5" />
        {:else}
          <Database class="h-3.5 w-3.5" />
        {/if}
      </div>
      <span class="text-[11px] font-bold text-zinc-100 truncate">{node.label}</span>
    </div>

    {#if isGoroutine}
      {@const g = node as GoroutineNode}
      <div class="flex items-center justify-between text-[10px]">
        <span class="text-zinc-500">G{g.goid}</span>
        <span
          class="px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold"
        >
          {g.status.replace('_G', '')}
        </span>
      </div>
    {:else}
      {@const ch = node as ChannelNode}
      {#if ch.capacity <= 6}
        <div class="flex items-center gap-1 mt-1">
          {#each Array(Math.max(ch.capacity, 1)) as _, i}
            <div
              class="h-1.5 flex-1 rounded-full transition-colors duration-150 {i < ch.values.length
                ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                : 'bg-zinc-800 border border-zinc-700/50'}"
            ></div>
          {/each}
        </div>
      {:else}
        <div class="space-y-1 mt-1">
          <div
            class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-zinc-700/50"
          >
            <div
              class="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_6px_rgba(6,182,212,0.6)]"
              style="width: {(ch.values.length / ch.capacity) * 100}%"
            ></div>
          </div>
          <div class="flex justify-between items-center text-[9px] font-bold">
            <span class="text-zinc-500 font-mono">buf</span>
            <span class="text-cyan-400 font-mono">{ch.values.length}/{ch.capacity}</span>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
