<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { canvasStore } from '../../canvas/state/canvas.svelte';
  import { i18n } from '../../i18n/i18n.svelte';
  import { Cpu, Server, Activity, Layers } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  
  let canvasGoroutines = $derived(
    canvasStore.nodes.filter(n => n.type === 'goroutine')
  );

  let processors = $derived(snapshot ? Object.values(snapshot.processors) : []);
  let grq = $derived(snapshot?.sched.grq ?? []);

  function getStatusBadge(status: string) {
    switch (status) {
      case '_Grunning': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case '_Grunnable': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
      case '_Gwaiting': return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      default: return 'border-zinc-800 bg-zinc-900 text-zinc-400';
    }
  }
</script>

<div class="space-y-4 font-mono text-xs animate-fade-in">
  <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
    <div class="flex items-center gap-2">
      <div class="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
        <Cpu class="h-4 w-4" />
      </div>
      <div>
        <h2 class="font-bold text-zinc-100">{i18n.t('inspector.scheduler.title')}</h2>
        <p class="text-[10px] text-zinc-400">Synced with Canvas Engine</p>
      </div>
    </div>

    <div class="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1 border border-zinc-800 text-[11px]">
      <Layers class="h-3.5 w-3.5 text-purple-400" />
      <span class="text-zinc-400">GRQ:</span>
      <span class="text-purple-400 font-bold">[{grq.join(', ')}]</span>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-3">
    {#each processors as p}
      <div class="inner-card p-3 space-y-2">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-1.5">
          <span class="text-cyan-400 font-bold flex items-center gap-1.5 text-[11px]">
            <Server class="h-3.5 w-3.5" /> Processor P{p.id}
          </span>
          <span class="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            {p.status} | ticks: {p.schedtick}
          </span>
        </div>

        <div class="space-y-1.5 text-[10px]">
          <div class="flex items-center justify-between rounded bg-zinc-950 p-1.5 border border-zinc-800/60">
            <span class="text-zinc-400">runnext:</span>
            {#if p.runnext !== undefined}
              <span class="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30">
                G{p.runnext}
              </span>
            {:else}
              <span class="text-zinc-500 italic">nil</span>
            {/if}
          </div>

          <div class="rounded bg-zinc-950 p-1.5 border border-zinc-800/60">
            <span class="text-zinc-400 block mb-1">LRQ (Local Run Queue):</span>
            {#if p.runq.length > 0}
              <div class="flex flex-wrap gap-1">
                {#each p.runq as goid}
                  <span class="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                    G{goid}
                  </span>
                {/each}
              </div>
            {:else}
              <span class="text-zinc-500 italic">queue empty</span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Canvas Synced Goroutines -->
  <div class="border-t border-zinc-800 pt-3">
    <h3 class="font-bold text-zinc-200 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
      <Activity class="h-3.5 w-3.5 text-emerald-400" /> Active Goroutines ({canvasGoroutines.length})
    </h3>

    <div class="grid grid-cols-1 gap-2">
      {#each canvasGoroutines as g}
        <div class="inner-card p-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-100 text-[11px]">{g.label}</span>
            <span class="text-zinc-500 text-[10px]">(G{(g as any).goid})</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[9px] border {getStatusBadge((g as any).status)}">
            {(g as any).status}
          </span>
        </div>
      {/each}
    </div>
  </div>
</div>