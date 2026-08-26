<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$core/i18n';
  import { RUNTIME_DOCS } from '../data/runtime-docs';
  import type { LocalizedString } from '../data/types';
  import {
    ArrowLeft,
    BookOpen,
    Cpu,
    Database,
    Link2,
    ExternalLink,
    Search,
    ShieldCheck,
    Settings,
  } from '@lucide/svelte';

  interface Props {
    onBack?: () => void;
    onOpenSettings?: () => void;
  }

  let { onBack, onOpenSettings }: Props = $props();

  let searchQuery = $state('');
  let activeDocId = $state<string>('goroutine');

  function getLoc(text: LocalizedString | string): string {
    if (typeof text === 'string') return text;
    return text[i18n.lang] || text.en;
  }

  function parseHash() {
    const hash = window.location.hash;
    if (hash.includes('#docs#')) {
      const targetId = hash.split('#docs#')[1];
      if (targetId && RUNTIME_DOCS.some((d) => d.id === targetId)) {
        activeDocId = targetId;
      }
    }
  }

  onMount(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  });

  let filteredDocs = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return RUNTIME_DOCS;
    return RUNTIME_DOCS.filter(
      (doc) =>
        doc.structName.toLowerCase().includes(query) ||
        getLoc(doc.title).toLowerCase().includes(query) ||
        getLoc(doc.description).toLowerCase().includes(query) ||
        doc.memoryLayout.some(
          (m) =>
            m.field.toLowerCase().includes(query) ||
            m.type.toLowerCase().includes(query) ||
            getLoc(m.note).toLowerCase().includes(query),
        ),
    );
  });

  let activeDoc = $derived(
    filteredDocs.find((d) => d.id === activeDocId) ?? filteredDocs[0] ?? RUNTIME_DOCS[0],
  );

  function getDocIcon(id: string) {
    if (id === 'goroutine') return Cpu;
    if (id === 'channel') return Database;
    return Link2;
  }
</script>

<div class="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col">
  <!-- Top Navigation Header -->
  <header
    class="shrink-0 h-14 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-4 flex items-center justify-between font-mono sticky top-0 z-30"
  >
    <div class="flex items-center gap-3">
      <button
        onclick={() => (onBack ? onBack() : (window.location.hash = ''))}
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition text-xs font-mono font-medium"
        title={i18n.t('common.workspace')}
      >
        <ArrowLeft class="w-3.5 h-3.5 text-emerald-400" />
        <span class="hidden sm:inline">{i18n.t('common.workspace')}</span>
      </button>

      <span class="text-zinc-700 font-normal">/</span>

      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <BookOpen class="w-4 h-4" />
        </div>
        <span class="text-sm font-bold text-white tracking-tight">GoRuntime Spec & Docs</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="relative w-48 sm:w-64 md:w-80">
        <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={i18n.t('docs.searchPlaceholder')}
          class="w-full bg-zinc-900/90 border border-zinc-800 focus:border-purple-500/50 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-100 outline-none transition font-mono"
        />
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
    <aside class="lg:col-span-4 space-y-2 font-mono">
      <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block px-1 mb-2">
        {i18n.t('docs.primitivesHeader')}
      </span>

      {#each filteredDocs as doc (doc.id)}
        {@const Icon = getDocIcon(doc.id)}
        {@const isActive = activeDoc?.id === doc.id}
        <button
          onclick={() => {
            activeDocId = doc.id;
            window.location.hash = `#docs#${doc.id}`;
          }}
          class="w-full text-left p-3 rounded-xl border transition flex items-center gap-3 {isActive
            ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-lg'
            : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
        >
          <div
            class="p-2 rounded-lg border shrink-0 {isActive
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-500'}"
          >
            <Icon class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold font-mono text-zinc-100">{doc.structName}</div>
            <div class="text-[10px] text-zinc-500 truncate mt-0.5">{getLoc(doc.title)}</div>
          </div>
        </button>
      {/each}
    </aside>

    <section class="lg:col-span-8 space-y-6 font-mono">
      {#if activeDoc}
        {@const Icon = getDocIcon(activeDoc.id)}

        <div class="glow-card p-6 border border-zinc-800 bg-zinc-900/60 rounded-2xl space-y-4">
          <div class="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div class="flex items-center gap-3">
              <div
                class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400"
              >
                <Icon class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-base font-bold text-white font-mono">{activeDoc.structName}</h2>
                <p class="text-xs text-zinc-400 mt-0.5">{getLoc(activeDoc.title)}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-amber-400 font-bold"
              >
                {activeDoc.sizeBytes64Bit} B (64-bit)
              </span>
              <a
                href={activeDoc.source.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition border border-zinc-700"
              >
                <span>{activeDoc.source.file}</span>
                <ExternalLink class="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>

          <p class="text-xs text-zinc-300 leading-relaxed font-sans">{getLoc(activeDoc.description)}</p>

          <div class="space-y-2 pt-2">
            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              {i18n.t('docs.keyInvariants')}
            </span>
            <div class="grid grid-cols-1 gap-2">
              {#each activeDoc.keyInvariants as invariant}
                <div
                  class="flex items-start gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs text-emerald-300/90"
                >
                  <ShieldCheck class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{getLoc(invariant)}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="glow-card p-6 border border-zinc-800 bg-zinc-900/60 rounded-2xl space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white uppercase tracking-wider">
              {i18n.t('docs.memoryLayout')} ({activeDoc.structName})
            </span>
            <span class="text-[10px] text-zinc-500">{i18n.t('docs.size64Bit')}</span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                <tr>
                  <th class="py-2.5 px-4 font-semibold">{i18n.t('docs.offset')}</th>
                  <th class="py-2.5 px-4 font-semibold">{i18n.t('docs.field')}</th>
                  <th class="py-2.5 px-4 font-semibold">{i18n.t('docs.type')}</th>
                  <th class="py-2.5 px-4 font-semibold">{i18n.t('docs.note')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                {#each activeDoc.memoryLayout as row}
                  <tr class="hover:bg-zinc-900/40 transition">
                    <td class="py-2.5 px-4 text-amber-400 font-bold">{row.offset}</td>
                    <td class="py-2.5 px-4 text-cyan-300 font-bold">{row.field}</td>
                    <td class="py-2.5 px-4 text-purple-300">{row.type}</td>
                    <td class="py-2.5 px-4 text-zinc-400 text-[11px] font-sans">{getLoc(row.note)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </section>
  </main>
</div>
