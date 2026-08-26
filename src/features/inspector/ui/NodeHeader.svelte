<script lang="ts">
  import { RUNTIME_DOCS } from '$features/docs/data/runtime-docs';
  import type { CanvasNodeType } from '$shared/types/nodes';
  import type { RuntimeDoc } from '$features/docs/data/types';
  import { ExternalLink, BookOpen, Cpu, Database, Link2 } from '@lucide/svelte';

  let { nodeType, title = '' }: { nodeType: CanvasNodeType; title?: string } = $props();

  const DOC_ID_MAP: Record<CanvasNodeType, string> = {
    goroutine: 'goroutine',
    channel: 'channel',
    mcache: 'mcache',
    mcentral: 'mcentral',
    mheap: 'mheap',
    sudog: 'sudog',
    p: 'p',
    m: 'm',
  };

  let docId = $derived(DOC_ID_MAP[nodeType]);
  let doc = $derived(docId ? RUNTIME_DOCS.find((d: RuntimeDoc) => d.id === docId) : undefined);

  function openPlatformDocs(id: string) {
    window.location.hash = `#docs#${id}`;
  }
</script>

<div class="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3 gap-2 w-full">
  <div class="flex items-center gap-2 min-w-0 flex-1">
    {#if nodeType === 'goroutine'}
      <Cpu class="h-4 w-4 shrink-0 text-emerald-400" />
    {:else if nodeType === 'channel'}
      <Database class="h-4 w-4 shrink-0 text-cyan-400" />
    {:else}
      <Link2 class="h-4 w-4 shrink-0 text-amber-400" />
    {/if}
    <h3 class="text-xs font-bold font-mono text-zinc-100 truncate tracking-tight" {title}>
      {title}
    </h3>
  </div>

  {#if doc}
    {@const currentDoc = doc}
    <div class="flex items-center gap-1.5 shrink-0">
      <a
        href={currentDoc.source.repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 font-mono text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 px-2 py-0.5 rounded border border-zinc-800 transition-all"
      >
        <span>{currentDoc.structName}</span>
        <ExternalLink class="w-3 h-3 text-zinc-500" />
      </a>
      <button
        onclick={() => openPlatformDocs(currentDoc.id)}
        class="p-1 text-zinc-400 hover:text-sky-400 rounded transition cursor-pointer"
        title="Open Platform Specification"
      >
        <BookOpen class="w-3.5 h-3.5" />
      </button>
    </div>
  {/if}
</div>
