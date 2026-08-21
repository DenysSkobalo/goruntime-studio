<script lang="ts">
  import { Shuffle, Lock, CircleCheck, Clock } from 'lucide-svelte';
  import { timeline } from '../model/timeline.store.svelte';
  import { i18n } from '$core/i18n';

  let snapshot = $derived(timeline.currentSnapshot);
  let selectState = $derived(snapshot?.selectState);
</script>

{#if selectState}
  <div class="glow-card p-6 animate-fade-in">
    <div class="mb-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Shuffle class="h-5 w-5" />
        </div>
        <div>
          <h2 class="font-mono text-lg font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.select.title')}</h2>
          <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400">{i18n.t('inspector.select.subtitle')}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border
        {selectState.isBlocked ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">
        {#if selectState.isBlocked}
          <Clock class="h-3.5 w-3.5 animate-pulse" />
          <span>{i18n.t('inspector.select.statusWaiting')}</span>
        {:else}
          <CircleCheck class="h-3.5 w-3.5" />
          <span>{i18n.t('inspector.select.statusExecuted', { index: selectState.chosenCaseIndex ?? '-' })}</span>
        {/if}
      </div>
    </div>

    <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="inner-card p-4 font-mono text-xs">
        <div class="mb-2 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span class="font-bold text-purple-600 dark:text-purple-400">{i18n.t('inspector.select.pollOrder')}</span>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500">{i18n.t('inspector.select.pollOrderHint')}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each selectState.pollOrder as caseIdx}
            <span class="rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-purple-600 dark:text-purple-300 font-bold">
              case {caseIdx} ({selectState.cases[caseIdx]?.chanName})
            </span>
          {/each}
        </div>
      </div>

      <div class="inner-card p-4 font-mono text-xs">
        <div class="mb-2 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span class="font-bold text-amber-600 dark:text-amber-400">{i18n.t('inspector.select.lockOrder')}</span>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500">{i18n.t('inspector.select.lockOrderHint')}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each selectState.lockOrder as caseIdx}
            {@const c = selectState.cases[caseIdx]}
            <span class="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-amber-600 dark:text-amber-300 font-bold">
              {c.chanName} [{c.chanAddr.slice(0, 8)}...]
            </span>
          {/each}
        </div>
      </div>
    </div>

    <div class="space-y-2 font-mono text-xs">
      <span class="text-zinc-500 dark:text-zinc-400 font-bold block mb-2">{i18n.t('inspector.select.cases')}</span>
      {#each selectState.cases as c, idx}
        {@const isChosen = selectState.chosenCaseIndex === idx}
        <div class="flex items-center justify-between rounded-xl border p-3 transition-all
          {isChosen ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-200' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400'}">
          <div class="flex items-center gap-3">
            <span class="rounded-full px-2 py-0.5 text-[10px] font-bold border
              {c.kind === 'caseRecv' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' :
               c.kind === 'caseSend' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
               'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'}">
              {i18n.t(`inspector.select.${c.kind}`)}
            </span>
            <span class="text-zinc-900 dark:text-white font-bold">{c.chanName}</span>
            <span class="text-zinc-400 dark:text-zinc-500 text-[11px]">({c.chanAddr})</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[11px] {c.ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}">
              {i18n.t('inspector.select.ready')}: {c.ready}
            </span>
            {#if isChosen}
              <span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 font-bold">
                {i18n.t('inspector.select.chosen')}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
