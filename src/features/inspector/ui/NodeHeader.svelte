<script lang="ts">
  /**
   * @file src/features/inspector/ui/NodeHeader.svelte
   * @module features/inspector/ui/NodeHeader
   *
   * @architecture Inspector Header & Platform Spec Link Component
   * @description Top navigation header for inspector cards containing primitive title, optional subtitle badge,
   * and platform specification deep-link trigger.
   *
   * @see {@link navigateToSpec} Navigation spec dispatcher utility.
   */
  import { BookOpen, ExternalLink } from '@lucide/svelte';
  import { i18n } from '$core/i18n';
  import { navigateToSpec } from '$shared/lib/navigation';

  /**
   * Header component input props contract.
   * ANCHOR: NODE_HEADER_PROPS
   */
  interface Props {
    title: string;
    primitiveId?: 'goroutine' | 'channel' | 'sudog';
    nodeType?: 'goroutine' | 'channel' | 'sudog';
    subtitle?: string;
  }

  let { title, primitiveId, nodeType, subtitle }: Props = $props();

  /** Resolved target primitive identifier key string (`'goroutine'`, `'channel'`, `'sudog'`). ANCHOR: ACTIVE_ID_DERIVED */
  let activeId = $derived(primitiveId || nodeType || 'goroutine');
</script>

<!-- ANCHOR: NODE_HEADER_CONTAINER -->
<div class="flex items-center justify-between pb-2.5 border-b border-zinc-800 font-mono">
  <div class="flex items-center gap-2 min-w-0">
    <h3 class="text-xs font-bold text-zinc-100 truncate">{title}</h3>
    {#if subtitle}
      <span class="text-[10px] text-zinc-400 font-medium truncate">({subtitle})</span>
    {/if}
  </div>

  <!-- ANCHOR: SPEC_BADGE_LINK -->
  <a
    href="#docs#{activeId}"
    target="_blank"
    rel="noopener noreferrer"
    onclick={(e) => navigateToSpec(e, activeId)}
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-medium transition cursor-pointer shrink-0"
    title={i18n.t('docs.platformSpec') || 'Platform Specification'}
  >
    <BookOpen class="w-3 h-3 text-purple-400" />
    <span>Spec</span>
    <ExternalLink class="w-2.5 h-2.5 text-purple-400/70" />
  </a>
</div>
