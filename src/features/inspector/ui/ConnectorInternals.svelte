<script lang="ts">
  import type { CanvasEdge, CanvasNode } from '$shared/types/nodes';
  import { formatHex } from '$core/memory/layout';
  import { i18n } from '$core/i18n';
  import { GO_RUNTIME_LINKS } from '$shared/config/links';
  import NodeHeader from './NodeHeader.svelte';
  import { ArrowLeftRight, Code2, BookOpen, ExternalLink, ChevronRight } from '@lucide/svelte';
  import { handleDocLinkClick } from '$shared/lib/navigation';

  interface Props {
    edge: CanvasEdge;
    gNode: CanvasNode;
    targetNode: CanvasNode;
    sudogAddress: bigint;
    gAddress: bigint;
    targetAddress: bigint;
    elemAddress: bigint;
  }

  let {
    edge: _edge,
    gNode,
    targetNode: _targetNode,
    sudogAddress,
    gAddress,
    targetAddress,
    elemAddress,
  }: Props = $props();

  let formattedDesc = $derived(
    i18n.t('connector.directStackTransferDesc').replace('{gNode}', gNode.label),
  );

  function onSudogClick(e: MouseEvent) {
    handleDocLinkClick(e, '#docs#sudog');
  }
</script>

<div class="space-y-4 font-mono text-xs">
  <div class="glow-card p-3.5 space-y-2 border border-zinc-800 bg-zinc-900/60 rounded-xl">
    <div class="flex justify-between items-center">
      <span class="text-zinc-400">{i18n.t('connector.sudogHeapAddress')}:</span>
      <span class="text-amber-400 font-bold">{formatHex(sudogAddress)}</span>
    </div>
  </div>

  <div class="glow-card p-3.5 space-y-3 border border-zinc-800 bg-zinc-900/60 rounded-xl">
    <NodeHeader nodeType="sudog" title={i18n.t('inspector.descriptorSudog')} />
    <div class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2">
      <div class="flex justify-between">
        <span class="text-zinc-400">g (*g):</span>
        <span class="text-emerald-400 font-bold">{formatHex(gAddress)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-400">elem (unsafe.Pointer):</span>
        <span class="text-amber-300 font-bold">{formatHex(elemAddress)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-400">c (*hchan):</span>
        <span class="text-cyan-400 font-bold">{formatHex(targetAddress)}</span>
      </div>
    </div>
  </div>

  <div
    class="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-200/90 leading-relaxed text-[11px]"
  >
    <div class="flex items-center gap-2 font-bold text-cyan-400 mb-1">
      <ArrowLeftRight class="w-4 h-4 shrink-0" />
      {i18n.t('connector.directStackTransferTitle')}
    </div>
    {formattedDesc}
  </div>

  <div class="glow-card p-3.5 space-y-2.5 border border-zinc-800 bg-zinc-950/80 rounded-xl">
    <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
      {i18n.t('inspector.docAndSpec')}
    </span>
    <div class="flex flex-col gap-2 w-full">
      <a
        href={GO_RUNTIME_LINKS.GOROUTINE_SPEC}
        target="_blank"
        rel="noopener noreferrer"
        class="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-semibold transition group"
      >
        <span class="flex items-center gap-2">
          <Code2 class="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          <span>Go Source (runtime2.go)</span>
        </span>
        <ExternalLink class="w-3.5 h-3.5 shrink-0 text-zinc-500" />
      </a>

      <a
        href="#docs#sudog"
        target="_blank"
        rel="noopener noreferrer"
        onclick={onSudogClick}
        class="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 text-xs font-semibold transition cursor-pointer group"
      >
        <span class="flex items-center gap-2">
          <BookOpen class="w-4 h-4 shrink-0 text-amber-400" />
          <span>{i18n.t('docs.platformSpec')}</span>
        </span>
        <ChevronRight
          class="w-4 h-4 shrink-0 text-amber-500/60 group-hover:translate-x-0.5 transition-transform"
        />
      </a>
    </div>
  </div>
</div>
