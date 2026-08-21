import type { RuntimeSnapshot } from "$core/engine/types";
import { canvasStore } from "./canvas.store.svelte";

/**
 * Синхронізує стан Canvas-вузлів (Goroutine, Channel, Mutex, WaitGroup) із поточним знімком рантайму.
 * Автоматично будує початкову топологію графічних вузлів при первинній ініціалізації.
 */
export function syncCanvasWithSnapshot(snapshot: RuntimeSnapshot | null): void {
  if (!snapshot) return;

  // Автоматична побудова топології полотна при порожньому стані
  if (canvasStore.nodes.length === 0) {
    const g1 = snapshot.goroutines[1];
    if (g1) {
      canvasStore.nodes.push({
        id: 'goroutine-1',
        type: 'goroutine',
        position: { x: 60, y: 120 },
        label: 'G1 (main)',
        goid: 1,
        status: g1.status,
        instructions: []
      });
    }

    const ch1 = snapshot.channels['0x00c000082000'];
    if (ch1) {
      canvasStore.nodes.push({
        id: 'channel-1',
        type: 'channel',
        position: { x: 280, y: 70 },
        label: 'ch1',
        capacity: ch1.dataqsiz,
        values: ch1.buf.filter((b) => b !== null).map((b) => String(b.val)),
        closed: ch1.closed
      });
    }

    const ch2 = snapshot.channels['0x00c000082080'];
    if (ch2) {
      canvasStore.nodes.push({
        id: 'channel-2',
        type: 'channel',
        position: { x: 280, y: 210 },
        label: 'ch2',
        capacity: ch2.dataqsiz,
        values: ch2.buf.filter((b) => b !== null).map((b) => String(b.val)),
        closed: ch2.closed
      });
    }

    if (snapshot.mutexes && snapshot.mutexes['0x00c000090000']) {
      const mu = snapshot.mutexes['0x00c000090000'];
      canvasStore.nodes.push({
        id: 'mutex-1',
        type: 'mutex',
        position: { x: 500, y: 70 },
        label: mu.name,
        locked: mu.locked,
        starving: mu.starving,
        waitersCount: mu.waitersCount
      });
    }

    if (snapshot.waitGroups && snapshot.waitGroups['0x00c000090080']) {
      const wg = snapshot.waitGroups['0x00c000090080'];
      canvasStore.nodes.push({
        id: 'waitgroup-1',
        type: 'waitgroup',
        position: { x: 500, y: 210 },
        label: wg.name,
        counter: wg.counter,
        waiterCount: wg.waiterCount
      });
    }

    canvasStore.addEdge('goroutine-1', 'channel-1', 'data_flow');
    canvasStore.addEdge('goroutine-1', 'channel-2', 'data_flow');
    canvasStore.addEdge('goroutine-1', 'mutex-1', 'sync_lock');
    canvasStore.addEdge('goroutine-1', 'waitgroup-1', 'context_signal');
    return;
  }

  // Реактивна синхронізація станів існуючих вузлів
  Object.values(snapshot.goroutines).forEach((g) => {
    const node = canvasStore.nodes.find(
      (n) => n.type === 'goroutine' && (n as any).goid === g.goid
    );
    if (node) {
      (node as any).status = g.status;
    }
  });

  Object.values(snapshot.channels).forEach((ch) => {
    const node = canvasStore.nodes.find(
      (n) => n.type === 'channel' && ((n as any).label === ch.name.split(' ')[0] || (n as any).id.includes(ch.name.startsWith('ch1') ? 'channel-1' : 'channel-2'))
    );
    if (node) {
      const channelNode = node as any;
      channelNode.values = ch.buf.filter((b) => b !== null).map((b) => String(b.val));
      channelNode.closed = ch.closed;
      channelNode.capacity = ch.dataqsiz;
    }
  });

  if (snapshot.mutexes) {
    Object.values(snapshot.mutexes).forEach((mu) => {
      const node = canvasStore.nodes.find(
        (n) => n.type === 'mutex' && ((n as any).label === mu.name || (n as any).id === 'mutex-1')
      );
      if (node) {
        const mutexNode = node as any;
        mutexNode.locked = mu.locked;
        mutexNode.starving = mu.starving;
        mutexNode.waitersCount = mu.waitersCount;
      }
    });
  }

  if (snapshot.waitGroups) {
    Object.values(snapshot.waitGroups).forEach((wg) => {
      const node = canvasStore.nodes.find(
        (n) => n.type === 'waitgroup' && ((n as any).label === wg.name || (n as any).id === 'waitgroup-1')
      );
      if (node) {
        const wgNode = node as any;
        wgNode.counter = wg.counter;
        wgNode.waiterCount = wg.waiterCount;
      }
    });
  }
}