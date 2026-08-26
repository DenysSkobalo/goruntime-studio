import type { RuntimeSnapshot } from 'tsgoruntime-kernel';
import { canvasStore } from './canvas.store.svelte';
import { applyChannelKernelState, applyGoroutineKernelState } from './canvas.mapper';

export function syncCanvasWithSnapshot(snapshot: RuntimeSnapshot | null): void {
  if (!snapshot || canvasStore.nodes.length === 0) return;

  const gMap = canvasStore.goroutinesByGoid;
  const chMap = canvasStore.channelsByLabelOrAddress;

  Object.values(snapshot.goroutines).forEach((g) => {
    const node = gMap.get(g.goid);
    if (node) {
      applyGoroutineKernelState(node, g);
    }
  });

  Object.values(snapshot.channels).forEach((ch) => {
    const node = chMap.get(ch.name) ?? chMap.get(ch.address);
    if (node) {
      applyChannelKernelState(node, ch);
    }
  });
}
