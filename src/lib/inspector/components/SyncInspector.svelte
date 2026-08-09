<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { Shield, Flame, Users, Network } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let mutexes = $derived(snapshot?.mutexes ? Object.values(snapshot.mutexes) : []);
  let waitGroups = $derived(snapshot?.waitGroups ? Object.values(snapshot.waitGroups) : []);
  let semaRoot = $derived(snapshot?.semaRoot);
</script>

{#if mutexes.length > 0 || waitGroups.length > 0}
  <div class="space-y-6">
    <!-- Mutexes section -->
    {#each mutexes as mu (mu.address)}
      <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
        <div class="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
              <Shield class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-mono text-lg font-bold text-slate-100">sync.Mutex ({mu.name})</h2>
              <p class="text-xs font-mono text-slate-400">
                Address: <span class="text-amber-400/90">{mu.address}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            {#if mu.starving}
              <span class="flex items-center gap-1 rounded bg-red-500/20 px-2.5 py-1 font-mono text-xs text-red-400 border border-red-500/40 animate-pulse font-bold">
                <Flame class="h-3.5 w-3.5 text-red-400" /> STARVING MODE
              </span>
            {/if}
            <span class="rounded px-2.5 py-1 font-mono text-xs border
              {mu.locked ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 font-bold' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}">
              state.locked: {mu.locked ? '1 (LOCKED)' : '0 (UNLOCKED)'}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 font-mono text-xs mb-4">
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">mutexWoken</span>
            <span class="text-slate-200 font-bold">{mu.woken ? '1' : '0'}</span>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">mutexStarving</span>
            <span class="text-slate-200 font-bold">{mu.starving ? '1' : '0'}</span>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">waiterShift (waiters)</span>
            <span class="text-amber-400 font-bold">{mu.waitersCount}</span>
          </div>
        </div>
      </div>
    {/each}

    <!-- WaitGroups section -->
    {#each waitGroups as wg (wg.address)}
      <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
        <div class="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <Users class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-mono text-lg font-bold text-slate-100">sync.WaitGroup ({wg.name})</h2>
              <p class="text-xs font-mono text-slate-400">Address: {wg.address}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 font-mono text-xs">
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">counter (high 32-bits)</span>
            <span class="text-lg font-bold text-blue-400">{wg.counter}</span>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">waiterCount (low 32-bits)</span>
            <span class="text-lg font-bold text-slate-200">{wg.waiterCount}</span>
          </div>
        </div>
      </div>
    {/each}

    <!-- Runtime semaRoot visualization -->
    {#if semaRoot}
      <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
        <div class="mb-3 flex items-center gap-3 border-b border-slate-800 pb-3">
          <Network class="h-5 w-5 text-purple-400" />
          <h2 class="font-mono text-sm font-bold text-slate-200">runtime.semaRoot Wait Queue</h2>
        </div>
        {#if semaRoot.waiters.length > 0}
          <div class="flex flex-wrap gap-2 font-mono text-xs">
            {#each semaRoot.waiters as waiter}
              <span class="rounded bg-purple-950/40 border border-purple-500/30 px-3 py-1 text-purple-300">
                G{waiter.goid} (sema: {waiter.elemAddr.slice(0, 10)}...)
              </span>
            {/each}
          </div>
        {:else}
          <p class="font-mono text-xs text-slate-600 italic">semaRoot treap is empty (no parked goroutines on semaphores)</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}
