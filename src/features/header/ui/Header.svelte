<script lang="ts">
  /**
   * @file src/features/header/ui/Header.svelte
   * @module features/header/ui/Header
   *
   * @architecture Top Application Navigation & Simulation Controller Header Component
   * @description Application navigation bar managing workspace resets, timeline step playback (forward/backward),
   * interactive simulation toggles, active node/edge telemetry counters, and stack/heap inspection modal triggers.
   *
   * @remarks
   * **Keyboard Accessibility & Focus Handling:**
   * Includes a global window keyboard shortcut listener (`P` key) to open the stack modal for the currently selected
   * Goroutine (or default `G1`). Intercepts inputs to ensure typing within text controls does not trigger hotkeys.
   *
   * @see {@link canvasStore} Reactive state store holding node and edge collections and simulation status.
   * @see {@link timeline} Step-by-step runtime state execution timeline store.
   * @see {@link stackModalStore} Goroutine stack/heap inspector modal store.
   */
  import {
    Activity,
    RotateCcw,
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Layers,
    Settings,
  } from '@lucide/svelte';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';
  import { stackModalStore } from '$shared/stores/stack-modal.store.svelte';
  import { settingsStore } from '$shared/stores/settings.store.svelte';
  import { i18n } from '$core/i18n';

  /**
   * Derived reference resolving the currently selected Goroutine (`runtime.g`) node on the canvas layout.
   *
   * ANCHOR: SELECTED_GOROUTINE_DERIVED
   *
   * @returns Active `GoroutineNode` instance or `null` if a non-goroutine node or no node is selected.
   */
  let selectedGoroutine = $derived.by(() => {
    const node = canvasStore.getNode(canvasStore.selectedNodeId);
    return node && node.type === 'goroutine' ? node : null;
  });

  /**
   * Computes localized inspector button text, dynamically targeting selected Goroutine ID (e.g., "Inspect Stack/Heap (G1)").
   *
   * ANCHOR: INSPECT_BUTTON_TEXT_DERIVED
   */
  let inspectButtonText = $derived.by(() => {
    if (selectedGoroutine) {
      return i18n
        .t('header.inspectStackHeapTarget')
        .replace('{target}', `G${selectedGoroutine.goid}`);
    }
    return i18n.t('header.inspectStackHeap');
  });

  /**
   * Resets the entire interactive workspace canvas state and timeline step history to default seed values.
   *
   * ANCHOR: HANDLE_REINIT
   *
   * @remarks
   * **Why full reset sequence is required:**
   * Clears existing node positions and active edges before re-initializing default Goroutine (`G1`) and Channel (`ch1`) primitives,
   * resetting simulation playback flags to prevent out-of-sync execution state.
   */
  function handleReinit() {
    canvasStore.clear();
    timeline.init(2);
    canvasStore.initMainWorkspace();
    canvasStore.isSimulating = false;
  }

  /**
   * Global keyboard shortcut dispatcher for quick modal opening.
   *
   * ANCHOR: HOTKEY_HANDLER
   *
   * @remarks
   * **Why text input check is critical:**
   * Prevents accidental hotkey triggering (`P` key opening stack inspector) while users are typing inside editable text inputs or textareas.
   *
   * @param e - Keydown keyboard event object.
   */
  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      stackModalStore.open(selectedGoroutine ? selectedGoroutine.goid : 1);
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- ANCHOR: HEADER_CONTAINER -->
<header
  class="shrink-0 z-40 w-full h-14 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between px-4 font-mono select-none"
>
  <!-- ANCHOR: BRANDING_AND_TELEMETRY -->
  <div class="flex items-center gap-3">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
    >
      <Activity class="h-4 w-4" />
    </div>
    <h1 class="text-sm font-bold tracking-tight text-white font-sans">
      {i18n.t('app.title')}
    </h1>
    <span class="text-zinc-700">/</span>
    <span class="text-xs text-zinc-400 hidden lg:inline-block">
      {canvasStore.nodes.length}
      {i18n.t('common.nodes')}, {canvasStore.edges.length}
      {i18n.t('common.edges')}
    </span>
  </div>

  <!-- ANCHOR: SIMULATION_TIMELINE_CONTROLS -->
  <div class="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
    <button
      onclick={handleReinit}
      title={i18n.t('header.clear')}
      class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
    >
      <RotateCcw class="h-3.5 w-3.5" />
    </button>
    <button
      disabled={!timeline.canStepBackward}
      onclick={() => timeline.stepBackward()}
      class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
    >
      <SkipBack class="h-3.5 w-3.5" />
    </button>
    <button
      onclick={() => (canvasStore.isSimulating = !canvasStore.isSimulating)}
      class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer {canvasStore.isSimulating
        ? 'bg-amber-600 text-white'
        : 'bg-emerald-600 text-white'}"
    >
      {#if canvasStore.isSimulating}
        <Pause class="h-3.5 w-3.5" /><span>{i18n.t('header.pause')}</span>
      {:else}
        <Play class="h-3.5 w-3.5" /><span>{i18n.t('header.simulate')}</span>
      {/if}
    </button>
    <button
      disabled={!timeline.canStepForward}
      onclick={() => timeline.stepForward()}
      class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
    >
      <SkipForward class="h-3.5 w-3.5" />
    </button>
    <div class="h-4 w-px bg-zinc-800 mx-1"></div>
    <div class="px-2 text-xs text-zinc-400">
      {i18n.t('inspector.timeline.step')}:
      <span class="font-bold text-white">{timeline.currentIndex}</span>
    </div>
  </div>

  <!-- ANCHOR: INSPECTOR_AND_SETTINGS_ACTIONS -->
  <div class="flex items-center gap-2">
    <button
      onclick={() => stackModalStore.open(selectedGoroutine ? selectedGoroutine.goid : 1)}
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200 transition cursor-pointer whitespace-nowrap"
    >
      <Layers class="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      <span>{inspectButtonText}</span>
      <span
        class="px-1 py-0.2 rounded bg-zinc-800 text-[10px] text-emerald-400 font-mono border border-zinc-700 ml-1"
        >P</span
      >
    </button>
    <button
      onclick={() => settingsStore.setOpen(true)}
      class="p-2 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
    >
      <Settings class="h-4 w-4" />
    </button>
  </div>
</header>
