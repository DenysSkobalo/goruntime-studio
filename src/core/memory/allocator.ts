import { formatHex } from './layout';

export interface Span {
  classId: number;
  objSize: number;
  npages: number;
  startAddr: bigint;
  freeIndex: number;
  nelems: number;
}

/**
 * @todo Issue #MEMORY-302: Connect memory primitives to visual timeline stream.
 * Connect GoHeapAllocator (mcache -> mcentral -> mheap) and GarbageCollector (Tri-color marking)
 * to timeline.store.svelte.ts for real-time heap frame animation and mark-sweep visualization.
 */
export class GoHeapAllocator {
  private static instance: GoHeapAllocator;

  // Tiny allocator state
  private tiny: bigint = 0n;
  private tinyoffset: number = 0;
  private tinyAllocsCount: number = 0;

  // mcache simulated spans by size class
  private mcacheSpans: Map<number, Span> = new Map();

  private constructor() {
    this.initMCache();
  }

  public static getInstance(): GoHeapAllocator {
    if (!GoHeapAllocator.instance) {
      GoHeapAllocator.instance = new GoHeapAllocator();
    }
    return GoHeapAllocator.instance;
  }

  private initMCache(): void {
    // Standard Go size classes initialization (example subsets: class 1 = 8B, class 2 = 16B, class 3 = 32B)
    this.mcacheSpans.set(1, { classId: 1, objSize: 8, npages: 1, startAddr: 0xc000100000n, freeIndex: 0, nelems: 1024 });
    this.mcacheSpans.set(2, { classId: 2, objSize: 16, npages: 1, startAddr: 0xc000102000n, freeIndex: 0, nelems: 512 });
    this.mcacheSpans.set(3, { classId: 3, objSize: 32, npages: 1, startAddr: 0xc000104000n, freeIndex: 0, nelems: 256 });
  }

  public allocate(size: number, needsZeroing: boolean = true): { address: string; level: 'tiny' | 'mcache' | 'mcentral' | 'mheap'; explanation: string } {
    // 1. Tiny Allocator (< 16 bytes, noscan)
    if (size < 16) {
      if (this.tinyoffset + size <= 16 && this.tiny !== 0n) {
        const addr = this.tiny + BigInt(this.tinyoffset);
        this.tinyoffset += size;
        this.tinyAllocsCount++;
        return {
          address: formatHex(addr),
          level: 'tiny',
          explanation: `mallocgc(): Використано Tiny Allocator (розмір ${size}B). Об'єднано у загальний слот mcache.tiny (offset: ${this.tinyoffset}B).`,
        };
      } else {
        // Allocate a new 16-byte block for tiny allocator
        const span = this.mcacheSpans.get(2)!;
        this.tiny = span.startAddr + BigInt(span.freeIndex * span.objSize);
        span.freeIndex++;
        this.tinyoffset = size;
        this.tinyAllocsCount++;
        return {
          address: formatHex(this.tiny),
          level: 'tiny',
          explanation: `mallocgc(): Виділено новий 16B блок у mcache для Tiny Allocator. Зайнято ${size}B.`,
        };
      }
    }

    // 2. Small Allocation (<= 32KB) -> mcache
    const classId = this.getSizeClass(size);
    const span = this.mcacheSpans.get(classId);

    if (span && span.freeIndex < span.nelems) {
      const addr = span.startAddr + BigInt(span.freeIndex * span.objSize);
      span.freeIndex++;
      return {
        address: formatHex(addr),
        level: 'mcache',
        explanation: `mallocgc(): Виділено через mcache (Size Class ${classId}, objSize: ${span.objSize}B). Локальний потік P виділив пам'ять без блокувань (lock-free).`,
      };
    }

    // 3. Large Allocation (> 32KB or full mcache span) -> mcentral / mheap fallback
    const heapAddr = 0xc000800000n + BigInt(Math.floor(Math.random() * 0x10000));
    return {
      address: formatHex(heapAddr),
      level: 'mheap',
      explanation: `mallocgc(): mcache span вичерпано. Запит до mcentral/mheap на виділення сторінок (sysAlloc/mmap).`,
    };
  }

  private getSizeClass(size: number): number {
    if (size <= 8) return 1;
    if (size <= 16) return 2;
    return 3;
  }
}
