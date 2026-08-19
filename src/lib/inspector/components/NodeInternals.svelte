<script lang="ts">
  import type { CanvasNode } from '../../canvas/types/nodes';
  import { timeline } from '../state/timeline.svelte';
  import NodeHeader from './NodeHeader.svelte';

  let { node }: { node: CanvasNode | null } = $props();

  let snapshot = $derived(timeline.currentSnapshot);

  function getRawBaseAddress(id: string, type: string): bigint {
    if (!id) return 0xc000083000n;
    let hash = 0n;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31n + BigInt(id.charCodeAt(i))) & 0xffffffffffffffffn;
    }
    const slotIndex = Math.abs(Number(hash % 64n));
    const stepBytes = type === 'goroutine' ? 512n : 128n;
    const baseAddr = 0xc000083000n + BigInt(slotIndex) * stepBytes;
    return baseAddr - (baseAddr % 8n);
  }

  function formatHex(addr: bigint): string {
    return `0x${addr.toString(16)}`;
  }

  let baseAddr = $derived(
    node ? getRawBaseAddress(node.id, node.type) : 0n
  );

  let nodeAddr = $derived(formatHex(baseAddr));

  // --- 1. CHANNEL (runtime.hchan) ---
  let hchanBufAddr = $derived.by(() => {
    if (!node || node.type !== 'channel') return 'nil (0x0)';
    const cap = (node as any).capacity ?? 0;
    if (cap === 0) return 'nil (0x0)';
    return formatHex(baseAddr + 96n);
  });

  let hchanData = $derived.by(() => {
    if (!node || node.type !== 'channel') return null;
    const chanNode = node as any;
    const fromTimeline = snapshot?.channels ? Object.values(snapshot.channels)[0] : null;
    return {
      qcount: fromTimeline?.qcount ?? (chanNode.values?.length ?? 0),
      dataqsiz: fromTimeline?.dataqsiz ?? (chanNode.capacity ?? 2),
      elemsize: 8,
      elemtype: 'runtime._type (int)',
      closed: fromTimeline?.closed ?? (chanNode.closed ?? false),
      sendx: fromTimeline?.sendx ?? 0,
      recvx: fromTimeline?.recvx ?? 0,
      sendqLen: fromTimeline?.sendq?.length ?? 0,
      recvqLen: fromTimeline?.recvq?.length ?? 0,
      isLocked: fromTimeline?.isLocked ?? false
    };
  });

  // --- 2. GOROUTINE (runtime.g) ---
  let gData = $derived.by(() => {
    if (!node || node.type !== 'goroutine') return null;
    const gNode = node as any;
    const goid = gNode.goid ?? 1;
    
    const stackLoRaw = baseAddr + 0x800n;
    const stackHiRaw = stackLoRaw + 2048n;

    return {
      goid,
      status: gNode.status ?? '_Grunnable',
      stackLo: formatHex(stackLoRaw),
      stackHi: formatHex(stackHiRaw),
      mAddr: formatHex(baseAddr + 0x100n),
      schedSp: formatHex(stackLoRaw + 128n),
      schedPc: '0x45f2a0 (main.main)'
    };
  });

  // --- 3. MUTEX (sync.Mutex) ---
  let mutexData = $derived.by(() => {
    if (!node || node.type !== 'mutex') return null;
    const mNode = node as any;
    const isLocked = mNode.locked ?? false;
    const isStarving = mNode.starving ?? false;
    const waiters = mNode.waitersCount ?? 0;

    let stateBits = 0;
    if (isLocked) stateBits |= 1;
    if (isStarving) stateBits |= 4;
    stateBits |= (waiters << 3);

    return {
      state: stateBits,
      isLocked,
      isStarving,
      waiters,
      sema: waiters > 0 ? 1 : 0
    };
  });

  // --- 4. WAITGROUP (sync.WaitGroup) ---
  let wgData = $derived.by(() => {
    if (!node || node.type !== 'waitgroup') return null;
    const wgNode = node as any;
    const counter = wgNode.counter ?? 0;
    const waiters = wgNode.waiterCount ?? 0;
    const state64 = (BigInt(counter) << 32n) | BigInt(waiters);

    return {
      counter,
      waiters,
      state64Hex: `0x${state64.toString(16).padStart(16, '0')}`,
      sema: waiters > 0 ? 1 : 0
    };
  });

  // --- 5. SELECT MULTIPLEXER (runtime.hselect) ---
  let selectData = $derived.by(() => {
    if (!node || node.type !== 'select') return null;
    const sNode = node as any;
    const casesList = sNode.cases ?? [];
    return {
      tcase: casesList.length,
      ncase: casesList.length,
      pollorderAddr: formatHex(baseAddr + 64n),
      lockorderAddr: formatHex(baseAddr + 96n)
    };
  });
</script>

{#if node}
  <div class="space-y-4 font-mono text-xs max-w-full overflow-hidden">
    <!-- Header Meta -->
    <div class="inner-card p-3 space-y-2 border-emerald-500/30">
      <div class="flex items-center justify-between text-[11px]">
        <span class="text-zinc-400">Node Identifier:</span>
        <span class="font-bold text-emerald-400 truncate ml-2">{node.label}</span>
      </div>
      <div class="flex items-center justify-between text-[11px]">
        <span class="text-zinc-400">Heap Struct Pointer (*{node.type}):</span>
        <span class="text-amber-400 font-bold">{nodeAddr}</span>
      </div>
    </div>

    <!-- 1. CHANNEL (runtime.hchan) -->
    {#if node.type === 'channel' && hchanData}
      <div class="glow-card p-4 space-y-3">
        <NodeHeader nodeType="channel" title="runtime.hchan" />

        <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2 text-[11px] overflow-x-hidden">
          <div class="text-zinc-500 font-bold">// src/runtime/chan.go</div>
          <div class="text-purple-400">type <span class="text-amber-300">hchan</span> struct &#123;</div>
          
          <div class="pl-3 space-y-1">
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">qcount <span class="text-cyan-400">uint</span></span>
              <span class="text-emerald-400 font-bold shrink-0">{hchanData.qcount}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">dataqsiz <span class="text-cyan-400">uint</span></span>
              <span class="text-emerald-400 font-bold shrink-0">{hchanData.dataqsiz}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">buf <span class="text-purple-400">unsafe.Pointer</span></span>
              <span class="text-amber-400 font-bold shrink-0">{hchanBufAddr}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">elemsize <span class="text-cyan-400">uint16</span></span>
              <span class="text-zinc-300 shrink-0">{hchanData.elemsize} B</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">closed <span class="text-cyan-400">uint32</span></span>
              <span class={hchanData.closed ? 'text-red-400 font-bold shrink-0' : 'text-zinc-400 shrink-0'}>{hchanData.closed ? '1' : '0'}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">elemtype <span class="text-purple-400">*_type</span></span>
              <span class="text-purple-300 font-bold shrink-0">{hchanData.elemtype}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">sendx <span class="text-cyan-400">uint</span></span>
              <span class="text-emerald-400 font-bold shrink-0">{hchanData.sendx}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">recvx <span class="text-cyan-400">uint</span></span>
              <span class="text-indigo-400 font-bold shrink-0">{hchanData.recvx}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">recvq <span class="text-amber-300">waitq</span></span>
              <span class="text-indigo-400 font-bold shrink-0">{hchanData.recvqLen} sudog</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">sendq <span class="text-amber-300">waitq</span></span>
              <span class="text-emerald-400 font-bold shrink-0">{hchanData.sendqLen} sudog</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">lock <span class="text-amber-300">mutex</span></span>
              <span class={hchanData.isLocked ? 'text-amber-400 font-bold shrink-0' : 'text-emerald-400 shrink-0'}>{hchanData.isLocked ? 'LOCKED' : 'UNLOCKED'}</span>
            </div>
          </div>

          <div class="text-purple-400">&#125;</div>
        </div>
      </div>

    <!-- 2. GOROUTINE (runtime.g) -->
    {:else if node.type === 'goroutine' && gData}
      <div class="glow-card p-4 space-y-3">
        <NodeHeader nodeType="goroutine" title="runtime.g" />

        <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2 text-[11px] overflow-x-hidden">
          <div class="text-zinc-500 font-bold">// src/runtime/runtime2.go</div>
          <div class="text-purple-400">type <span class="text-amber-300">g</span> struct &#123;</div>
          
          <div class="pl-3 space-y-1">
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">goid <span class="text-cyan-400">int64</span></span>
              <span class="text-emerald-400 font-bold shrink-0">{gData.goid}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">atomicstatus <span class="text-cyan-400">uint32</span></span>
              <span class="text-amber-400 font-bold shrink-0">{gData.status}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">stack <span class="text-amber-300">stack</span></span>
              <span class="text-zinc-400 shrink-0">2048 B (2KB)</span>
            </div>
            <div class="pl-3 border-l border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
              <div class="flex justify-between"><span>stack.lo:</span><span class="text-zinc-200 font-bold">{gData.stackLo}</span></div>
              <div class="flex justify-between"><span>stack.hi:</span><span class="text-zinc-200 font-bold">{gData.stackHi}</span></div>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">m <span class="text-purple-400">*m</span></span>
              <span class="text-indigo-400 font-bold shrink-0">{gData.mAddr}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">sched.sp <span class="text-cyan-400">uintptr</span></span>
              <span class="text-amber-300 font-bold shrink-0">{gData.schedSp}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">sched.pc <span class="text-cyan-400">uintptr</span></span>
              <span class="text-zinc-300 shrink-0">{gData.schedPc}</span>
            </div>
          </div>

          <div class="text-purple-400">&#125;</div>
        </div>
      </div>

    <!-- 3. MUTEX (sync.Mutex) -->
    {:else if node.type === 'mutex' && mutexData}
      <div class="glow-card p-4 space-y-3">
        <NodeHeader nodeType="mutex" title="sync.Mutex" />

        <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2 text-[11px] overflow-x-hidden">
          <div class="text-zinc-500 font-bold">// src/sync/mutex.go</div>
          <div class="text-purple-400">type <span class="text-amber-300">Mutex</span> struct &#123;</div>
          
          <div class="pl-3 space-y-1">
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">state <span class="text-cyan-400">int32</span></span>
              <span class="text-amber-400 font-bold shrink-0">{mutexData.state}</span>
            </div>
            <div class="pl-3 border-l border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
              <div class="flex justify-between"><span>bit 0 (locked):</span><span class={mutexData.isLocked ? "text-amber-400 font-bold" : "text-zinc-400"}>{mutexData.isLocked ? "1" : "0"}</span></div>
              <div class="flex justify-between"><span>bit 2 (starving):</span><span class={mutexData.isStarving ? "text-red-400 font-bold" : "text-zinc-400"}>{mutexData.isStarving ? "1" : "0"}</span></div>
              <div class="flex justify-between"><span>waiters count:</span><span class="text-emerald-400 font-bold">{mutexData.waiters}</span></div>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">sema <span class="text-cyan-400">uint32</span></span>
              <span class="text-purple-400 font-bold shrink-0">{mutexData.sema}</span>
            </div>
          </div>

          <div class="text-purple-400">&#125;</div>
        </div>
      </div>

    <!-- 4. WAITGROUP (sync.WaitGroup) -->
    {:else if node.type === 'waitgroup' && wgData}
      <div class="glow-card p-4 space-y-3">
        <NodeHeader nodeType="waitgroup" title="sync.WaitGroup" />

        <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2 text-[11px] overflow-x-hidden">
          <div class="text-zinc-500 font-bold">// src/sync/waitgroup.go</div>
          <div class="text-purple-400">type <span class="text-amber-300">WaitGroup</span> struct &#123;</div>
          
          <div class="pl-3 space-y-1">
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">noCopy <span class="text-amber-300">noCopy</span></span>
              <span class="text-zinc-500 shrink-0">// vet guard</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">state1 <span class="text-cyan-400">uint64</span></span>
              <span class="text-blue-400 font-bold shrink-0">{wgData.state64Hex}</span>
            </div>
            <div class="pl-3 border-l border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
              <div class="flex justify-between"><span>counter (high 32b):</span><span class="text-blue-400 font-bold">{wgData.counter}</span></div>
              <div class="flex justify-between"><span>waiters (low 32b):</span><span class="text-emerald-400 font-bold">{wgData.waiters}</span></div>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">sema <span class="text-cyan-400">uint32</span></span>
              <span class="text-purple-400 font-bold shrink-0">{wgData.sema}</span>
            </div>
          </div>

          <div class="text-purple-400">&#125;</div>
        </div>
      </div>

    <!-- 5. SELECT (runtime.hselect / scase) -->
    {:else if node.type === 'select' && selectData}
      <div class="glow-card p-4 space-y-3">
        <NodeHeader nodeType="select" title="runtime.hselect" />

        <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2 text-[11px] overflow-x-hidden">
          <div class="text-zinc-500 font-bold">// src/runtime/select.go</div>
          <div class="text-purple-400">type <span class="text-amber-300">hselect</span> struct &#123;</div>
          
          <div class="pl-3 space-y-1">
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">tcase <span class="text-cyan-400">uint16</span></span>
              <span class="text-purple-300 font-bold shrink-0">{selectData.tcase}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">ncase <span class="text-cyan-400">uint16</span></span>
              <span class="text-purple-300 font-bold shrink-0">{selectData.ncase}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">pollorder <span class="text-purple-400">*uint16</span></span>
              <span class="text-amber-400 font-bold shrink-0">{selectData.pollorderAddr}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="text-zinc-300 truncate">lockorder <span class="text-purple-400">*uint16</span></span>
              <span class="text-amber-400 font-bold shrink-0">{selectData.lockorderAddr}</span>
            </div>
          </div>

          <div class="text-purple-400">&#125;</div>
        </div>
      </div>
    {/if}
  </div>
{/if}