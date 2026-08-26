import { describe, it, expect } from 'vitest';
import { GoHeapAllocator } from './allocator';

describe('GoHeapAllocator', () => {
  it('повертає нульову адресу для size = 0', () => {
    const allocator = GoHeapAllocator.getInstance();
    const cache = allocator.createMCache();
    expect(allocator.allocate(cache, 0)).toBe(0n);
  });

  it('виділяє малі обʼєкти (<= 32KB) через MCache та MCentral', () => {
    const allocator = GoHeapAllocator.getInstance();
    const cache = allocator.createMCache();
    const addr = allocator.allocate(cache, 64);
    expect(addr).toBeGreaterThan(0n);
  });

  it('обробляє великі алокації (> 32KB) напряму з MHeap', () => {
    const allocator = GoHeapAllocator.getInstance();
    const cache = allocator.createMCache();
    const addr = allocator.allocate(cache, 40000);
    expect(addr).toBeGreaterThan(0n);
  });
});
