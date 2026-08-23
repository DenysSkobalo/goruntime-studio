<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { BadgeVariant } from './StatusBadge.svelte';

  interface Props {
    onclick: () => void;
    variant?: BadgeVariant;
    icon?: Component<{ class?: string }>;
    children: Snippet;
  }

  let { onclick, variant = 'cyan', icon: Icon, children }: Props = $props();

  const styles: Record<BadgeVariant, string> = {
    cyan: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30',
    orange: 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border-orange-500/30',
    teal: 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/30',
    pink: 'bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border-pink-500/30',
    lime: 'bg-lime-500/15 hover:bg-lime-500/25 text-lime-300 border-lime-500/30',
    zinc: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700',
  };
</script>

<button
  {onclick}
  class="flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-lg font-bold font-mono text-xs transition {styles[variant]}"
>
  {#if Icon}
    <Icon class="w-3.5 h-3.5 shrink-0" />
  {/if}
  {@render children()}
</button>
