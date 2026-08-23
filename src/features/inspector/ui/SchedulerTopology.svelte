<script lang="ts">
  import { Cpu, Network, Server } from 'lucide-svelte';
  import { timeline } from '../model/timeline.store.svelte';

  let snapshot = $derived(timeline.currentSnapshot);
  let grq = $derived(snapshot?.sched.grq ?? []);
  let processors = $derived(snapshot ? Object.values(snapshot.processors) : []);
</script>

<div class="space-y-4 font-mono text-xs">
  <div class="glow-card p-4 space-y-2 border border-zinc-800 bg-zinc-950">
    <div class="flex items-center justify-between">
      <span class="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
        <Network class="w-3.5 h-3.5 text-purple-500" />
        GRQ (Global Run Queue)
      </span>
      <span class="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">{grq.length} elements</span>
    </div>
  </div>

  <div class="space-y-3">
    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
      <Server class="w-3.5 h-3.5 text-emerald-500" />
      <span>Logical Processors (P) & Threads (M)</span>
    </div>

    {#each processors as p (p.id)}
      <div class="glow-card p-4 border border-zinc-800 bg-zinc-900/90 rounded-xl">
        <div class="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="font-bold text-emerald-400">P{p.id} ({p.status})</span>
          <span class="text-zinc-500 italic text-[11px]">LRQ: {p.runq.length}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
