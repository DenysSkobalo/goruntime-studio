<script lang="ts">
  import { ShieldAlert, AlertTriangle, Info } from 'lucide-svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';
  import { canvasStore } from '$features/canvas/model/canvas.store.svelte';

  // Отримуємо списки типів та ID нод, що реально присутні на Canvas
  let activeNodeTypes = $derived(new Set(canvasStore.nodes.map(n => n.type)));

  // Фільтруємо issues: показуємо лише ті, які стосуються поточних типів нод на Canvas
  let filteredIssues = $derived(
    timeline.issues.filter(issue => {
      if (issue.type.includes('context') && !activeNodeTypes.has('context')) {
        return false;
      }
      return true;
    })
  );
</script>

{#if filteredIssues.length > 0}
  <div class="shrink-0 z-30 w-full bg-rose-950/80 border-b border-rose-500/30 px-4 py-2 font-mono text-xs backdrop-blur-md animate-fade-in select-none">
    <div class="max-w-7xl mx-auto flex flex-col gap-1.5">
      {#each filteredIssues as issue (issue.id)}
        <div class="flex items-center justify-between text-rose-200">
          <div class="flex items-center gap-2">
            {#if issue.severity === 'error'}
              <ShieldAlert class="w-4 h-4 text-rose-400 shrink-0" />
            {:else if issue.severity === 'warning'}
              <AlertTriangle class="w-4 h-4 text-amber-400 shrink-0" />
            {:else}
              <Info class="w-4 h-4 text-cyan-400 shrink-0" />
            {/if}
            <span class="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded border {issue.severity === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}">
              {issue.type}
            </span>
            <span>{issue.message}</span>
          </div>
          {#if issue.goid}
            <span class="text-zinc-400 text-[10px]">Goroutine: G{issue.goid}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
