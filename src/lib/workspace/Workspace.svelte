<script lang="ts">
  import { onMount } from 'svelte';
  import { Activity, Settings, Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronUp, ChevronDown, Network, Lock, Database, Users, Shuffle, Link2, MousePointer } from 'lucide-svelte';
  import { timeline } from '../inspector/state/timeline.svelte';
  import { i18n } from '../i18n/i18n.svelte';
  import { settingsStore } from '../shared/settingsStore.svelte';
  import { canvasStore } from '../canvas/state/canvas.svelte';
  import CanvasView from '../canvas/CanvasView.svelte';
  import InspectorPanel from '../inspector/InspectorPanel.svelte';

  let drawerOpen = $state(true);
  let isSimulating = $state(false);

  const paletteTools = [
    { tool: 'pointer' as const, icon: MousePointer, color: 'text-zinc-400', activeColor: 'text-white', bg: 'bg-zinc-800', border: 'border-zinc-600', title: 'Select / Move', shortcut: '1 / V' },
    { tool: 'goroutine' as const, icon: Network, color: 'text-emerald-400', activeColor: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', title: 'Goroutine', shortcut: '2 / G' },
    { tool: 'channel' as const, icon: Database, color: 'text-cyan-400', activeColor: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', title: 'Channel', shortcut: '3 / C' },
    { tool: 'mutex' as const, icon: Lock, color: 'text-amber-400', activeColor: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40', title: 'Mutex', shortcut: '4 / M' },
    { tool: 'waitgroup' as const, icon: Users, color: 'text-blue-400', activeColor: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/40', title: 'WaitGroup', shortcut: '5 / W' },
    { tool: 'select' as const, icon: Shuffle, color: 'text-purple-400', activeColor: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/40', title: 'Go Select Multiplexer', shortcut: '6 / S' },
    { tool: 'connect' as const, icon: Link2, color: 'text-rose-400', activeColor: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/40', title: 'Connect Nodes', shortcut: '7 / L' },
  ];

  onMount(() => {
    timeline.init(2);
  });

  function handleReinit() {
    timeline.init(2);
    isSimulating = false;
  }

  function toggleSimulate() {
    isSimulating = !isSimulating;
  }
</script>

<div class="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#09090b]">
  <!-- Header -->
  <header class="shrink-0 z-40 w-full h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4">
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Activity class="h-4 w-4" />
      </div>
      <h1 class="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
        {i18n.t('app.title')}
      </h1>
    </div>

    <div class="flex items-center gap-2">
      <!-- Simulation Controls -->
      <div class="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1">
        <button
          onclick={handleReinit}
          class="rounded-md p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
          title={i18n.t('inspector.controls.reinit')}
        >
          <RotateCcw class="h-3.5 w-3.5" />
        </button>
        <div class="w-px h-4 bg-zinc-200 dark:bg-zinc-800"></div>
        <button
          disabled={!timeline.canStepBackward}
          onclick={() => timeline.stepBackward()}
          class="rounded-md p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipBack class="h-3.5 w-3.5" />
        </button>
        <button
          onclick={toggleSimulate}
          class="rounded-md p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
        >
          {#if isSimulating}
            <Pause class="h-3.5 w-3.5" />
          {:else}
            <Play class="h-3.5 w-3.5" />
          {/if}
        </button>
        <button
          disabled={!timeline.canStepForward}
          onclick={() => timeline.stepForward()}
          class="rounded-md p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipForward class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Step Counter -->
      <div class="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
        <span>{i18n.t('inspector.timeline.step')}:</span>
        <span class="font-bold text-zinc-900 dark:text-white">{timeline.currentIndex}</span>
        <span class="text-zinc-400 dark:text-zinc-500">/ {timeline.snapshots.length - 1}</span>
      </div>

      <!-- Settings -->
      <button
        onclick={() => settingsStore.setOpen(true)}
        class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        aria-label="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>
  </header>

  <!-- Main Workspace Layout -->
  <div class="flex flex-1 overflow-hidden relative">
    <!-- Left Palette -->
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

          <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs whitespace-nowrap shadow-2xl z-50 pointer-events-none animate-fade-in font-mono">
            <span class="font-semibold">{pt.title}</span>
            <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 font-bold">
              {pt.shortcut}
            </kbd>
          </div>
        </div>
      {/each}
    </aside>

    <!-- Center Canvas -->
    <div class="flex-1 overflow-hidden relative">
      <CanvasView />
    </div>

    <!-- Right Side Inspector Panel (Opens when a node is selected) -->
    <InspectorPanel />
  </div>

  <!-- Bottom Drawer -->
  <div class="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
    <button
      onclick={() => drawerOpen = !drawerOpen}
      class="w-full flex items-center justify-center py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
    >
      {#if drawerOpen}
        <ChevronDown class="h-4 w-4 text-zinc-400" />
      {:else}
        <ChevronUp class="h-4 w-4 text-zinc-400" />
      {/if}
    </button>
    {#if drawerOpen}
      <div class="h-44 px-4 pb-4 overflow-y-auto">
        {#if timeline.currentSnapshot}
          <div class="glow-card p-4 space-y-2">
            <div class="flex items-start justify-between gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span class="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                {i18n.t('inspector.timeline.step')} {timeline.currentSnapshot.step}: {timeline.currentSnapshot.action}
              </span>
              <span class="flex-1 text-right truncate">
                {timeline.currentSnapshot.explanation}
              </span>
            </div>
          </div>
        {:else}
          <div class="glow-card p-4 text-xs font-mono text-zinc-500 dark:text-zinc-400 text-center">
            Initialize simulation to see runtime events
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>