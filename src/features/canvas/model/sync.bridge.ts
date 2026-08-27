/**
 * @file src/features/canvas/model/sync.bridge.ts
 * @module features/canvas/model/sync.bridge
 *
 * @architecture Runtime Kernel Timeline Synchronization Bridge
 * @description Synchronizes execution state snapshots emitted by `tsgoruntime-kernel` directly into
 * reactive Svelte 5 canvas nodes.
 *
 * @see {@link canvasStore} Target reactive canvas store.
 * @see {@link applyGoroutineKernelState} Maps kernel goroutine execution status.
 * @see {@link applyChannelKernelState} Maps channel buffer queues and closed state.
 */

import type { RuntimeSnapshot } from 'tsgoruntime-kernel';
import { canvasStore } from './canvas.store.svelte';
import { applyChannelKernelState, applyGoroutineKernelState } from './canvas.mapper';

/**
 * Synchronizes active visual canvas nodes with execution snapshot state emitted by the kernel simulator.
 *
 * ANCHOR: SYNC_CANVAS_SNAPSHOT
 *
 * @remarks
 * **Why dual lookup is used for channels:**
 * Channels in the kernel can be referenced by human-readable string labels (`ch1`) or hex heap memory addresses (`0xc00004d000`).
 * Using `chMap.get(ch.name) ?? chMap.get(ch.address)` ensures reliable node resolution during dynamic simulation playback.
 *
 * @param snapshot - Immutable execution snapshot emitted by kernel execution step.
 */
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
