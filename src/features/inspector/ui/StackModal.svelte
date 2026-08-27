<script lang="ts">
  import Modal from '$shared/ui/Modal.svelte';
  import { stackModalStore } from '$shared/stores/stack-modal.store.svelte';
  import { formatHex, getGoroutineStack, getRawBaseAddress } from '$core/memory/layout';
  import { GoStackManager } from '$core/memory/stack';
  import { i18n } from '$core/i18n';
  import { Layers, Cpu, HardDrive, ArrowDown, Binary, ShieldAlert, Database } from '@lucide/svelte';

  let selectedGoid = $derived(stackModalStore.selectedGoid);
  let stack = $derived(getGoroutineStack(selectedGoid));
  let stackFrames = $derived(GoStackManager.getVirtualStackFrames(stack.stackLo, stack.elemAddr));

  let formattedSubtitle = $derived(
    i18n
      .t('stackModal.subtitle')
      .replace('{goid}', String(selectedGoid))
      .replace('{label}', 'main'),
  );
</script>

<Modal
  isOpen={stackModalStore.isOpen}
  title={i18n.t('stackModal.title')}
  subtitle={formattedSubtitle}
  icon={Layers}
  maxWidth="4xl"
  onClose={() => stackModalStore.close()}
>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 font-mono text-xs">
    <!-- Stack Arena -->
    <div class="space-y-3">
      <div
        class="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider"
      >
        <span class="flex items-center gap-2"
          ><Cpu class="w-4 h-4 text-emerald-400" />
          {i18n.t('stackModal.stackArena')} (G{selectedGoid})</span
        >
        <span class="text-[10px] text-zinc-500">{i18n.t('stackModal.fixedPageSlot')}</span>
      </div>

      <div
        class="glow-card p-3.5 space-y-3 border border-zinc-800 bg-zinc-900/60 rounded-xl relative"
      >
        <div
          class="flex justify-between items-center bg-zinc-950 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-[11px]"
        >
          <span class="text-zinc-400 font-bold">{i18n.t('stackModal.highBoundary')}:</span>
          <span class="text-emerald-400 font-bold">{formatHex(stack.stackHi)}</span>
        </div>

        <div class="flex justify-center py-0.5">
          <ArrowDown class="w-4 h-4 text-emerald-500/60 animate-bounce" />
        </div>

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
                    <span class="text-zinc-400"
                      >{v.name} <span class="text-zinc-600">({v.type})</span></span
                    >
                    <span class="text-amber-300 font-bold">{v.value}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>

        <div
          class="flex justify-between items-center bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/40 text-[11px]"
        >
          <span class="text-amber-300 font-bold flex items-center gap-1.5">
            <Binary class="w-3.5 h-3.5 text-amber-400" />
            {i18n.t('stackModal.stackPointer')}:
          </span>
          <span class="text-amber-300 font-bold">{formatHex(stack.schedSp)}</span>
        </div>

        <div
          class="flex justify-between items-center bg-rose-950/30 px-3 py-1 rounded-lg border border-rose-500/30 text-[10px]"
        >
          <span class="text-rose-400 flex items-center gap-1"
            ><ShieldAlert class="w-3 h-3" /> {i18n.t('stackModal.stackGuard')}:</span
          >
          <span class="text-rose-300">{formatHex(stack.stackLo + 256n)}</span>
        </div>

        <div
          class="flex justify-between items-center bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px]"
        >
          <span class="text-zinc-400 font-bold">{i18n.t('stackModal.lowBoundary')}:</span>
          <span class="text-emerald-400 font-bold">{formatHex(stack.stackLo)}</span>
        </div>
      </div>
    </div>

    <!-- Virtual Heap Arena -->
    <div class="space-y-3">
      <div
        class="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider"
      >
        <span class="flex items-center gap-2"
          ><HardDrive class="w-4 h-4 text-cyan-400" /> {i18n.t('stackModal.virtualHeapArena')}</span
        >
        <span class="text-[10px] text-zinc-500">{i18n.t('stackModal.sizeClasses')}</span>
      </div>

      <div class="glow-card p-3.5 space-y-3 border border-zinc-800 bg-zinc-900/60 rounded-xl">
        <div class="bg-zinc-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-cyan-300 flex items-center gap-1.5"
              ><Database class="w-3.5 h-3.5" /> runtime.hchan (main.ch)</span
            >
            <span class="text-cyan-400 font-bold text-[10px]"
              >{formatHex(getRawBaseAddress('channel-1'))}</span
            >
          </div>
          <div
            class="grid grid-cols-2 gap-2 text-[10px] bg-zinc-900/80 p-2 rounded-lg border border-zinc-800"
          >
            <div>
              <span class="text-zinc-500">qcount:</span>
              <span class="text-white font-bold">0</span>
            </div>
            <div>
              <span class="text-zinc-500">dataqsiz:</span>
              <span class="text-white font-bold">2</span>
            </div>
            <div>
              <span class="text-zinc-500">elemsize:</span>
              <span class="text-white font-bold">16 B</span>
            </div>
            <div>
              <span class="text-zinc-500">closed:</span>
              <span class="text-emerald-400 font-bold">false</span>
            </div>
          </div>
        </div>

        <div class="bg-zinc-950 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-amber-300">{i18n.t('inspector.descriptorSudog')}</span>
            <span class="text-amber-400 font-bold text-[10px]"
              >{formatHex(getRawBaseAddress('sudog-1'))}</span
            >
          </div>
          <div class="space-y-1 text-[10px]">
            <div class="flex justify-between">
              <span class="text-zinc-400">elem (Stack Pointer):</span>
              <span class="text-amber-300 font-bold">{formatHex(stack.elemAddr)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">g (Goroutine Descriptor):</span>
              <span class="text-emerald-400 font-bold"
                >{formatHex(getRawBaseAddress('goroutine-1'))}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</Modal>
