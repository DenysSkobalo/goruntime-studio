import type { RuntimeSnapshot } from '$core/engine/types';
import { canvasStore } from './canvas.store.svelte';
import { formatHex, getRawBaseAddress } from '$core/memory/layout';
import { isChannelNode, isGoroutineNode } from '$shared/types/nodes';

export function syncCanvasWithSnapshot(snapshot: RuntimeSnapshot | null): void {
  if (!snapshot || canvasStore.nodes.length === 0) return;

  Object.values(snapshot.goroutines).forEach((g) => {
    const node = canvasStore.nodes.find((n) => isGoroutineNode(n) && n.goid === g.goid);
    if (node && isGoroutineNode(node)) {
      node.status = g.status;
    }
  });

  Object.values(snapshot.channels).forEach((ch) => {
    const node = canvasStore.nodes.find(
      (n) => isChannelNode(n) && (n.label === ch.name || formatHex(getRawBaseAddress(n.id)) === ch.address)
    );
    if (node && isChannelNode(node)) {
      node.values = ch.buf.filter((b) => b !== null).map((b) => String(b.val));
      node.closed = ch.closed;
      node.capacity = ch.dataqsiz;
    }
  });
}
