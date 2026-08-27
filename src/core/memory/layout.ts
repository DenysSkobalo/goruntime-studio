/**
 * @file src/core/memory/layout.ts
 * @module core/memory/layout
 *
 * @architecture Virtual Address Layout Architecture & Memory Alignment Constants
 * @description Virtual memory address space calculations, runtime channel type element layout maps,
 * address hashing, and Goroutine stack space layout computation.
 *
 * @remarks
 * **Layout Alignment Constraints:**
 * - Standard Page Size: $8192\,\text{bytes}$ ($8\,\text{KiB}$).
 * - Virtual Heap Arena Base: `0x00c000000000` (Simulating Go 64-bit virtual address arena mapping).
 * - Element Sizes: Reflected based on Go runtime structure overhead (e.g., `string` header is 16 bytes: 8B pointer + 8B length).
 */

import type { ChannelElemType } from '$shared/types/nodes';

/** Page size constant in bytes for alignment arithmetic. ANCHOR: PAGE_SIZE_BYTES */
export const PAGE_SIZE_BYTES = 8192;

/** Base address for 64-bit simulated heap space (`0xc000000000`). ANCHOR: HEAP_ARENA_BASE */
export const HEAP_ARENA_BASE = 0x00c000000000n;

/**
 * Mapping of built-in channel payload types to memory byte requirements.
 *
 * ANCHOR: ELEMENT_SIZES
 *
 * @remarks
 * - `string`: 16 bytes (`StringHeader` containing `Data uintptr` + `Len int`).
 * - `int64`: 8 bytes (64-bit integer alignment).
 * - `bool`: 1 byte.
 * - `struct{}`: 0 bytes (Zero-Sized Type / ZST allocation optimization).
 */
export const ELEM_SIZE_MAP: Record<ChannelElemType, number> = {
  string: 16,
  int64: 8,
  bool: 1,
  'struct{}': 0,
};

/**
 * Computes a pseudo-deterministic heap virtual base address for a given component identifier.
 *
 * ANCHOR: ADDRESS_HASHING
 *
 * @param id - String entity identifier (e.g., `channel-1`).
 * @returns 64-bit BigInt virtual address within heap space.
 */
export function getRawBaseAddress(id: string): bigint {
  let hash = 0n;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5n) - hash + BigInt(id.charCodeAt(i));
  }
  const base = 0xc00004d000n;
  const slot = (hash & 0x7fffn) << 8n;
  return base + slot;
}

/**
 * Formats a 64-bit virtual memory address as a zero-padded hexadecimal string (`0x00c0...`).
 *
 * @param address - BigInt virtual memory address.
 * @returns 12-character zero-padded hex string representation.
 */
export function formatHex(address: bigint): string {
  return '0x' + address.toString(16).padStart(12, '0');
}

/**
 * Performs offset addition on a base virtual memory address.
 *
 * @param base - Base 64-bit BigInt address.
 * @param offset - Offset delta in bytes.
 * @returns Adjusted BigInt address.
 */
export function addOffset(base: bigint, offset: bigint): bigint {
  return base + offset;
}

/**
 * Calculates virtual stack boundaries (`stack.lo`, `stack.hi`, `sched.sp`) for a specific Goroutine ID.
 *
 * ANCHOR: GOROUTINE_STACK_GEOMETRY
 *
 * @param goid - Numerical Goroutine unique identifier.
 * @returns Object containing `stackLo`, `stackHi`, `schedSp`, and `elemAddr` virtual addresses.
 */
export function getGoroutineStack(goid: number) {
  const stackArenaBase = 0x00c000435000n;
  const pageStep = 0x2000n;
  const goidOffset = BigInt(Math.max(1, goid) - 1) * pageStep;

  const stackLo = stackArenaBase + goidOffset;
  const stackHi = addOffset(stackLo, 0x0800n); // 2 KiB stack offset
  const schedSp = addOffset(stackLo, 0x05f0n);

  return {
    stackLo,
    stackHi,
    schedSp,
    elemAddr: schedSp,
  };
}
