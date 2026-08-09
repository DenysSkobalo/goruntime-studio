<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { Shuffle, Lock, CheckCircle2, Clock } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let selectState = $derived(snapshot?.selectState);
</script>

{#if selectState}
  <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
          <Shuffle class="h-5 w-5" />
        </div>
        <div>
          <h2 class="font-mono text-lg font-bold text-slate-100">runtime.selectgo Multiplexer</h2>
          <p class="text-xs font-mono text-slate-400">
            Multi-channel evaluation & two-phase registration
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border
        {selectState.isBlocked ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}">
        {#if selectState.isBlocked}
          <Clock class="h-3.5 w-3.5 animate-pulse" />
          <span>Status: WAITING (_Gwaiting)</span>
        {:else}
          <CheckCircle2 class="h-3.5 w-3.5" />
          <span>Status: EXECUTED (Case #{selectState.chosenCaseIndex})</span>
        {/if}
      </div>
    </div>

    <!-- Orders Grid -->
    <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Poll Order -->
      <div class="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
        <div class="mb-2 flex items-center justify-between text-slate-400">
          <span class="font-semibold text-purple-400">pollorder (Random Permutation)</span>
          <span class="text-[10px] text-slate-500">fastrand()</span>
        </div>
        <div class="flex gap-2">
          {#each selectState.pollOrder as caseIdx}
            <span class="rounded bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 text-purple-300 font-bold">
              case {caseIdx} ({selectState.cases[caseIdx]?.chanName})
            </span>
          {/each}
        </div>
      </div>

      <!-- Lock Order -->
      <div class="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
        <div class="mb-2 flex items-center justify-between text-slate-400">
          <span class="font-semibold text-amber-400">lockorder (Address Sorted)</span>
          <span class="text-[10px] text-slate-500">Deadlock Avoidance</span>
        </div>
        <div class="flex gap-2">
          {#each selectState.lockOrder as caseIdx}
            {@const c = selectState.cases[caseIdx]}
            <span class="rounded bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-bold">
              {c.chanName} [{c.chanAddr.slice(0, 8)}...]
            </span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Active Cases -->
    <div class="space-y-2 font-mono text-xs">
      <span class="text-slate-400 font-semibold block mb-2">Evaluated Scases (`scase` array):</span>
      {#each selectState.cases as c, idx}
        {@const isChosen = selectState.chosenCaseIndex === idx}
        <div class="flex items-center justify-between rounded-lg border p-3 transition-all
          {isChosen 
            ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200' 
            : 'border-slate-800 bg-slate-950/60 text-slate-400'}">
          <div class="flex items-center gap-3">
            <span class="rounded px-2 py-0.5 text-[10px] font-bold border
              {c.kind === 'caseRecv' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 
               c.kind === 'caseSend' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 
               'border-slate-700 bg-slate-800 text-slate-300'}">
              {c.kind}
            </span>
            <span class="text-slate-200 font-bold">{c.chanName}</span>
            <span class="text-slate-500 text-[11px]">({c.chanAddr})</span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[11px] {c.ready ? 'text-emerald-400' : 'text-slate-600'}">
              ready: {c.ready}
            </span>
            {#if isChosen}
              <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/40 font-bold">
                CHOSEN
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
