<script lang="ts">
  import { MousePointer, Network, Database, Link2 } from '@lucide/svelte';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';

  const paletteTools = [
    {
      tool: 'pointer' as const,
      icon: MousePointer,
      activeColor: 'text-white',
      bg: 'bg-zinc-800',
      border: 'border-zinc-600',
      title: 'Select / Move',
      shortcut: 'V',
    },
    {
      tool: 'goroutine' as const,
      icon: Network,
      activeColor: 'text-emerald-300',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      title: 'Goroutine (runtime.g)',
      shortcut: 'G',
    },
    {
      tool: 'channel' as const,
      icon: Database,
      activeColor: 'text-cyan-300',
      bg: 'bg-cyan-500/15',
      border: 'border-cyan-500/40',
      title: 'Channel (runtime.hchan)',
      shortcut: 'C',
    },
    {
      tool: 'connect' as const,
      icon: Link2,
      activeColor: 'text-amber-300',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/40',
      title: 'Connect (runtime.sudog)',
      shortcut: 'L',
    },
  ];
</script>

<aside
  class="w-14 shrink-0 border-r border-zinc-800 bg-[#09090b] flex flex-col items-center py-4 gap-3 select-none z-30"
>
  {#each paletteTools as pt}
    {@const isActive = canvasStore.activeTool === pt.tool}
    <div class="relative group flex items-center">
      <button
        onclick={() => canvasStore.setTool(isActive ? 'pointer' : pt.tool)}
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all border {isActive
          ? `${pt.bg} ${pt.activeColor} ${pt.border} shadow-md scale-105`
          : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-800/50'}"
      >
        <pt.icon class="h-5 w-5" />
      </button>
      <div
        class="absolute left-full ml-3 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold font-mono text-zinc-100">{pt.title}</span>
          <span
            class="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-emerald-400 border border-zinc-700"
            >{pt.shortcut}</span
          >
        </div>
      </div>
    </div>
  {/each}
</aside>
