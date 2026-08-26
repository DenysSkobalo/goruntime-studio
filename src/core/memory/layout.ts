import type { ChannelElemType } from '$shared/types/nodes';

export const PAGE_SIZE_BYTES = 8192;
export const HEAP_ARENA_BASE = 0x00c000000000n;

export const ELEM_SIZE_MAP: Record<ChannelElemType, number> = {
  string: 16,
  int64: 8,
  bool: 1,
  'struct{}': 0,
};

export function getRawBaseAddress(id: string): bigint {
  let hash = 0n;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5n) - hash + BigInt(id.charCodeAt(i));
  }
  const base = 0xc00004d000n;
  const slot = (hash & 0x7fffn) << 8n;
  return base + slot;
}

export function formatHex(address: bigint): string {
  return '0x' + address.toString(16).padStart(12, '0');
}

export function addOffset(base: bigint, offset: bigint): bigint {
  return base + offset;
}

export function getGoroutineStack(goid: number) {
  const stackArenaBase = 0x00c000435000n;
  const pageStep = 0x2000n;
  const goidOffset = BigInt(Math.max(1, goid) - 1) * pageStep;

  const stackLo = stackArenaBase + goidOffset;
  const stackHi = addOffset(stackLo, 0x0800n);
  const schedSp = addOffset(stackLo, 0x05f0n);

  return {
    stackLo,
    stackHi,
    schedSp,
    elemAddr: schedSp,
  };
}
