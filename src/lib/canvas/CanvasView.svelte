<script lang="ts">
  import { Network, Plus, Play } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-6xl h-[calc(100vh-8rem)] flex flex-col gap-4">
  <div class="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs">
    <div class="flex items-center gap-2 text-slate-300">
	  <Network class="h-4 w-4 text-purple-400" />
	  <span class="font-bold text-white">GoRuntime Studio Canvas</span> (Node Graph Builder)
	</div>
    <div class="flex items-center gap-2">
      <button class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition">
        <Plus class="h-3.5 w-3.5" /> Add Node
      </button>
      <button class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition">
        <Play class="h-3.5 w-3.5" /> Simulate Graph
      </button>
    </div>
  </div>

  <div class="flex-1 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center p-8 text-center">
    <Network class="h-12 w-12 text-slate-700 mb-3 animate-pulse" />
    <h3 class="font-mono text-base font-bold text-slate-300">Canvas Editor Initialized</h3>
    <p class="font-mono text-xs text-slate-500 max-w-md mt-1">
      Drag-and-drop node graph engine (`@xyflow/svelte`) will be mounted here to construct visual goroutines and channel topographies.
    </p>
  </div>
</div>
