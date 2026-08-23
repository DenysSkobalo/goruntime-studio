<script lang="ts">
  import { X, Layers, Cpu, Database, ArrowDown, HardDrive, Binary, ShieldAlert } from 'lucide-svelte';
  import { stackModalStore } from '$shared/stores/stack-modal.store.svelte';
  import { formatHex, getGoroutineStack, getRawBaseAddress } from '$core/memory/layout';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';

  let selectedGoid = $derived(stackModalStore.selectedGoid);
  let stack = $derived(getGoroutineStack(selectedGoid));

  // Віртуальні стекові фрейми для G1 (main)
  let stackFrames = $derived([
    {
      function: 'main.main()',
      spOffset: '0x0780',
      address: formatHex(stack.stackLo + 0x0780n),
      vars: [
        { name: 'ch', type: 'chan string', value: formatHex(getRawBaseAddress('channel-1')) },
        { name: 'msg', type: 'string', value: '"hello runtime"' }
      ]
    },
    {
      function: 'runtime.chansend1()',
      spOffset: '0x0640',
      address: formatHex(stack.stackLo + 0x0640n),
      vars: [
        { name: 'c', type: '*hchan', value: formatHex(getRawBaseAddress('channel-1')) },
        { name: 'elem', type: 'unsafe.Pointer', value: formatHex(stack.elemAddr) }
      ]
    }
  ]);
</script>

{#if stackModalStore.isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono select-none"
    role="dialog"
    tabindex="-1"
  >
    <div class="glow-card relative w-full max-w-4xl bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[680px]">
      <!-- Header -->
      <header class="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-xs font-bold text-white uppercase tracking-wider">VIRTUAL MEMORY MAP — STACK & HEAP LAYOUT</h2>
            <p class="text-[10px] text-zinc-400">Goroutine G{selectedGoid} (main) • 2 KB Page Slot Isolation</p>
          </div>
        </div>
        <button onclick={() => stackModalStore.close()} class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- Main Content Area: Stack & Heap Grid -->
      <div class="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 bg-[#09090b]">
        
        <!-- SECTION 1: STACK MEMORY MAP (Grows Downward) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span class="flex items-center gap-2"><Cpu class="w-4 h-4 text-emerald-400" /> Stack Arena (G{selectedGoid})</span>
            <span class="text-[10px] text-zinc-500">Fixed 2 KB Page Slot</span>
          </div>

          <div class="glow-card p-3.5 space-y-3 border border-zinc-800 bg-zinc-900/60 rounded-xl relative">
            <!-- High Limit (Stack Top) -->
            <div class="flex justify-between items-center bg-zinc-950 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-[11px]">
              <span class="text-zinc-400 font-bold">stack.hi [High Boundary]:</span>
              <span class="text-emerald-400 font-bold">{formatHex(stack.stackHi)}</span>
            </div>

            <div class="flex justify-center py-0.5">
              <ArrowDown class="w-4 h-4 text-emerald-500/60 animate-bounce" />
            </div>

            <!-- Stack Frames -->
            <div class="space-y-2">
              {#each stackFrames as frame}
                <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-purple-400">{frame.function}</span>
                    <span class="text-[10px] text-zinc-500 font-mono">{frame.address}</span>
                  </div>
                  <div class="space-y-1 pl-2 border-l-2 border-purple-500/40 text-[10px]">
                    {#each frame.vars as v}
                      <div class="flex justify-between">
                        <span class="text-zinc-400">{v.name} <span class="text-zinc-600">({v.type})</span></span>
                        <span class="text-amber-300 font-bold">{v.value}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>

            <!-- SP Marker -->
            <div class="flex justify-between items-center bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/40 text-[11px]">
              <span class="text-amber-300 font-bold flex items-center gap-1.5">
                <Binary class="w-3.5 h-3.5 text-amber-400" /> sched.sp [Stack Pointer]:
              </span>
              <span class="text-amber-300 font-bold">{formatHex(stack.schedSp)}</span>
            </div>

            <!-- Guard Zone -->
            <div class="flex justify-between items-center bg-rose-950/30 px-3 py-1 rounded-lg border border-rose-500/30 text-[10px]">
              <span class="text-rose-400 flex items-center gap-1"><ShieldAlert class="w-3 h-3" /> stackguard0 (+256 B):</span>
              <span class="text-rose-300">{formatHex(stack.stackLo + 256n)}</span>
            </div>

            <!-- Low Limit (Stack Bottom) -->
            <div class="flex justify-between items-center bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px]">
              <span class="text-zinc-400 font-bold">stack.lo [Low Boundary]:</span>
              <span class="text-emerald-400 font-bold">{formatHex(stack.stackLo)}</span>
            </div>
          </div>
        </div>

        <!-- SECTION 2: HEAP ARENA MAP -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <span class="flex items-center gap-2"><HardDrive class="w-4 h-4 text-cyan-400" /> Virtual Heap Arena</span>
            <span class="text-[10px] text-zinc-500">67 Size Classes (MCache/MHeap)</span>
          </div>

          <div class="glow-card p-3.5 space-y-3 border border-zinc-800 bg-zinc-900/60 rounded-xl">
            <!-- Channel Structure in Heap -->
            <div class="bg-zinc-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-cyan-300 flex items-center gap-1.5"><Database class="w-3.5 h-3.5" /> runtime.hchan (main.ch)</span>
                <span class="text-cyan-400 font-bold text-[10px]">{formatHex(getRawBaseAddress('channel-1'))}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-[10px] bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <div><span class="text-zinc-500">qcount:</span> <span class="text-white font-bold">0</span></div>
                <div><span class="text-zinc-500">dataqsiz:</span> <span class="text-white font-bold">2</span></div>
                <div><span class="text-zinc-500">elemsize:</span> <span class="text-white font-bold">16 B</span></div>
                <div><span class="text-zinc-500">closed:</span> <span class="text-emerald-400 font-bold">false</span></div>
              </div>
            </div>

            <!-- Sudog Pointer Connection -->
            <div class="bg-zinc-950 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-amber-300">runtime.sudog (Direct Transfer Link)</span>
                <span class="text-amber-400 font-bold text-[10px]">{formatHex(getRawBaseAddress('sudog-1'))}</span>
              </div>
              <div class="space-y-1 text-[10px]">
                <div class="flex justify-between">
                  <span class="text-zinc-400">elem (Stack Pointer):</span>
                  <span class="text-amber-300 font-bold">{formatHex(stack.elemAddr)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-400">g (Goroutine Descriptor):</span>
                  <span class="text-emerald-400 font-bold">{formatHex(getRawBaseAddress('goroutine-1'))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
{/if}
