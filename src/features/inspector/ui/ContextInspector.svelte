<script lang="ts">
  import { Layers, CircleX, CircleCheck, CornerDownRight } from 'lucide-svelte';
    import { timeline } from '../model/timeline.store.svelte';
    import { i18n } from '$core/i18n';

  let snapshot = $derived(timeline.currentSnapshot);
  let contexts = $derived(snapshot?.contexts ? Object.values(snapshot.contexts) : []);
</script>

{#if contexts.length > 0}
  <div class="glow-card p-6 animate-fade-in">
    <div class="mb-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-teal-500/10 p-2.5 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          <Layers class="h-5 w-5" />
        </div>
        <div>
          <h2 class="font-mono text-lg font-bold text-zinc-900 dark:text-white">{i18n.t('inspector.context.title')}</h2>
          <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400">{i18n.t('inspector.context.subtitle')}</p>
        </div>
      </div>
    </div>

    <div class="space-y-3 font-mono text-xs">
      {#each contexts as ctx (ctx.address)}
        <div class="flex items-center justify-between rounded-xl border p-4 transition-all
          {ctx.parentAddress ? 'ml-6 border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'}">
          <div class="flex items-center gap-3">
            {#if ctx.parentAddress}
              <CornerDownRight class="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            {/if}
            <span class="rounded-full px-2 py-0.5 text-[10px] font-bold border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300">
              {ctx.kind}
            </span>
            <span class="text-zinc-900 dark:text-white font-bold">{ctx.name}</span>
            <span class="text-zinc-400 dark:text-zinc-500 text-[11px]">({ctx.address})</span>
          </div>

          <div class="flex items-center gap-2 font-mono text-xs">
            {#if ctx.done}
              <span class="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-red-500 dark:text-red-400 border border-red-500/30 font-bold">
                <CircleX class="h-3.5 w-3.5" /> {i18n.t('inspector.context.doneClosed')}
              </span>
            {:else}
              <span class="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CircleCheck class="h-3.5 w-3.5" /> {i18n.t('inspector.context.active')}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
