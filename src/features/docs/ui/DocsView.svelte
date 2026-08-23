<script lang="ts">
  import { ExternalLink, Cpu, ShieldAlert, Code2, ArrowLeft } from 'lucide-svelte';
  import { RUNTIME_DOCS } from '../data/runtime-docs';
  import type { RuntimeDocEntry } from '../data/types';

  let { onBack }: { onBack?: () => void } = $props();

  const docsList = Object.values(RUNTIME_DOCS) as RuntimeDocEntry[];
</script>

<div class="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans select-none">
  <header class="max-w-6xl mx-auto border-b border-zinc-800 pb-6 mb-8 flex items-center justify-between">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <Cpu class="w-7 h-7 text-emerald-400" />
        <h1 class="text-2xl font-bold tracking-tight text-white">Go Runtime Internals & Specifications</h1>
      </div>
      <p class="text-zinc-400 text-xs md:text-sm max-w-3xl font-mono">
        Low-level specifications for Go Runtime primitives (64-bit architecture: x86_64 / ARM64).
      </p>
    </div>

    {#if onBack}
      <button
        onclick={onBack}
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition"
      >
        <ArrowLeft class="w-4 h-4" /> Back to Studio
      </button>
    {/if}
  </header>

  <main class="max-w-6xl mx-auto space-y-10">
    <section class="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 text-amber-200/90 text-sm font-mono">
      <div class="flex items-center gap-2 font-semibold mb-2 text-amber-400">
        <ShieldAlert class="w-5 h-5" />
        <b>System Model Assumptions & Constraints</b>
      </div>
      <ul class="list-disc list-inside space-y-1 text-xs text-amber-200/80">
        <li><b>Pointer Alignment:</b> Pointer width is 8 Bytes (64-bit).</li>
        <li><b>GC Write Barriers:</b> Direct Stack Transfer via <code>runtime.memmove</code>.</li>
      </ul>
    </section>

    {#each docsList as entry (entry.id)}
      <article id={entry.id} class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 scroll-mt-8 space-y-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold text-white">{entry.title}</h2>
              <span class="font-mono text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                {entry.structName}
              </span>
              <span class="text-xs text-zinc-500 font-mono">
                Size: ~{entry.sizeBytes64Bit} B
              </span>
            </div>
            <p class="text-zinc-400 text-sm mt-2">{entry.description}</p>
          </div>

          <div class="flex items-center gap-2 font-mono">
            <a
              href={entry.source.repoUrl}
              target="_blank"
              rel="noreferrer"
              class="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 bg-zinc-800 px-3 py-1.5 rounded-md transition"
            >
              <ExternalLink class="w-3.5 h-3.5" /> Source ({entry.source.file})
            </a>
          </div>
        </div>

        <div>
          <b class="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2 font-mono">Invariants & Behaviors</b>
          <ul class="list-disc list-inside space-y-1 text-xs text-zinc-400 font-mono">
            {#each entry.keyInvariants as inv}
              <li>{inv}</li>
            {/each}
          </ul>
        </div>

        <div>
          <b class="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2 font-mono">Memory Alignment & Field Offsets (64-bit)</b>
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-zinc-500">
                  <th class="py-2 px-3">Offset</th>
                  <th class="py-2 px-3">Field</th>
                  <th class="py-2 px-3">Type</th>
                  <th class="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/50">
                {#each entry.memoryLayout as row}
                  <tr class="hover:bg-zinc-800/30 text-zinc-300">
                    <td class="py-2 px-3 text-emerald-400">{row.offset}</td>
                    <td class="py-2 px-3 font-bold text-zinc-200">{row.field}</td>
                    <td class="py-2 px-3 text-cyan-400">{row.type}</td>
                    <td class="py-2 px-3 text-zinc-400 font-sans">{row.note}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    {/each}
  </main>
</div>
