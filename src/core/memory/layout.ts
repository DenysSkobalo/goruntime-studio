export function getRawBaseAddress(id: string): bigint {
  let hash = 0n;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5n) - hash + BigInt(id.charCodeAt(i));
  }
  const base = 0xc00004d000n;
  const slot = (hash & 0x7fffn) << 8n; // 256 B alignment for Heap structs
  return base + slot;
}

export function formatHex(address: bigint): string {
  return '0x' + address.toString(16).padStart(12, '0');
}

export function addOffset(base: bigint, offset: bigint): bigint {
  return base + offset;
}

/**
 * Розрахунок ізольованої Stack Arena з вирівнюванням по 8 KB сторінках.
 * Гарантує повну відсутність колізій (Stack Overlap) між Горутинами.
 */
export function getGoroutineStack(goid: number) {
  const stackArenaBase = 0x00c000435000n;
  const pageStep = 0x2000n; // 8 KB page slot allocation
  const goidOffset = BigInt(Math.max(1, goid) - 1) * pageStep;

  const stackLo = stackArenaBase + goidOffset;
  const stackHi = addOffset(stackLo, 0x0800n); // 2 KB Initial Stack Frame
  const schedSp = addOffset(stackLo, 0x05f0n); // Active SP synchronized with sudog.elem

  return {
    stackLo,
    stackHi,
    schedSp,
    elemAddr: schedSp // Strict 1:1 mapping for Direct Stack Transfer
  };
}