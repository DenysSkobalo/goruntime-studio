<script lang="ts">
  import { timeline } from '../state/timeline.svelte';
  import { Layers, XCircle, CheckCircle2, CornerDownRight } from 'lucide-svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let contexts = $derived(snapshot?.contexts ? Object.values(snapshot.contexts) : []);
</script>

{#if contexts.length > 0}
  <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
    <div class="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-teal-500/10 p-2.5 text-teal-400 border border-teal-500/20">
          <Layers class="h-5 w-5" />
        </div>
        <div>
          <h2 class="font-mono text-lg font-bold text-slate-100">context.Context Tree Inspector</h2>
          <p class="text-xs font-mono text-slate-400">Lifecycle propagation & channel-based cancellation</p>
        </div>
      </div>
    </div>

    <div class="space-y-3 font-mono text-xs">
      {#each contexts as ctx (ctx.address)}
        <div class="flex items-center justify-between rounded-lg border p-4 transition-all
          {ctx.parentAddress ? 'ml-6 border-slate-800/80 bg-slate-950/60' : 'border-slate-700 bg-slate-950'}">
          <div class="flex items-center gap-3">
            {#if ctx.parentAddress}
              <CornerDownRight class="h-4 w-4 text-slate-500" />
            {/if}
            <span class="rounded px-2 py-0.5 text-[10px] font-bold border border-teal-500/30 bg-teal-500/10 text-teal-300">
              {ctx.kind}
            </span>
            <span class="text-slate-200 font-bold">{ctx.name}</span>
            <span class="text-slate-500 text-[11px]">({ctx.address})</span>
          </div>

          <div class="flex items-center gap-2 font-mono text-xs">
            {#if ctx.done}
              <span class="flex items-center gap-1 rounded bg-red-500/20 px-2.5 py-1 text-red-400 border border-red-500/30 font-bold">
                <XCircle class="h-3.5 w-3.5" /> Done (Channel Closed)
              </span>
            {:else}
			<span class="flex items-center gap-1 rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 border border-emerald-500/30">
			<CheckCircle2 class="h-3.5 w-3.5" /> Active (&lt;-done blocked)
			</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
