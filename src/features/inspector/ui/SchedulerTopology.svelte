<script lang="ts">
  import { Cpu, Network, Server, Layers, Zap } from 'lucide-svelte';
    import { timeline } from '../model/timeline.store.svelte';
    import { i18n } from '$core/i18n';

  let snapshot = $derived(timeline.currentSnapshot);

  let grq = $derived(snapshot?.sched.grq ?? []);
  let processors = $derived(snapshot ? Object.values(snapshot.processors) : []);
  let machinesMap = $derived(snapshot?.machines ?? {});
  let goroutinesMap = $derived(snapshot?.goroutines ?? {});
</script>

<div class="space-y-4 font-mono text-xs animate-fade-in">
  <!-- Global Run Queue (GRQ) -->
  <div class="glow-card p-4 space-y-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
    <div class="flex items-center justify-between">
      <span class="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
        <Network class="w-3.5 h-3.5 text-purple-500" />
        {i18n.t('inspector.scheduler.grq')} (Global Run Queue)
      </span>
      <span class="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
        {grq.length} elements
      </span>
    </div>

    <div class="flex flex-wrap gap-1.5 pt-1">
      {#if grq.length === 0}
        <span class="text-zinc-400 dark:text-zinc-500 italic text-[11px]">{i18n.t('inspector.hchan.queueEmpty')}</span>
      {:else}
        {#each grq as goid}
          <span class="rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-1 font-bold text-purple-600 dark:text-purple-300">
            G{goid}
          </span>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Active Processors (P) & Bound Machines (M) -->
  <div class="space-y-3">
    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
      <Server class="w-3.5 h-3.5 text-emerald-500" />
      <span>Logical Processors (P) & Threads (M)</span>
    </div>

    {#each processors as p (p.id)}
      {@const boundM = p.m !== undefined ? machinesMap[p.m] : undefined}
      {@const currentG = boundM?.curg !== undefined ? goroutinesMap[boundM.curg] : undefined}

      <div class="glow-card p-4 space-y-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 rounded-xl">
        <!-- Execution Pipeline: M -> P -> G -->
        <div class="flex items-center justify-between bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-purple-600 dark:text-purple-400">
              {boundM ? `M${boundM.id}` : 'M [unbound]'}
            </span>
            <span class="text-zinc-400">➔</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">P{p.id} ({p.status})</span>
          </div>

          {#if currentG}
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold">
              <Cpu class="w-3.5 h-3.5" />
              <span>G{currentG.goid} ({currentG.status})</span>
            </div>
          {:else}
            <span class="text-zinc-400 dark:text-zinc-500 italic text-[11px]">idle</span>
          {/if}
        </div>

        <!-- Fast-path Slot (runnext) & Local Run Queue (LRQ) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div class="inner-card p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1 font-semibold flex items-center gap-1">
              <Zap class="w-3 h-3 text-amber-500" /> {i18n.t('inspector.scheduler.runnext')}
            </span>
            {#if p.runnext !== undefined}
              <span class="font-bold text-amber-600 dark:text-amber-400">G{p.runnext}</span>
            {:else}
              <span class="text-zinc-400 dark:text-zinc-500 italic">empty</span>
            {/if}
          </div>

          <div class="inner-card p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1 font-semibold flex items-center gap-1">
              <Layers class="w-3 h-3 text-cyan-500" /> {i18n.t('inspector.scheduler.lrq')}
            </span>
            {#if p.runq.length === 0}
              <span class="text-zinc-400 dark:text-zinc-500 italic">empty</span>
            {:else}
              <div class="flex flex-wrap gap-1">
                {#each p.runq as lrqGoid}
                  <span class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold">
                    G{lrqGoid}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>