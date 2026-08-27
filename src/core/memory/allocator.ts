/**
 * @file src/core/memory/allocator.ts
 * @module core/memory/allocator
 *
 * @architecture TCMalloc (Thread-Caching Malloc) Derivative & Heap Facade Architecture
 * @description High-performance Go runtime memory allocation simulator implementing a three-tier
 * hierarchy: Per-P Local Cache (`MCache`) -> Centralized Shared Free-List (`MCentral`) -> Global Page Allocator (`MHeap`),
 * along with `GoHeapAllocator` Singleton facade for high-level visual inspection.
 *
 * @remarks
 * **Allocation Routing Rules:**
 * 1. Zero-byte allocations ($0\,\text{B}$): Return static `runtime.zerobase` address pointer without advancing arena.
 * 2. Tiny Allocations ($\le 16\,\text{B}$): Routed via Tiny Allocator sub-block (`level: 'tiny'`).
 * 3. Small Allocations ($16\,\text{B} < S \le 32\,\text{KB}$): Routed via per-P `MCache` size classes (`level: 'mcache'`).
 * 4. Large Allocations ($> 32\,\text{KB}$): Routed directly to global `MHeap` arena spans (`level: 'mheap'`).
 *
 * @see {@link https://github.com/golang/go/blob/master/src/runtime/malloc.go Go Memory Allocator Implementation}
 */

import type { MCache, MHeap, MSpan, MemoryObject } from './types';

export const PAGE_SIZE = 8192; // 8 KiB pages
export const SIZE_CLASSES = [8, 16, 32, 48, 64, 80, 96, 112, 128, 256, 512, 1024, 2048, 4096, 8192];

/**
 * Result contract returned by the `GoHeapAllocator.allocate` facade method.
 */
export interface AllocationResult {
  /** Hexadecimal virtual memory address string (e.g., '0x00007fff00000000'). */
  address: string;
  /** Allocation hierarchy level responsible for handling the request. */
  level: 'tiny' | 'mcache' | 'mheap';
  /** Human-readable explanation detailing the microarchitectural routing logic. */
  explanation: string;
}

/**
 * Singleton Facade managing Go memory allocations and telemetry formatting for Vitest suite and inspector UI.
 *
 * ANCHOR: GO_HEAP_ALLOCATOR
 */
export class GoHeapAllocator {
  private static instance: GoHeapAllocator | null = null;
  private nextAddr: bigint = 0x00007fff00000000n;
  private readonly zerobaseAddr = '0x000000000000';

  private constructor() {}

  /**
   * Returns the global Singleton instance of the heap allocator.
   */
  public static getInstance(): GoHeapAllocator {
    if (!GoHeapAllocator.instance) {
      GoHeapAllocator.instance = new GoHeapAllocator();
    }
    return GoHeapAllocator.instance;
  }

  /**
   * Resets virtual memory address pointer to initial heap arena base address.
   */
  public reset(): void {
    this.nextAddr = 0x00007fff00000000n;
  }

  /**
   * Allocates virtual memory simulating Go `runtime.mallocgc` high-level routing logic.
   *
   * @param size - Requested memory allocation size in bytes.
   * @returns Telemetry result containing assigned hex address, allocation level, and structural explanation.
   */
  public allocate(size: number): AllocationResult {
    // Zero-size allocation path: Go runtime zerobase static address optimization
    if (size === 0) {
      return {
        address: this.zerobaseAddr,
        level: 'tiny',
        explanation:
          'Allocation size is 0 bytes; returning static runtime.zerobase pointer address.',
      };
    }

    const currentAddrHex = `0x${this.nextAddr.toString(16).padStart(12, '0')}`;

    // Tiny allocation path (<= 16 Bytes)
    if (size <= 16) {
      const alignedBytes = BigInt(Math.max(size, 8));
      this.nextAddr += alignedBytes;
      return {
        address: currentAddrHex,
        level: 'tiny',
        explanation: `Tiny object (${size}B <= 16B) allocated via tiny allocator sub-block.`,
      };
    }

    // Small allocation path (> 16 Bytes and <= 32 KB)
    if (size <= 32768) {
      const alignedBytes = BigInt((size + 7) & ~7); // 8-byte memory alignment
      this.nextAddr += alignedBytes;
      return {
        address: currentAddrHex,
        level: 'mcache',
        explanation: `Small object (${size}B <= 32KB) allocated via MCache size-class span.`,
      };
    }

    // Large allocation path (> 32 KB)
    const pagesNeeded = Math.ceil(size / PAGE_SIZE);
    const allocBytes = BigInt(pagesNeeded * PAGE_SIZE);
    this.nextAddr += allocBytes;

    return {
      address: currentAddrHex,
      level: 'mheap',
      explanation: `Large object (${size}B > 32KB) allocated directly from MHeap arena spans (${pagesNeeded} pages).`,
    };
  }
}

/**
 * Low-level memory allocator simulating `runtime.mallocgc` internal structures (`MCache`, `MCentral`, `MHeap`).
 *
 * ANCHOR: GO_MEMORY_ALLOCATOR
 */
export class GoMemoryAllocator {
  private heap: MHeap;
  private threadCache: MCache;
  private nextAddr = 0x00007fff00000000;

  constructor(arenaSize: number = 64 * 1024 * 1024) {
    this.heap = {
      arenaStart: this.nextAddr,
      arenaUsed: 0,
      arenaSize,
      pageSize: PAGE_SIZE,
      central: SIZE_CLASSES.map((_, idx) => ({
        sizeClass: idx,
        nonempty: [],
        empty: [],
      })),
    };

    this.threadCache = {
      id: 'mcache_p0',
      alloc: new Array(SIZE_CLASSES.length).fill(null),
    };
  }

  public getSizeClass(size: number): number {
    for (let i = 0; i < SIZE_CLASSES.length; i++) {
      if (size <= SIZE_CLASSES[i]) return i;
    }
    return -1;
  }

  public mallocgc(size: number, hasPointers: boolean = false): MemoryObject {
    const sc = this.getSizeClass(size);
    if (sc !== -1) {
      return this.allocateSmall(sc, size, hasPointers);
    } else {
      return this.allocateLarge(size, hasPointers);
    }
  }

  private allocateSmall(sc: number, requestedSize: number, _hasPointers: boolean): MemoryObject {
    let span = this.threadCache.alloc[sc];
    if (!span || span.allocCount >= span.objects.length) {
      span = this.refillMCache(sc);
    }

    const slotIdx = span.freeBits.findIndex((bit) => bit === false);
    if (slotIdx === -1) {
      throw new Error(`Out of memory slots in size class ${sc}`);
    }

    const elemSize = SIZE_CLASSES[sc];
    const objAddr = span.startAddr + slotIdx * elemSize;

    const obj: MemoryObject = {
      id: `obj_0x${objAddr.toString(16)}`,
      address: objAddr,
      size: requestedSize,
      sizeClass: sc,
      gcColor: 'white',
      allocatedAt: Date.now(),
      pointerFields: [],
    };

    span.freeBits[slotIdx] = true;
    span.objects[slotIdx] = obj;
    span.allocCount++;

    return obj;
  }

  private refillMCache(sc: number): MSpan {
    const central = this.heap.central[sc];
    let span: MSpan;

    if (central.nonempty.length > 0) {
      span = central.nonempty.pop()!;
    } else {
      const pagesNeeded = Math.max(1, Math.ceil(SIZE_CLASSES[sc] / PAGE_SIZE));
      span = this.allocSpanFromHeap(pagesNeeded, sc);
    }

    this.threadCache.alloc[sc] = span;
    return span;
  }

  private allocSpanFromHeap(npages: number, sc: number): MSpan {
    const spanSize = npages * PAGE_SIZE;
    const startAddr = this.nextAddr;
    this.nextAddr += spanSize;
    this.heap.arenaUsed += spanSize;

    const elemSize = sc >= 0 ? SIZE_CLASSES[sc] : spanSize;
    const capacity = Math.floor(spanSize / elemSize);

    const span: MSpan = {
      id: `span_0x${startAddr.toString(16)}`,
      startAddr,
      npages,
      elemSize,
      sizeClass: sc,
      allocCount: 0,
      freeBits: new Array(capacity).fill(false),
      objects: new Array(capacity).fill(null),
      state: 'mSpanInUse',
    };

    return span;
  }

  private allocateLarge(size: number, _hasPointers: boolean): MemoryObject {
    const npages = Math.ceil(size / PAGE_SIZE);
    const span = this.allocSpanFromHeap(npages, -1);

    const obj: MemoryObject = {
      id: `large_obj_0x${span.startAddr.toString(16)}`,
      address: span.startAddr,
      size,
      sizeClass: -1,
      gcColor: 'white',
      allocatedAt: Date.now(),
      pointerFields: [],
    };

    span.objects[0] = obj;
    span.freeBits[0] = true;
    span.allocCount = 1;

    return obj;
  }

  public getHeapSnapshot(): MHeap {
    return JSON.parse(JSON.stringify(this.heap));
  }
}
