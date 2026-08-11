<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { i18n } from '../../i18n/i18n.svelte';
  import { Cpu, Server, Layers, Activity } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let processors = $derived(snapshot ? Object.values(snapshot.processors) : []);
  let goroutines = $derived(snapshot ? Object.values(snapshot.goroutines) : []);
  let grq = $derived(snapshot?.sched.grq ?? []);

  function getStatusBadge(status: string) {
    switch (status) {
      case '_Grunning': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case '_Grunnable': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
      case '_Gwaiting': return 'border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-300';
      default: return 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400';
    }
  }
</script>

{#if snapshot}
  <div class="glow-card p-6 space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
          <Cpu class="h-5 w-5" />
        </div>
        <div>
          <h2 class="font-mono text-lg font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.scheduler.title')}</h2>
          <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400">{i18n.t('inspector.scheduler.subtitle')}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-mono border border-zinc-200 dark:border-zinc-800">
        <Layers class="h-4 w-4 text-purple-500 dark:text-purple-400" />
        <span class="text-zinc-500 dark:text-zinc-400">{i18n.t('inspector.scheduler.grq')}:</span>
        <span class="text-purple-500 dark:text-purple-400 font-bold">[{grq.join(', ')}]</span>
      </div>
    </div>

    <!-- Processors Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each processors as p}
        <div class="inner-card p-4 space-y-3 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span class="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
              <Server class="h-4 w-4" /> {i18n.t('inspector.scheduler.processor')} P{p.id}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              {p.status} | ticks: {p.schedtick}
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
              <span class="text-zinc-500 dark:text-zinc-400 text-[11px]">{i18n.t('inspector.scheduler.runnext')}:</span>
              {#if p.runnext !== undefined}
                <span class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30 text-[11px]">
                  G{p.runnext}
                </span>
              {:else}
                <span class="text-zinc-400 dark:text-zinc-500 italic">nil</span>
              {/if}
            </div>

            <div class="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800">
              <span class="text-zinc-500 dark:text-zinc-400 text-[11px] block mb-1.5">{i18n.t('inspector.scheduler.lrq')}:</span>
              {#if p.runq.length > 0}
                <div class="flex flex-wrap gap-1.5">
                  {#each p.runq as goid}
                    <span class="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                      G{goid}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-zinc-400 dark:text-zinc-500 italic text-[11px]">queue empty</span>
              {/if}
            </div>
          </div>

          <div class="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span class="text-zinc-500 dark:text-zinc-400">{i18n.t('inspector.scheduler.boundThread')}:</span>
            {#if p.m !== undefined}
              <span class="text-emerald-600 dark:text-emerald-400 font-bold">M{p.m}</span>
            {:else}
              <span class="text-zinc-400 dark:text-zinc-500">unbound</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Goroutines -->
    <div class="border-t border-zinc-200 dark:border-zinc-800 pt-4">
      <h3 class="font-mono text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Activity class="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> {i18n.t('inspector.scheduler.goroutineLifecycle')}
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {#each goroutines as g}
          <div class="inner-card p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-zinc-900 dark:text-white">G{g.goid}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] border {getStatusBadge(g.status)}">
                {g.status}
              </span>
            </div>

            <div class="text-[10px] text-zinc-500 dark:text-zinc-400 space-y-0.5 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div>stack.hi: <span class="text-zinc-700 dark:text-zinc-300">{g.stack.hi}</span></div>
              <div>stack.sp: <span class="text-amber-600 dark:text-amber-400">{g.stack.sp}</span></div>
              <div>stack.lo: <span class="text-zinc-700 dark:text-zinc-300">{g.stack.lo}</span></div>
            </div>

            {#if g.waitReason}
              <div class="text-[10px] text-amber-500/80 dark:text-amber-400/80 italic">
                {i18n.t('inspector.scheduler.parkReason')}: {g.waitReason}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
