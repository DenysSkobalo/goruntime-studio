/**
 * @file src/features/canvas/model/canvas.mapper.ts
 * @module features/canvas/model/canvas.mapper
 *
 * @architecture Pure Kernel State Mapper Utility
 * @description Maps execution kernel state objects into reactive UI canvas node models.
 */

import type { GoroutineNode, ChannelNode } from '$shared/types/nodes';

/**
 * Kernel Goroutine snapshot state contract.
 */
export interface KernelGoroutineState {
  goid: number;
  status: GoroutineNode['status'];
}

/**
 * Kernel Channel snapshot state contract.
 */
export interface KernelChannelState {
  name: string;
  address: string;
  buf: Array<{ id: string; val: unknown } | null> | null;
  closed: boolean;
  dataqsiz: number;
}

/**
 * Maps kernel Goroutine execution status to the target canvas node.
 *
 * ANCHOR: MAP_GOROUTINE_STATE
 *
 * @param node - Visual canvas Goroutine node.
 * @param g - Kernel Goroutine snapshot state.
 */
export function applyGoroutineKernelState(node: GoroutineNode, g: KernelGoroutineState): void {
  node.status = g.status;
}

/**
 * Maps kernel Channel buffer slots, closed state, and capacity to the visual canvas node.
 *
 * ANCHOR: MAP_CHANNEL_STATE
 *
 * @remarks
 * **Why null filtering is applied to buffer:**
 * The kernel ring buffer array may contain `null` entries representing empty buffer slots.
 * Filtering `null` entries ensures only active enqueued element values are displayed on visual node progress bars.
 *
 * @param node - Visual canvas Channel node.
 * @param ch - Kernel Channel snapshot state.
 */
export function applyChannelKernelState(node: ChannelNode, ch: KernelChannelState): void {
  const buf = ch.buf ?? [];
  node.values = buf
    .filter((b): b is { id: string; val: unknown } => b !== null)
    .map((b) => String(b.val));
  node.closed = ch.closed;
  node.capacity = ch.dataqsiz;
}
