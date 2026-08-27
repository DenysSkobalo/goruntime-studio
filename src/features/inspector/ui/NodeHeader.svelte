<script lang="ts">
  /**
   * @file NodeHeader.svelte
   * @description Top header bar for Node Card Inspector.
   */
  import { BookOpen, ExternalLink } from '@lucide/svelte';
  import { i18n } from '$core/i18n';
  import { handleDocLinkClick } from '$shared/lib/navigation';

  interface Props {
    title: string;
    primitiveId?: 'goroutine' | 'channel' | 'sudog';
    nodeType?: 'goroutine' | 'channel' | 'sudog';
    subtitle?: string;
  }

  let { title, primitiveId, nodeType, subtitle }: Props = $props();

  let activeId = $derived(primitiveId || nodeType || 'goroutine');

  function onSpecClick(e: MouseEvent) {
    handleDocLinkClick(e, `#docs#${activeId}`);
  }
</script>

<div class="flex items-center justify-between pb-2.5 border-b border-zinc-800 font-mono">
  <div class="flex items-center gap-2 min-w-0">
    <h3 class="text-xs font-bold text-zinc-100 truncate">{title}</h3>
    {#if subtitle}
      <span class="text-[10px] text-zinc-400 font-medium truncate">({subtitle})</span>
    {/if}
  </div>

  <!-- Header Badge matching global Spec theme -->
  <a
    href="#docs#{activeId}"
    target="_blank"
    rel="noopener noreferrer"
    onclick={onSpecClick}
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-medium transition cursor-pointer shrink-0"
    title={i18n.t('docs.platformSpec') || 'Platform Specification'}
  >
    <BookOpen class="w-3 h-3 text-purple-400" />
    <span>Spec</span>
    <ExternalLink class="w-2.5 h-2.5 text-purple-400/70" />
  </a>
</div>
