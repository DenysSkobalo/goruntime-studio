<script lang="ts">
  import { ExternalLink, BookOpen, Cpu, Database, Lock, Users, Shuffle, Link2 } from 'lucide-svelte';
  import { RUNTIME_DOCS } from '../../docs/runtime_docs';
  import type { CanvasNodeType } from '../../types/nodes';

  let { nodeType, title }: { nodeType: CanvasNodeType | 'sudog'; title: string } = $props();

  let doc = $derived(RUNTIME_DOCS[nodeType]);

  function getIcon(type: CanvasNodeType | 'sudog') {
    switch (type) {
      case 'goroutine': return Cpu;
      case 'channel': return Database;
      case 'mutex': return Lock;
      case 'waitgroup': return Users;
      case 'select': return Shuffle;
      case 'sudog': return Link2;
      default: return Cpu;
    }
  }

  let IconComponent = $derived(getIcon(nodeType));
</script>

<div class="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3 gap-2 w-full">
  <div class="flex items-center gap-2 min-w-0 flex-1">
    <IconComponent class="h-4 w-4 shrink-0 text-emerald-400" />
    <h3 class="text-xs font-bold font-mono text-zinc-100 truncate tracking-tight" title={title}>
      {title}
    </h3>
  </div>

  {#if doc}
    <div class="flex items-center gap-1.5 shrink-0">
      <a
        href={doc.source.repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 font-mono text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 px-2 py-0.5 rounded border border-zinc-800 hover:border-emerald-500/40 transition-all duration-150 group"
        title="View Go Source ({doc.source.file})"
      >
        <span>{doc.structName}</span>
        <ExternalLink class="w-3 h-3 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
      </a>

      <a
        href="#docs#{doc.id}"
        class="p-1 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 rounded transition-colors"
        title="Open Spec & Memory Layout Documentation"
      >
        <BookOpen class="w-3.5 h-3.5" />
      </a>
    </div>
  {/if}
</div>