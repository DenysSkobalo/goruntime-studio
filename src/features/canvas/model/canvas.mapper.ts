import type { GoroutineNode, ChannelNode } from '$shared/types/nodes';

export interface KernelGoroutineState {
  goid: number;
  status: GoroutineNode['status'];
}

export interface KernelChannelState {
  name: string;
  address: string;
  buf: Array<{ id: string; val: unknown } | null> | null;
  closed: boolean;
  dataqsiz: number;
}

export function applyGoroutineKernelState(node: GoroutineNode, g: KernelGoroutineState): void {
  node.status = g.status;
}

export function applyChannelKernelState(node: ChannelNode, ch: KernelChannelState): void {
  const buf = ch.buf ?? [];
  node.values = buf
    .filter((b): b is { id: string; val: unknown } => b !== null)
    .map((b) => String(b.val));
  node.closed = ch.closed;
  node.capacity = ch.dataqsiz;
}
