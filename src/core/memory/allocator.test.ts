/**
 * @file src/core/memory/allocator.test.ts
 * @module core/memory/allocator.test
 *
 * @description Vitest test suite evaluating `GoHeapAllocator` memory allocation mechanisms,
 * zerobase optimizations, tiny allocations ($\le 16\,\text{B}$), small class allocations ($\le 32\,\text{KB}$),
 * and large arena slice allocations ($> 32\,\text{KB}$).
 *
 * @see {@link GoHeapAllocator}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoHeapAllocator } from './allocator';

describe('GoHeapAllocator', () => {
  let allocator: GoHeapAllocator;

  beforeEach(() => {
    allocator = GoHeapAllocator.getInstance();
    allocator.reset();
  });

  /** ANCHOR: TEST_ZERO_ALLOC */
  it('повертає нульову адресу для size = 0 (zerobase)', () => {
    const result = allocator.allocate(0);
    expect(result.address).toBe('0x000000000000');
    expect(result.level).toBe('tiny');
    expect(result.explanation).toContain('zerobase');
  });

  /** ANCHOR: TEST_TINY_ALLOC */
  it('використовує Tiny Allocator для обʼєктів розміром <= 16 байтів', () => {
    const result = allocator.allocate(12);
    expect(result.level).toBe('tiny');
    expect(BigInt(result.address)).toBeGreaterThan(0n);
  });

  /** ANCHOR: TEST_SMALL_ALLOC */
  it('виділяє малі обʼєкти (>16B та <= 32KB) через MCache', () => {
    const result = allocator.allocate(64);
    expect(result.level).toBe('mcache');
    expect(BigInt(result.address)).toBeGreaterThan(0n);
  });

  /** ANCHOR: TEST_LARGE_ALLOC */
  it('обробляє великі алокації (> 32KB) напряму з MHeap', () => {
    const result = allocator.allocate(40000);
    expect(result.level).toBe('mheap');
    expect(BigInt(result.address)).toBeGreaterThan(0n);
  });

  /** ANCHOR: TEST_ADDRESS_INCREMENT */
  it('інкрементує адреси памʼяті при послідовних алокаціях', () => {
    const first = allocator.allocate(32);
    const second = allocator.allocate(32);
    expect(BigInt(second.address)).toBeGreaterThan(BigInt(first.address));
  });
});
