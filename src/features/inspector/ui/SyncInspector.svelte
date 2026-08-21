<script lang="ts">
  import { Shield, Flame, Users, Network } from 'lucide-svelte';
  import { timeline } from '../model/timeline.store.svelte';
  import { i18n } from '$core/i18n';

  let snapshot = $derived(timeline.currentSnapshot);
  let mutexes = $derived(snapshot?.mutexes ? Object.values(snapshot.mutexes) : []);
  let waitGroups = $derived(snapshot?.waitGroups ? Object.values(snapshot.waitGroups) : []);
  let semaRoot = $derived(snapshot?.semaRoot);

  const lockedLabel = $derived(i18n.t('inspector.sync.locked'));
  const unlockedLabel = $derived(i18n.t('inspector.sync.unlocked'));
</script>

{#if mutexes.length > 0 || waitGroups.length > 0}
  <div class="space-y-6">
    {#each mutexes as mu (mu.address)}
      <div class="glow-card p-6 animate-fade-in">
        <div class="mb-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Shield class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-mono text-lg font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.sync.mutexTitle')} ({mu.name})</h2>
              <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {i18n.t('inspector.hchan.heapAllocation')}: <span class="text-amber-600 dark:text-amber-400">{mu.address}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            {#if mu.starving}
              <span class="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 font-mono text-xs text-red-500 dark:text-red-400 border border-red-500/40 animate-pulse font-bold">
                <Flame class="h-3.5 w-3.5 text-red-500" /> {i18n.t('inspector.sync.starvingMode')}
              </span>
            {/if}
            <span class="rounded-full px-2.5 py-1 font-mono text-xs border
              {mu.locked ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">
              {i18n.t('inspector.sync.stateLocked')}: {mu.locked ? `1 (${lockedLabel})` : `0 (${unlockedLabel})`}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 font-mono text-xs mb-4">
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.sync.mutexWoken')}</span>
            <span class="text-zinc-900 dark:text-white font-bold">{mu.woken ? '1' : '0'}</span>
          </div>
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.sync.mutexStarving')}</span>
            <span class="text-zinc-900 dark:text-white font-bold">{mu.starving ? '1' : '0'}</span>
          </div>
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.sync.waiterShift')}</span>
            <span class="text-amber-600 font-bold">{mu.waitersCount}</span>
          </div>
        </div>
      </div>
    {/each}

    {#each waitGroups as wg (wg.address)}
      <div class="glow-card p-6 animate-fade-in">
        <div class="mb-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Users class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-mono text-lg font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.sync.waitGroupTitle')} ({wg.name})</h2>
              <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400">{i18n.t('inspector.hchan.heapAllocation')}: {wg.address}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 font-mono text-xs">
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.sync.counter')}</span>
            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">{wg.counter}</span>
          </div>
          <div class="inner-card p-3">
            <span class="text-zinc-500 dark:text-zinc-400 block mb-1">{i18n.t('inspector.sync.waiterCount')}</span>
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{wg.waiterCount}</span>
          </div>
        </div>
      </div>
    {/each}

    {#if semaRoot}
      <div class="glow-card p-6 animate-fade-in">
        <div class="mb-3 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <Network class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 class="font-mono text-sm font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.sync.semaRootTitle')}</h2>
        </div>
        {#if semaRoot.waiters.length > 0}
          <div class="flex flex-wrap gap-2 font-mono text-xs">
            {#each semaRoot.waiters as waiter}
              <span class="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-purple-600 dark:text-purple-300">
                G{waiter.goid} (sema: {waiter.elemAddr.slice(0, 10)}...)
              </span>
            {/each}
          </div>
        {:else}
          <p class="font-mono text-xs text-zinc-400 dark:text-zinc-500 italic">{i18n.t('inspector.sync.semaEmpty')}</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}
