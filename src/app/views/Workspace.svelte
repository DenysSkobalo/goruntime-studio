<!-- src/lib/workspace/Workspace.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Activity,
    Settings,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    RotateCcw,
    Layers,
    Trash2,
    Network,
    Lock,
    Database,
    Users,
    Shuffle,
    Link2,
    MousePointer,
    Send,
    Inbox,
    Ban,
    Cpu,
    Shield,
    ShieldOff,
    UserPlus,
    Clock,
    XCircle,
    AlertTriangle,
    PlusCircle,
  } from 'lucide-svelte';
    import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
    import { timeline } from '$features/inspector/model/timeline.store.svelte';
    import { stackModalStore } from '$lib/stores/stack-modal.store.svelte';
    import { syncCanvasWithSnapshot } from '$features/canvas/model/sync.bridge';
    import { i18n } from '$core/i18n';
    import { settingsStore } from '$lib/stores/settings.store.svelte';
    import InspectorPanel from '$features/inspector/ui/InspectorPanel.svelte';
    import CanvasView from '$features/canvas/ui/CanvasView.svelte';
    import StackModal from '$features/inspector/ui/StackModal.svelte';
  

  const paletteTools = [
    { tool: 'pointer' as const, icon: MousePointer, color: 'text-zinc-400', activeColor: 'text-white', bg: 'bg-zinc-800', border: 'border-zinc-600', title: 'Select / Move' },
    { tool: 'goroutine' as const, icon: Network, color: 'text-emerald-400', activeColor: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', title: 'Goroutine' },
    { tool: 'channel' as const, icon: Database, color: 'text-cyan-400', activeColor: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', title: 'Channel' },
    { tool: 'mutex' as const, icon: Lock, color: 'text-amber-400', activeColor: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40', title: 'Mutex' },
    { tool: 'waitgroup' as const, icon: Users, color: 'text-blue-400', activeColor: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/40', title: 'WaitGroup' },
    { tool: 'select' as const, icon: Shuffle, color: 'text-purple-400', activeColor: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/40', title: 'Go Select Multiplexer' },
    { tool: 'connect' as const, icon: Link2, color: 'text-rose-400', activeColor: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/40', title: 'Connect Nodes' },
  ];

  let selectedGoroutine = $derived.by(() => {
    const node = canvasStore.getNode(canvasStore.selectedNodeId);
    return node && node.type === 'goroutine' ? node : null;
  });

  onMount(() => {
    timeline.init(2);
  });

  function handleReinit() {
    canvasStore.clear();
    timeline.init(2);
    canvasStore.isSimulating = false;
  }

  function toggleSimulate() {
    canvasStore.isSimulating = !canvasStore.isSimulating;
  }

  function handleInspectStack() {
    const goid = selectedGoroutine ? selectedGoroutine.goid : 1;
    stackModalStore.open(goid);
  }

  $effect(() => {
    syncCanvasWithSnapshot(timeline.currentSnapshot);
  });
</script>

<div class="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#09090b]">
  <header class="shrink-0 z-40 w-full h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 font-mono select-none">
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Activity class="h-4 w-4" />
      </div>
      <h1 class="text-sm font-bold tracking-tight text-zinc-900 dark:text-white font-sans">
        {i18n.t('app.title')}
      </h1>
      <span class="text-zinc-300 dark:text-zinc-700">/</span>
      <span class="text-xs text-zinc-500 dark:text-zinc-400 hidden lg:inline-block">
        {canvasStore.nodes.length} nodes, {canvasStore.edges.length} edges
      </span>
    </div>

    <!-- Execution Controls (Без блоку cap) -->
    <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button
        onclick={handleReinit}
        class="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
        title={i18n.t('inspector.controls.reinit')}
      >
        <RotateCcw class="h-3.5 w-3.5" />
      </button>

      <button
        disabled={!timeline.canStepBackward}
        onclick={() => timeline.stepBackward()}
        class="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        title="Step Backward"
      >
        <SkipBack class="h-3.5 w-3.5" />
      </button>

      <button
        onclick={toggleSimulate}
        class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm {canvasStore.isSimulating ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}"
      >
        {#if canvasStore.isSimulating}
          <Pause class="h-3.5 w-3.5" />
          <span>Pause</span>
        {:else}
          <Play class="h-3.5 w-3.5" />
          <span>Simulate</span>
        {/if}
      </button>

      <button
        disabled={!timeline.canStepForward}
        onclick={() => timeline.stepForward()}
        class="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        title="Step Forward"
      >
        <SkipForward class="h-3.5 w-3.5" />
      </button>

      <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

      <div class="px-2 text-xs text-zinc-500 dark:text-zinc-400">
        {i18n.t('inspector.timeline.step')}:
        <span class="font-bold text-zinc-900 dark:text-white">{timeline.currentIndex}</span>
        <span class="text-zinc-400 dark:text-zinc-500">/ {timeline.snapshots.length - 1}</span>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-2">
      <button
        onclick={handleInspectStack}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-sm {selectedGoroutine ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'}"
        title="Inspect Goroutine Stack Frames"
      >
        <Layers class="h-3.5 w-3.5 {selectedGoroutine ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}" />
        <span>Inspect Stack {selectedGoroutine ? `(G${selectedGoroutine.goid})` : ''}</span>
      </button>

      {#if canvasStore.nodes.length > 0}
        <button
          onclick={() => canvasStore.clear()}
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-500/10 transition text-xs font-semibold"
          title="Clear Canvas"
        >
          <Trash2 class="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      {/if}

      <button
        onclick={() => settingsStore.setOpen(true)}
        class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        aria-label="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>
  </header>

  <!-- Interactive Runtime Actions Bar -->
  <div class="shrink-0 z-30 w-full bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
    <div class="flex flex-wrap items-center gap-2">
      <!-- Channel Primitives -->
      <div class="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-800 pr-2">
        <button
          onclick={() => timeline.send('payload')}
          class="flex items-center gap-1 px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded font-bold transition"
          title="ch1 <- 'payload'"
        >
          <Send class="w-3 h-3" />
          <span>ch1 &lt;- "payload"</span>
        </button>
        <button
          onclick={() => timeline.receive()}
          class="flex items-center gap-1 px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded font-bold transition"
          title="<-ch1"
        >
          <Inbox class="w-3 h-3" />
          <span>&lt;-ch1</span>
        </button>
        <button
          onclick={() => timeline.close()}
          class="flex items-center gap-1 px-2 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/30 rounded font-bold transition"
          title="close(ch1)"
        >
          <Ban class="w-3 h-3" />
          <span>close(ch1)</span>
        </button>
      </div>

      <!-- Scheduler Operations -->
      <div class="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-800 pr-2">
        <button
          onclick={() => timeline.spawn()}
          class="flex items-center gap-1 px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 rounded font-bold transition"
          title="go func()"
        >
          <UserPlus class="w-3 h-3" />
          <span>go func()</span>
        </button>
        <button
          onclick={() => timeline.schedule()}
          class="flex items-center gap-1 px-2 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-600 dark:text-teal-300 border border-teal-500/30 rounded font-bold transition"
          title="schedule()"
        >
          <Cpu class="w-3 h-3" />
          <span>schedule()</span>
        </button>
      </div>

      <!-- Sync Mutex & WaitGroup -->
      <div class="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-800 pr-2">
        <button
          onclick={() => timeline.mutexLock()}
          class="flex items-center gap-1 px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded font-bold transition"
          title="mu.Lock()"
        >
          <Shield class="w-3 h-3" />
          <span>mu.Lock()</span>
        </button>
        <button
          onclick={() => timeline.mutexUnlock()}
          class="flex items-center gap-1 px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded font-bold transition"
          title="mu.Unlock()"
        >
          <ShieldOff class="w-3 h-3" />
          <span>mu.Unlock()</span>
        </button>
        <button
          onclick={() => timeline.wgAdd(1)}
          class="flex items-center gap-1 px-2 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 rounded font-bold transition"
          title="wg.Add(1)"
        >
          <PlusCircle class="w-3 h-3" />
          <span>wg.Add(1)</span>
        </button>
        <button
          onclick={() => timeline.wgWait()}
          class="flex items-center gap-1 px-2 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 rounded font-bold transition"
          title="wg.Wait()"
        >
          <Clock class="w-3 h-3" />
          <span>wg.Wait()</span>
        </button>
      </div>

      <!-- Select & Context -->
      <div class="flex items-center gap-1">
        <button
          onclick={() => timeline.select(false)}
          class="flex items-center gap-1 px-2 py-1 bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded font-bold transition"
          title="selectgo"
        >
          <Shuffle class="w-3 h-3" />
          <span>selectgo</span>
        </button>
        <button
          onclick={() => timeline.contextCancel()}
          class="flex items-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 rounded font-bold transition"
          title="cancel()"
        >
          <XCircle class="w-3 h-3" />
          <span>cancel()</span>
        </button>
      </div>
    </div>

    {#if timeline.lastError}
      <div class="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded font-bold animate-pulse">
        <AlertTriangle class="w-3.5 h-3.5 text-red-400" />
        <span>Panic: {timeline.lastError}</span>
      </div>
    {/if}
  </div>

  <div class="flex flex-1 overflow-hidden relative">
    <aside class="w-14 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col items-center py-3 gap-2 select-none z-30">
      {#each paletteTools as pt}
        {@const isActive = canvasStore.activeTool === pt.tool}
        <div class="relative group flex items-center">
          <button
            onclick={() => canvasStore.setTool(isActive ? 'pointer' : pt.tool)}
            class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border
              {isActive
                ? `${pt.bg} ${pt.activeColor} ${pt.border} shadow-sm`
                : 'text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-200 dark:hover:text-zinc-300 hover:bg-zinc-800/50'}"
            aria-label={pt.title}
          >
            <pt.icon class="h-4 w-4" />
          </button>
        </div>
      {/each}
    </aside>

    <div class="flex-1 overflow-hidden relative">
      <CanvasView />
    </div>

    <InspectorPanel />
  </div>
</div>

<StackModal />