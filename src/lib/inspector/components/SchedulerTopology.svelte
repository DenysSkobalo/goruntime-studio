<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { Cpu, Server, Layers, Activity, ArrowRight, Zap } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let processors = $derived(snapshot ? Object.values(snapshot.processors) : []);
  let machines = $derived(snapshot ? Object.values(snapshot.machines) : []);
  let goroutines = $derived(snapshot ? Object.values(snapshot.goroutines) : []);
  let grq = $derived(snapshot?.sched.grq ?? []);

  function getStatusBadge(status: string) {
    switch (status) {
      case '_Grunning': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case '_Grunnable': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case '_Gwaiting': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }
</script>

{#if snapshot}
  <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md space-y-6">
    <!-- Component Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20">
          <Cpu class="h-5 w-5" />
        </div>
        <div>
          <h2 class="font-mono text-lg font-bold text-slate-100">GMP Scheduler Topology</h2>
          <p class="text-xs font-mono text-slate-400">
            Internal Go Runtime Scheduler (`src/runtime/proc.go`)
          </p>
        </div>
      </div>

      <!-- Global Run Queue Status -->
      <div class="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-mono border border-slate-800">
        <Layers class="h-4 w-4 text-purple-400" />
        <span class="text-slate-400">GRQ:</span>
        <span class="text-purple-400 font-bold">[{grq.join(', ')}]</span>
      </div>
    </div>

    <!-- Processors (P) and Threads (M) Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each processors as p}
        <div class="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span class="text-cyan-400 font-bold flex items-center gap-1.5">
              <Server class="h-4 w-4" /> Processor P{p.id}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {p.status} | ticks: {p.schedtick}
            </span>
          </div>

          <!-- P's execution slots -->
          <div class="space-y-2">
            <!-- runnext High-Priority Slot -->
            <div class="flex items-center justify-between rounded bg-slate-900/80 p-2 border border-slate-800">
              <span class="text-slate-500 text-[11px]">runnext (fast-path):</span>
              {#if p.runnext !== undefined}
                <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  G{p.runnext}
                </span>
              {:else}
                <span class="text-slate-700 italic">nil</span>
              {/if}
            </div>

            <!-- Local Run Queue (LRQ) -->
            <div class="rounded bg-slate-900/40 p-2 border border-slate-800/60">
              <span class="text-slate-500 text-[11px] block mb-1.5">LRQ (Local Run Queue - max 256):</span>
              {#if p.runq.length > 0}
                <div class="flex flex-wrap gap-1.5">
                  {#each p.runq as goid}
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      G{goid}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-slate-700 italic text-[11px]">queue empty</span>
              {/if}
            </div>
          </div>

          <!-- M Binding -->
          <div class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span class="text-slate-500">Bound Thread (M):</span>
            {#if p.m !== undefined}
              <span class="text-emerald-400 font-bold">M{p.m}</span>
            {:else}
              <span class="text-slate-600">unbound</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Active Goroutines Lifecycle List -->
    <div class="border-t border-slate-800 pt-4">
      <h3 class="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Activity class="h-4 w-4 text-emerald-400" /> Goroutine Lifecycle & Stack Inspector
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {#each goroutines as g}
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-200">G{g.goid}</span>
              <span class="px-2 py-0.5 rounded text-[10px] border {getStatusBadge(g.status)}">
                {g.status}
              </span>
            </div>

            <!-- Stack Frame Boundaries -->
            <div class="text-[10px] text-slate-500 space-y-0.5 bg-slate-900/60 p-2 rounded border border-slate-800/40">
              <div>stack.hi: <span class="text-slate-400">{g.stack.hi}</span></div>
              <div>stack.sp: <span class="text-amber-400/90">{g.stack.sp}</span></div>
              <div>stack.lo: <span class="text-slate-400">{g.stack.lo}</span></div>
            </div>

            {#if g.waitReason}
              <div class="text-[10px] text-amber-400/80 italic">
                park reason: {g.waitReason}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
