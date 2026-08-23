<script lang="ts">
  import type { Snippet } from 'svelte';

  export type BadgeVariant = 'emerald' | 'amber' | 'cyan' | 'rose' | 'purple' | 'blue' | 'zinc' | 'orange' | 'teal' | 'pink' | 'lime';

  interface Props {
    variant?: BadgeVariant;
    children: Snippet;
  }

  let { variant = 'zinc', children }: Props = $props();

  const styles: Record<BadgeVariant, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    lime: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
    zinc: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };
</script>

<span class="px-2 py-0.5 rounded text-[10px] font-bold border font-mono inline-flex items-center gap-1 {styles[variant]}">
  {@render children()}
</span>
