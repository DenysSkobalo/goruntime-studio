<script lang="ts">
  import { onMount } from 'svelte';
  import { timeline } from './state/timeline.svelte';
  import { i18n } from '../i18n/i18n.svelte';
  import HChanInspector from './components/HChanInspector.svelte';
  import SchedulerTopology from './components/SchedulerTopology.svelte';
  import SelectInspector from './components/SelectInspector.svelte';
  import SyncInspector from './components/SyncInspector.svelte';
  import ContextInspector from './components/ContextInspector.svelte';
  import { RotateCcw, SkipBack, SkipForward } from 'lucide-svelte';

  let capacityInput = $state(2);

  onMount(() => {
    timeline.init(capacityInput);
  });

  function handleReinit() {
    timeline.init(capacityInput);
  }
</script>

<div class="mx-auto max-w-6xl space-y-6">
  <!-- Header + Timeline Controls -->
  <div class="glow-card p-5 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.title')}</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{i18n.t('inspector.description')}</p>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-3 font-mono text-xs">
        <span class="text-zinc-500 dark:text-zinc-400 px-1">{i18n.t('inspector.controls.capacity')}:</span>
        <input
          type="number"
          min="0"
          max="8"
          bind:value={capacityInput}
          class="w-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-1 py-1 text-center text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
        />
        <button
          onclick={handleReinit}
          class="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
          title={i18n.t('inspector.controls.reinit')}
        >
          <RotateCcw class="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        disabled={!timeline.canStepBackward}
        onclick={() => timeline.stepBackward()}
        class="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs"
      >
        <SkipBack class="h-3.5 w-3.5" /> {i18n.t('inspector.timeline.previous')}
      </button>

      <div class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
        <span>{i18n.t('inspector.timeline.step')}:</span>
        <span class="rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-bold text-zinc-900 dark:text-white">
          {timeline.currentIndex}
        </span>
        <span class="text-zinc-400 dark:text-zinc-500">/ {timeline.snapshots.length - 1}</span>
      </div>

      <button
        disabled={!timeline.canStepForward}
        onclick={() => timeline.stepForward()}
        class="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs"
      >
        {i18n.t('inspector.timeline.next')} <SkipForward class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>

  <!-- Visualizers Stack -->
  <div class="space-y-6">
    <SchedulerTopology />
    <SelectInspector />
    <HChanInspector />
    <SyncInspector />
    <ContextInspector />

    {#if timeline.currentSnapshot}
      <div class="glow-card p-5 font-mono text-xs space-y-2">
        <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">
            {i18n.t('inspector.timeline.step')} {timeline.currentSnapshot.step}: {timeline.currentSnapshot.action}
          </span>
          <span>
            {i18n.t('inspector.timeline.snapshot')} {timeline.currentIndex + 1} {i18n.t('inspector.timeline.of')} {timeline.snapshots.length}
          </span>
        </div>
        <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
          {timeline.currentSnapshot.explanation}
        </p>
      </div>
    {/if}
  </div>
</div>
