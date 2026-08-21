<!-- src/lib/inspector/components/HChanInspector.svelte -->
<script lang="ts">
  import { Lock, LockOpen, Database, ArrowDown, ArrowUp, CircleAlert, Sliders } from 'lucide-svelte';
    import { timeline } from '../model/timeline.store.svelte';
    import { i18n } from '$core/i18n';

  let snapshot = $derived(timeline.currentSnapshot);
  let channels = $derived(snapshot ? Object.values(snapshot.channels) : []);

  function handleCapChange(chanAddr: string, e: Event) {
    const input = e.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val)) {
      timeline.updateChannelCapacity(chanAddr, val);
    }
  }
</script>

{#if channels.length > 0}
  <div class="space-y-6">
    {#each channels as hchan (hchan.address)}
      {@const hasBuffer = hchan.dataqsiz > 0}
      <div class="glow-card p-6 animate-fade-in">
        <div class="mb-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Database class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-mono text-lg font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.hchan.title')} ({hchan.name})</h2>
              <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {i18n.t('inspector.hchan.heapAllocation')}: <span class="text-amber-600 dark:text-amber-400">{hchan.address}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border
              {hchan.closed ? 'border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400'}">
              <span class="h-2 w-2 rounded-full {hchan.closed ? 'bg-red-500 animate-ping' : 'bg-zinc-400 dark:bg-zinc-600'}"></span>
              {i18n.t('inspector.hchan.closed')}: {hchan.closed}
            </div>

            <div class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border transition-all duration-300
              {hchan.isLocked ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300 shadow-glow-cyan' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400'}">
              {#if hchan.isLocked}
                <Lock class="h-3.5 w-3.5 animate-pulse text-amber-500" />
                <span>{i18n.t('inspector.hchan.locked')}: {i18n.t('inspector.sync.locked')}</span>
              {:else}
                <LockOpen class="h-3.5 w-3.5 text-emerald-500" />
                <span>{i18n.t('inspector.hchan.locked')}: {i18n.t('inspector.sync.unlocked')}</span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Метрики та Live-налаштування dataqsiz -->
        <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.hchan.qcount')}</span>
            <span class="text-lg font-bold text-cyan-600 dark:text-cyan-400">{hchan.qcount}</span>
          </div>

          <!-- Live dataqsiz controller -->
          <div class="inner-card p-3 border-cyan-500/30 bg-cyan-500/5">
            <div class="flex items-center justify-between mb-1">
              <span class="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                <Sliders class="w-3 h-3" /> dataqsiz (live)
              </span>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="8"
                value={hchan.dataqsiz}
                onchange={(e) => handleCapChange(hchan.address, e)}
                class="w-12 rounded border border-cyan-500/40 bg-zinc-900 px-1.5 py-0.5 text-center font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <span class="text-[10px] text-zinc-400">items</span>
            </div>
          </div>

          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.hchan.sendx')}</span>
            <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{hchan.sendx}</span>
          </div>
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.hchan.recvx')}</span>
            <span class="text-lg font-bold text-indigo-500 dark:text-indigo-400">{hchan.recvx}</span>
          </div>
        </div>

        <div class="mb-6">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              {i18n.t('inspector.hchan.buffer')}
            </span>
            <span class="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {i18n.t('inspector.hchan.elemsize')}: {hchan.elemsize} B
            </span>
          </div>

          {#if hasBuffer}
            <div class="grid gap-3" style="grid-template-columns: repeat({Math.max(hchan.dataqsiz, 1)}, minmax(0, 1fr));">
              {#each hchan.buf as item, idx}
                <div class="relative flex flex-col items-center">
                  <div class="w-full rounded-xl border p-4 text-center font-mono transition-all duration-300 min-h-[72px] flex flex-col items-center justify-center
                    {item ? 'border-cyan-500/40 bg-cyan-500/5 text-cyan-600 dark:text-cyan-300 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500'}">
                    {#if item}
                      <span class="text-sm font-bold text-cyan-600 dark:text-cyan-300">"{item.val}"</span>
                      <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-1">{item.id}</span>
                    {:else}
                      <span class="text-xs text-zinc-400 dark:text-zinc-500 italic">nil</span>
                    {/if}
                  </div>
                  <span class="mt-1.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">buf[{idx}]</span>
                  <div class="mt-1 flex gap-1">
                    {#if idx === hchan.sendx && hchan.qcount < hchan.dataqsiz}
                      <span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <ArrowDown class="h-2.5 w-2.5" /> sendx
                      </span>
                    {/if}
                    {#if idx === hchan.recvx && hchan.qcount > 0}
                      <span class="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-mono text-indigo-500 border border-indigo-500/30">
                        <ArrowUp class="h-2.5 w-2.5" /> recvx
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
              <CircleAlert class="h-4 w-4 text-amber-500/70" />
              {i18n.t('inspector.hchan.unbuffered')}
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <div class="inner-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{i18n.t('inspector.hchan.sendq')}</span>
              <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {hchan.sendq.length} {i18n.t('inspector.hchan.sudog')}
              </span>
            </div>
            {#if hchan.sendq.length > 0}
              <div class="space-y-2">
                {#each hchan.sendq as sudog}
                  <div class="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 font-mono text-xs">
                    <span class="text-emerald-600 dark:text-emerald-300 font-bold">G{sudog.goid}</span>
                    <span class="text-zinc-500 dark:text-zinc-400">elem: <span class="text-zinc-900 dark:text-white">"{sudog.elem}"</span></span>
                    <span class="text-[10px] text-zinc-500 dark:text-zinc-400">{sudog.id}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 italic">{i18n.t('inspector.hchan.queueEmpty')}</p>
            {/if}
          </div>

          <div class="inner-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="font-mono text-xs font-bold text-indigo-500 dark:text-indigo-400">{i18n.t('inspector.hchan.recvq')}</span>
              <span class="rounded-full bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] text-indigo-500 border border-indigo-500/20">
                {hchan.recvq.length} {i18n.t('inspector.hchan.sudog')}
              </span>
            </div>
            {#if hchan.recvq.length > 0}
              <div class="space-y-2">
                {#each hchan.recvq as sudog}
                  <div class="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-2 font-mono text-xs">
                    <span class="text-indigo-500 dark:text-indigo-300 font-bold">G{sudog.goid}</span>
                    <span class="text-zinc-500 dark:text-zinc-400">target: <span class="text-zinc-900 dark:text-white">stack frame</span></span>
                    <span class="text-[10px] text-zinc-500 dark:text-zinc-400">{sudog.id}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 italic">{i18n.t('inspector.hchan.queueEmpty')}</p>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}