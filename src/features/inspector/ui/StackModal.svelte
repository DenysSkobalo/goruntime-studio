<script lang="ts">
  import { X, Layers, Cpu, ArrowDown, Database, Box, LayoutGrid, Code2, Zap } from 'lucide-svelte';
    import { timeline } from '../model/timeline.store.svelte';
    import { canvasStore } from '$features/canvas/model/canvas.store.svelte';
    import type { GoroutineNode } from '$lib/types/nodes';
    import { stackModalStore } from '$lib/stores/stack-modal.store.svelte';
    import { addOffset, formatHex, getGoroutineStack } from '$core/memory/layout';

  let snapshot = $derived(timeline.currentSnapshot);

  // Режими: 'visual' (Спрощена візуальна схема) та 'hex' (Низькорівнева пам'ять)
  let viewMode = $state<'visual' | 'hex'>('visual');

  let snapshotGoroutines = $derived(snapshot ? Object.values(snapshot.goroutines) : []);
  let canvasGoroutines = $derived(
    canvasStore.nodes
      .filter((n): n is GoroutineNode => n.type === 'goroutine')
      .map((n) => ({ goid: n.goid, status: n.status }))
  );

  let goroutines = $derived.by(() => {
    const map = new Map<number, { goid: number; status: string }>();
    for (const g of snapshotGoroutines) map.set(g.goid, { goid: g.goid, status: g.status });
    for (const g of canvasGoroutines) {
      if (!map.has(g.goid)) map.set(g.goid, { goid: g.goid, status: g.status });
    }
    if (map.size === 0) map.set(1, { goid: 1, status: '_Grunnable' });
    return Array.from(map.values()).sort((a, b) => a.goid - b.goid);
  });

  let activeG = $derived(
    goroutines.find((g) => g.goid === stackModalStore.selectedGoid) ?? goroutines[0]
  );

  let stack = $derived(
    activeG ? getGoroutineStack(activeG.goid) : getGoroutineStack(1)
  );

  let stackFrames = $derived.by(() => {
    return [
      {
        name: 'runtime.main()',
        fp: formatHex(addOffset(stack.stackLo, 0x07f0n)),
        size: '128 B',
        vars: [{ name: 'args', type: '[]string', addr: formatHex(addOffset(stack.stackLo, 0x07f8n)), size: '24 B' }]
      },
      {
        name: 'main.worker()',
        fp: formatHex(addOffset(stack.stackLo, 0x06a0n)),
        size: '256 B',
        vars: [
          { name: 'ch', type: 'chan string', addr: formatHex(addOffset(stack.stackLo, 0x06e0n)), size: '8 B' },
          { 
            name: 'elem (direct transfer target)', 
            type: 'string', 
            addr: formatHex(stack.elemAddr), 
            size: '16 B', 
            isElem: true 
          }
        ]
      }
    ];
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') stackModalStore.close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if stackModalStore.isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) stackModalStore.close(); }}
    role="dialog"
    aria-modal="true"
  >
    <div class="glow-card relative w-full max-w-4xl bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[720px] max-h-[90vh] font-mono animate-slide-in">
      
      <!-- Header -->
      <header class="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider">
              VIRTUAL STACK INSPECTOR (CONTIGUOUS 2 KB PAGE SLOT)
            </h2>
            <p class="text-xs text-zinc-400 font-sans">
              100% точность: downward growth, ізольовані сторінки без колізій та синхронізований SP/elem.
            </p>
          </div>
        </div>

        <button
          onclick={() => stackModalStore.close()}
          class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- Control Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-xs shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-zinc-400">Select Goroutine:</span>
          <div class="flex flex-wrap gap-1.5">
            {#each goroutines as g}
              <button
                onclick={() => stackModalStore.selectGoroutine(g.goid)}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition font-bold
                  {stackModalStore.selectedGoid === g.goid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'}"
              >
                <Cpu class="w-3 h-3" />
                <span>G{g.goid}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onclick={() => viewMode = 'visual'}
            class="flex items-center gap-1.5 px-3 py-1 rounded-md transition text-xs font-semibold
              {viewMode === 'visual' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>Візуальна схема</span>
          </button>
          <button
            onclick={() => viewMode = 'hex'}
            class="flex items-center gap-1.5 px-3 py-1 rounded-md transition text-xs font-semibold
              {viewMode === 'hex' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'}"
          >
            <Code2 class="w-3.5 h-3.5" />
            <span>Низькорівнева пам'ять (Hex)</span>
          </button>
        </div>
      </div>

      <!-- Scrollable Main Container with Fixed Height -->
      <div class="p-6 overflow-y-auto flex-1 space-y-5 h-[560px]">
        {#if activeG}
          <!-- Address Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shrink-0">
            <div class="inner-card p-3 border border-zinc-800 bg-zinc-950">
              <span class="text-zinc-500 block mb-1">High Limit (stack.hi):</span>
              <span class="text-emerald-400 font-bold text-sm">{formatHex(stack.stackHi)}</span>
            </div>
            <div class="inner-card p-3 border border-amber-500/30 bg-amber-500/5">
              <span class="text-amber-400/80 block mb-1">Stack Pointer (sched.sp):</span>
              <span class="text-amber-300 font-bold text-sm">{formatHex(stack.schedSp)}</span>
            </div>
            <div class="inner-card p-3 border border-zinc-800 bg-zinc-950">
              <span class="text-zinc-500 block mb-1">Low Limit (stack.lo):</span>
              <span class="text-emerald-400 font-bold text-sm">{formatHex(stack.stackLo)}</span>
            </div>
          </div>

          {#if viewMode === 'visual'}
            <!-- Спрощений візуальний режим -->
            <div class="space-y-4 font-sans">
              <div class="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 text-zinc-300 font-medium">
                  <Zap class="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Потік виконання G{activeG.goid}: виклики функцій нашаровуються зверху донизу.</span>
                </div>
                <span class="text-amber-400 font-mono text-[11px] font-bold flex items-center gap-1">
                  <ArrowDown class="w-3.5 h-3.5" /> Downward Growth
                </span>
              </div>

              <div class="space-y-3">
                <!-- Frame 0: runtime.main -->
                <div class="glow-card p-4 border border-purple-500/30 bg-purple-500/5 rounded-xl space-y-2">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="text-purple-300 font-bold text-sm flex items-center gap-2">
                      <Box class="w-4 h-4 text-purple-400" /> 1. runtime.main()
                    </span>
                    <span class="text-purple-400/80 text-[11px] font-bold">Базовий фрейм (128 B)</span>
                  </div>
                  <div class="text-xs text-zinc-400 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-800/80 flex justify-between">
                    <span>Аргументи запуску: <strong class="text-zinc-200">args ([]string)</strong></span>
                    <span class="text-zinc-500">24 B</span>
                  </div>
                </div>

                <!-- Call Line -->
                <div class="flex justify-center">
                  <div class="w-0.5 h-4 bg-zinc-800"></div>
                </div>

                <!-- Frame 1: main.worker -->
                <div class="glow-card p-4 border-2 border-amber-500/50 bg-amber-500/10 rounded-xl space-y-3 shadow-lg">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="text-amber-300 font-bold text-sm flex items-center gap-2">
                      <Box class="w-4 h-4 text-amber-400 animate-pulse" /> 2. main.worker() [АКТИВНИЙ ФРЕЙМ]
                    </span>
                    <span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[11px] font-bold border border-amber-500/40">
                      Верхівка стека (SP)
                    </span>
                  </div>

                  <div class="space-y-2 font-mono text-xs">
                    <div class="p-2.5 bg-zinc-950/80 rounded-lg border border-zinc-800/80 flex justify-between text-zinc-300">
                      <span>Канал передачі: <strong class="text-cyan-400">ch (chan string)</strong></span>
                      <span class="text-zinc-500">8 B</span>
                    </div>

                    <div class="p-3 bg-amber-500/15 rounded-lg border border-amber-500/50 flex items-center justify-between text-amber-200 shadow-sm">
                      <div class="flex items-center gap-2.5">
                        <Database class="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        <div>
                          <span class="font-bold block">Цільова змінна передачі (elem)</span>
                          <span class="text-[11px] text-zinc-400 font-sans block">Пряме копіювання даних з каналу через runtime.memmove</span>
                        </div>
                      </div>
                      <span class="font-mono font-bold text-amber-300">{formatHex(stack.elemAddr)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {:else}
            <!-- Низькорівнева пам'ять (Hex) — Точна відповідність з Скрн1 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                <span class="font-bold uppercase text-zinc-300">MEMORY ADDRESS LAYOUT</span>
                <span class="flex items-center gap-1 text-amber-400">
                  <ArrowDown class="w-3.5 h-3.5" /> Stack Downward Growth
                </span>
              </div>

              <div class="border border-zinc-800 rounded-xl bg-zinc-950 p-4 space-y-4">
                <div class="flex justify-between items-center text-[11px] text-emerald-400/70 border-b border-dashed border-zinc-800 pb-1">
                  <span>[ High Memory Address ]</span>
                  <span>{formatHex(stack.stackHi)}</span>
                </div>

                {#each stackFrames as frame}
                  <div class="border border-zinc-800 bg-zinc-900/80 rounded-lg p-3 space-y-2">
                    <div class="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-1.5">
                      <span class="text-purple-300 font-bold flex items-center gap-1.5">
                        <Box class="w-3.5 h-3.5 text-purple-400" /> {frame.name}
                      </span>
                      <span class="text-zinc-500 text-[11px]">Frame Size: {frame.size} | FP: {frame.fp}</span>
                    </div>

                    <div class="space-y-1.5 pt-1">
                      {#each frame.vars as v}
                        <div class="flex items-center justify-between p-2 rounded border text-xs
                          {v.isElem ? 'border-amber-500/50 bg-amber-500/10 text-amber-200' : 'border-zinc-800 bg-zinc-950 text-zinc-300'}">
                          <div class="flex items-center gap-2">
                            {#if v.isElem}
                              <Database class="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            {/if}
                            <span class="font-bold">{v.name}</span>
                            <span class="text-zinc-500 text-[10px]">({v.type})</span>
                          </div>
                          <div class="flex items-center gap-3 font-mono text-[11px]">
                            <span class="text-zinc-400">{v.addr}</span>
                            <span class="text-zinc-500">[{v.size}]</span>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}

                <div class="flex justify-between items-center text-[11px] text-emerald-400/70 border-t border-dashed border-zinc-800 pt-1">
                  <span>[ Low Memory Address ]</span>
                  <span>{formatHex(stack.stackLo)}</span>
                </div>
              </div>
            </div>
          {/if}

        {/if}
      </div>
    </div>
  </div>
{/if}