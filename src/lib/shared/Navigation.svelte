<script lang="ts">
  import { Activity, Network } from 'lucide-svelte';

  let { activeMode = $bindable() }: { activeMode: 'inspector' | 'canvas' } = $props();
</script>

<header class="border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur-md flex items-center justify-between">
  <div class="flex items-center gap-3">
  <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
    GoRuntime Studio 
  </h1>
</div>

  <nav class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
    <button
      onclick={() => activeMode = 'inspector'}
      class="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all
        {activeMode === 'inspector' ? 'bg-cyan-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}"
    >
      <Activity class="h-3.5 w-3.5" /> Runtime Inspector
    </button>

    <button
      onclick={() => activeMode = 'canvas'}
      class="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all
        {activeMode === 'canvas' ? 'bg-purple-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}"
    >
      <Network class="h-3.5 w-3.5" /> Concurrency Canvas
    </button>
  </nav>
</header>
