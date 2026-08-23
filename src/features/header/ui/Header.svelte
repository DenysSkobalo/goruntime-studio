<script lang="ts">
  import { Activity, RotateCcw, SkipBack, Play, Pause, SkipForward, Layers, Settings } from 'lucide-svelte';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';
  import { stackModalStore } from '$shared/stores/stack-modal.store.svelte';
  import { settingsStore } from '$shared/stores/settings.store.svelte';
  import { i18n } from '$core/i18n';

  let selectedGoroutine = $derived.by(() => {
    const node = canvasStore.getNode(canvasStore.selectedNodeId);
    return node && node.type === 'goroutine' ? node : null;
  });

  function handleReinit() {
    canvasStore.clear();
    timeline.init(2);
    canvasStore.initMainWorkspace();
    canvasStore.isSimulating = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      stackModalStore.open(selectedGoroutine ? selectedGoroutine.goid : 1);
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<header class="shrink-0 z-40 w-full h-14 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between px-4 font-mono select-none">
  <div class="flex items-center gap-3">
    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
      <Activity class="h-4 w-4" />
    </div>
    <h1 class="text-sm font-bold tracking-tight text-white font-sans">
      {i18n.t('app.title')}
    </h1>
    <span class="text-zinc-700">/</span>
    <span class="text-xs text-zinc-400 hidden lg:inline-block">
      {canvasStore.nodes.length} nodes, {canvasStore.edges.length} edges
    </span>
  </div>

  <div class="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
    <button onclick={handleReinit} class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
      <RotateCcw class="h-3.5 w-3.5" />
    </button>
    <button disabled={!timeline.canStepBackward} onclick={() => timeline.stepBackward()} class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40">
      <SkipBack class="h-3.5 w-3.5" />
    </button>
    <button onclick={() => canvasStore.isSimulating = !canvasStore.isSimulating} class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm {canvasStore.isSimulating ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}">
      {#if canvasStore.isSimulating}<Pause class="h-3.5 w-3.5" /><span>Pause</span>{:else}<Play class="h-3.5 w-3.5" /><span>Simulate</span>{/if}
    </button>
    <button disabled={!timeline.canStepForward} onclick={() => timeline.stepForward()} class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40">
      <SkipForward class="h-3.5 w-3.5" />
    </button>
    <div class="h-4 w-px bg-zinc-800 mx-1"></div>
    <div class="px-2 text-xs text-zinc-400">
      {i18n.t('inspector.timeline.step')}: <span class="font-bold text-white">{timeline.currentIndex}</span>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <button onclick={() => stackModalStore.open(selectedGoroutine ? selectedGoroutine.goid : 1)} class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200 transition">
      <Layers class="h-3.5 w-3.5 text-emerald-400" />
      <span>Inspect Stack {selectedGoroutine ? `(G${selectedGoroutine.goid})` : ''}</span>
      <span class="px-1 py-0.2 rounded bg-zinc-800 text-[10px] text-emerald-400 font-mono border border-zinc-700 ml-1">P</span>
    </button>
    <button onclick={() => settingsStore.setOpen(true)} class="p-2 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition">
      <Settings class="h-4 w-4" />
    </button>
  </div>
</header>
