<script lang="ts">
  import { ShieldAlert, AlertTriangle, Info } from '@lucide/svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';

  let filteredIssues = $derived(timeline.issues);

  function getSeverityConfig(severity: string) {
    if (severity === 'panic' || severity === 'deadlock' || severity === 'leak') {
      return {
        style: 'border-red-500/30 bg-red-500/10 text-red-400',
        icon: ShieldAlert,
      };
    }
    if (severity === 'warning') {
      return {
        style: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        icon: AlertTriangle,
      };
    }
    return {
      style: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      icon: Info,
    };
  }
</script>

{#if filteredIssues.length > 0}
  <div
    class="flex flex-col gap-2 p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl font-mono text-xs"
  >
    {#each filteredIssues as issue}
      {@const issueExt = issue as unknown as { type?: string; code?: string }}
      {@const config = getSeverityConfig(issue.severity)}
      {@const IconComponent = config.icon}

      <div class="flex items-center justify-between p-2 rounded-lg border text-xs {config.style}">
        <div class="flex items-center gap-2">
          <IconComponent class="w-4 h-4 shrink-0" />
          <span>{issue.message}</span>
        </div>
        <span
          class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-black/40"
        >
          {issueExt.type ?? issueExt.code ?? issue.severity}
        </span>
      </div>
    {/each}
  </div>
{/if}
