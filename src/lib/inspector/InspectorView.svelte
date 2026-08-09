<script lang="ts">
  import { onMount } from 'svelte';
  import { timeline } from './state/timeline.svelte';
  import HChanInspector from './components/HChanInspector.svelte';
  import SchedulerTopology from './components/SchedulerTopology.svelte';
  import SelectInspector from './components/SelectInspector.svelte';
  import SyncInspector from './components/SyncInspector.svelte';
  import ContextInspector from './components/ContextInspector.svelte';
  import { 
    spawnGoroutine, 
    scheduleTick, 
    triggerWorkSteal, 
    stepSelect,
    stepMutexLock,
    stepMutexUnlock,
    stepWGAdd,
    stepWGWait,
    stepContextCancel
  } from '../engine/core';
  import { 
    Send, 
    Download, 
    PowerOff, 
    RotateCcw, 
    SkipBack, 
    SkipForward, 
    Plus, 
    Play, 
    GitFork,
    Lock,
    Unlock,
    Users,
    XCircle
  } from 'lucide-svelte';

  let inputVal = $state('payload');
  let capacityInput = $state(2);

  onMount(() => {
    timeline.init(capacityInput);
  });

  function handleReinit() {
    timeline.init(capacityInput);
  }

  function handleSpawn() {
    if (!timeline.currentSnapshot) return;
    const next = spawnGoroutine(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }

  function handleSchedule() {
    if (!timeline.currentSnapshot) return;
    const next = scheduleTick(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }

  function handleSelect() {
    if (!timeline.currentSnapshot) return;
    const next = stepSelect(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }

  function handleMutexLock() {
    if (!timeline.currentSnapshot) return;
    const next = stepMutexLock(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }

  function handleMutexUnlock() {
    if (!timeline.currentSnapshot) return;
    const next = stepMutexUnlock(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }

  function handleWGAdd() {
    if (!timeline.currentSnapshot) return;
    const next = stepWGAdd(timeline.currentSnapshot, 1);
    timeline.pushSnapshot(next);
  }

  function handleWGWait() {
    if (!timeline.currentSnapshot) return;
    const next = stepWGWait(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }

  function handleCancelContext() {
    if (!timeline.currentSnapshot) return;
    const next = stepContextCancel(timeline.currentSnapshot);
    timeline.pushSnapshot(next);
  }
</script>

<div class="mx-auto max-w-6xl space-y-6">
  <!-- Controls Bar -->
  <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
    <div class="flex items-center gap-1 border-r border-slate-800 pr-3 font-mono text-xs">
      <span class="text-slate-500 px-1">cap:</span>
      <input 
        type="number" 
        min="0" 
        max="8" 
        bind:value={capacityInput}
        class="w-10 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center text-cyan-400 focus:outline-none focus:border-cyan-500" 
      />
      <button 
        onclick={handleReinit}
        class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
        title="Re-initialize state"
      >
        <RotateCcw class="h-3.5 w-3.5" />
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button onclick={() => timeline.send(inputVal)} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold transition">
        <Send class="h-3.5 w-3.5" /> ch &lt;- val
      </button>
      <button onclick={() => timeline.receive()} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition">
        <Download class="h-3.5 w-3.5" /> &lt;-ch
      </button>
      <button onclick={() => timeline.close()} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-mono text-xs font-semibold transition">
        <PowerOff class="h-3.5 w-3.5" /> close
      </button>
      
      <div class="h-4 w-[1px] bg-slate-800 mx-1"></div>

      <button onclick={handleSpawn} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold transition">
        <Plus class="h-3.5 w-3.5" /> go func()
      </button>
      <button onclick={handleSchedule} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition">
        <Play class="h-3.5 w-3.5" /> schedule()
      </button>
      <button onclick={handleSelect} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold transition">
        <GitFork class="h-3.5 w-3.5" /> selectgo
      </button>

      <div class="h-4 w-[1px] bg-slate-800 mx-1"></div>

      <button onclick={handleMutexLock} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-semibold transition">
        <Lock class="h-3.5 w-3.5" /> mu.Lock()
      </button>
      <button onclick={handleMutexUnlock} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-mono text-xs font-semibold transition">
        <Unlock class="h-3.5 w-3.5" /> mu.Unlock()
      </button>
      <button onclick={handleWGAdd} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold transition">
        <Users class="h-3.5 w-3.5" /> wg.Add(1)
      </button>
      <button onclick={handleWGWait} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-mono text-xs font-semibold transition">
        wg.Wait()
      </button>
      <button onclick={handleCancelContext} class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-semibold transition">
        <XCircle class="h-3.5 w-3.5" /> cancel()
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
      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-5 font-mono text-xs space-y-2">
        <div class="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
          <span class="text-cyan-400 font-bold">Step {timeline.currentSnapshot.step}: {timeline.currentSnapshot.action}</span>
          <span>Snapshot {timeline.currentIndex + 1} of {timeline.snapshots.length}</span>
        </div>
        <p class="text-slate-300 leading-relaxed pt-1">
          {timeline.currentSnapshot.explanation}
        </p>
      </div>
    {/if}

    <!-- Timeline Bar -->
    <div class="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-xl font-mono text-xs">
      <button 
        disabled={!timeline.canStepBackward}
        onclick={() => timeline.stepBackward()}
        class="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
      >
        <SkipBack class="h-3.5 w-3.5" /> Previous Step
      </button>

      <div class="flex items-center gap-2 text-slate-400">
        <span>Timeline Step:</span>
        <span class="text-white font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
          {timeline.currentIndex}
        </span>
      </div>

      <button 
        disabled={!timeline.canStepForward}
        onclick={() => timeline.stepForward()}
        class="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
      >
        Next Step <SkipForward class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</div>
