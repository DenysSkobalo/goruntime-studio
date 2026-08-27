<script lang="ts">
  /**
   * @file src/features/analyzer/ui/AnalyzerBanner.svelte
   * @module features/analyzer/ui/AnalyzerBanner
   *
   * @architecture Runtime Analysis Diagnostic Banner Component
   * @description Svelte 5 component displaying active execution issues, race conditions, deadlocks,
   * panics, and goroutine leak warnings derived from the timeline store state.
   *
   * @remarks
   * **Visual Hierarchy & Severity Mapping:**
   * Issues are categorized dynamically into visual severity tiers (Critical/Red, Warning/Amber, Info/Blue).
   * Maps issue severity levels to specific Lucide icons (`ShieldAlert`, `AlertTriangle`, `Info`).
   *
   * @see {@link timeline} Timeline store tracking execution step snapshots and detected runtime anomalies.
   */
  import { ShieldAlert, AlertTriangle, Info } from '@lucide/svelte';
  import { timeline } from '$features/inspector/model/timeline.store.svelte';

  /**
   * Reactive state derived from the global inspector timeline store issues array.
   *
   * ANCHOR: DERIVED_ISSUES
   */
  let filteredIssues = $derived(timeline.issues);

  /**
   * Resolves tailwind visual styling classes and dynamic Lucide icon components based on issue severity level.
   *
   * ANCHOR: SEVERITY_CONFIG_RESOLVER
   *
   * @remarks
   * **Why grouping panic/deadlock/leak:**
   * Panic, deadlock, and goroutine memory leak events represent fatal runtime states requiring high contrast
   * critical alert styling (`text-red-400`, `ShieldAlert`) to immediately draw user focus in the UI hierarchy.
   *
   * @param severity - Runtime issue severity key ('panic' | 'deadlock' | 'leak' | 'warning' | 'info').
   * @returns Object containing tailwind border/bg style utility string and icon component reference.
   */
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
  <!-- 
    ANCHOR: BANNER_CONTAINER
    Rendered conditionally only when active runtime issues or concurrency deadlocks exist in timeline.
  -->
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
