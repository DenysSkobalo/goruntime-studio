<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { Lock, Unlock, Database, ArrowDown, ArrowUp, CircleAlert } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let channels = $derived(snapshot ? Object.values(snapshot.channels) : []);
</script>

{#if channels.length > 0}
  <div class="space-y-6">
    {#each channels as hchan (hchan.address)}
      {@const hasBuffer = hchan.dataqsiz > 0}
      <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
              <Database class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-mono text-lg font-bold text-slate-100">runtime.hchan ({hchan.name})</h2>
              <p class="text-xs font-mono text-slate-400">
                Address: <span class="text-amber-400/90">{hchan.address}</span> (Heap Allocation)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border
              {hchan.closed ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-950 text-slate-400'}">
              <span class="h-2 w-2 rounded-full {hchan.closed ? 'bg-red-500 animate-ping' : 'bg-slate-600'}"></span>
              closed: {hchan.closed}
            </div>

            <div class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border transition-all duration-300
              {hchan.isLocked ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-950 text-emerald-400'}">
              {#if hchan.isLocked}
                <Lock class="h-3.5 w-3.5 animate-pulse text-amber-400" />
                <span>lock: LOCKED</span>
              {:else}
                <Unlock class="h-3.5 w-3.5 text-emerald-400" />
                <span>lock: UNLOCKED</span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">qcount (queued)</span>
            <span class="text-lg font-bold text-cyan-400">{hchan.qcount}</span>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">dataqsiz (capacity)</span>
            <span class="text-lg font-bold text-slate-200">{hchan.dataqsiz}</span>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">sendx (write index)</span>
            <span class="text-lg font-bold text-emerald-400">{hchan.sendx}</span>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span class="text-slate-500 block mb-1">recvx (read index)</span>
            <span class="text-lg font-bold text-indigo-400">{hchan.recvx}</span>
          </div>
        </div>

        <!-- Buffer Visualization -->
        <div class="mb-6">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Contiguous Ring Buffer (`hchan.buf`)
            </span>
            <span class="font-mono text-[11px] text-slate-500">
              elemsize: {hchan.elemsize} B
            </span>
          </div>

          {#if hasBuffer}
            <div 
              class="grid gap-3" 
              style="grid-template-columns: repeat({Math.max(hchan.dataqsiz, 1)}, minmax(0, 1fr));"
            >
              {#each hchan.buf as item, idx}
                <div class="relative flex flex-col items-center">
                  <div class="w-full rounded-lg border p-4 text-center font-mono transition-all duration-300 min-h-[72px] flex flex-col items-center justify-center
                    {item 
                      ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200 shadow-md shadow-cyan-950/50' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-600'}">
                    {#if item}
                      <span class="text-sm font-bold text-cyan-300">"{item.val}"</span>
                      <span class="text-[10px] text-slate-500 font-mono mt-1">{item.id}</span>
                    {:else}
                      <span class="text-xs text-slate-700 italic">nil</span>
                    {/if}
                  </div>

                  <span class="mt-1.5 font-mono text-[10px] text-slate-500">
                    buf[{idx}]
                  </span>

                  <div class="mt-1 flex gap-1">
                    {#if idx === hchan.sendx && hchan.qcount < hchan.dataqsiz}
                      <span class="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                        <ArrowDown class="h-2.5 w-2.5" /> sendx
                      </span>
                    {/if}
                    {#if idx === hchan.recvx && hchan.qcount > 0}
                      <span class="inline-flex items-center gap-0.5 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-indigo-400 border border-indigo-500/30">
                        <ArrowUp class="h-2.5 w-2.5" /> recvx
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="rounded-lg border border-dashed border-slate-800 bg-slate-950/30 p-4 text-center font-mono text-xs text-slate-500 flex items-center justify-center gap-2">
              <CircleAlert class="h-4 w-4 text-amber-500/70" />
              Unbuffered channel (dataqsiz == 0). Buffer array `buf` is nil. Direct stack-to-stack copy active.
            </div>
          {/if}
        </div>

        <!-- Wait Queues (sendq / recvq) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-5">
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="font-mono text-xs font-semibold text-emerald-400">
                sendq (Blocked Producers)
              </span>
              <span class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400 border border-emerald-500/20">
                {hchan.sendq.length} sudog
              </span>
            </div>

            {#if hchan.sendq.length > 0}
              <div class="space-y-2">
                {#each hchan.sendq as sudog}
                  <div class="flex items-center justify-between rounded border border-emerald-500/30 bg-emerald-950/20 p-2 font-mono text-xs">
                    <span class="text-emerald-300 font-bold">G{sudog.goid}</span>
                    <span class="text-slate-400">elem: <span class="text-slate-200">"{sudog.elem}"</span></span>
                    <span class="text-[10px] text-slate-500">{sudog.id}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="font-mono text-[11px] text-slate-600 italic">Queue is empty (waitq.first == nil)</p>
            {/if}
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="font-mono text-xs font-semibold text-indigo-400">
                recvq (Blocked Consumers)
              </span>
              <span class="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] text-indigo-400 border border-indigo-500/20">
                {hchan.recvq.length} sudog
              </span>
            </div>

            {#if hchan.recvq.length > 0}
              <div class="space-y-2">
                {#each hchan.recvq as sudog}
                  <div class="flex items-center justify-between rounded border border-indigo-500/30 bg-indigo-950/20 p-2 font-mono text-xs">
                    <span class="text-indigo-300 font-bold">G{sudog.goid}</span>
                    <span class="text-slate-400">target: <span class="text-slate-200">stack frame</span></span>
                    <span class="text-[10px] text-slate-500">{sudog.id}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="font-mono text-[11px] text-slate-600 italic">Queue is empty (waitq.first == nil)</p>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
