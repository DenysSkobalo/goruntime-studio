/**
 * @file src/core/memory/types.ts
 * @module core/memory/types
 *
 * @architecture Memory Subsystem Data Contract & Structural Specifications
 * @description Type definitions representing TCMalloc memory primitives, tri-color GC annotations,
 * page span tracking structures (`MSpan`), thread-local caches (`MCache`), central free lists (`MCentral`),
 * and global arena metadata (`MHeap`).
 *
 * @see {@link https://github.com/golang/go/blob/master/src/runtime/mheap.go Go MHeap Type Definitions}
 * @see {@link https://github.com/golang/go/blob/master/src/runtime/mcache.go Go MCache Specifications}
 */

/**
 * Size class index type alias ($0 \le \text{index} < 15$).
 */
export type SizeClassIndex = number;

/**
 * Metadata descriptor for an allocated object block within the simulated heap arena.
 *
 * ANCHOR: MEMORY_OBJECT_TYPE
 */
export interface MemoryObject {
  /** Unique object identifier string. */
  id: string;
  /** Absolute virtual memory base address. */
  address: number;
  /** Payload byte size requested during allocation. */
  size: number;
  /** Assigned size class index, or `-1` for direct large page allocations. */
  sizeClass: SizeClassIndex;
  /** Tri-color mark state tracking object liveness for garbage collection. */
  gcColor: 'white' | 'grey' | 'black';
  /** Epoch timestamp (ms) recording allocation instantiation time. */
  allocatedAt: number;
  /** List of field offsets (in bytes) relative to `address` containing pointers. */
  pointerFields: number[]; // Offsets of pointers inside the object
}

/**
 * Contiguous block of virtual memory pages ($N \times 8\,\text{KiB}$) managed as a unified unit.
 *
 * ANCHOR: MSPAN_TYPE
 */
export interface MSpan {
  /** Unique span identifier string. */
  id: string;
  /** Starting virtual memory address of the span page sequence. */
  startAddr: number;
  /** Count of continuous 8 KiB virtual pages spanned. */
  npages: number;
  /** Size class element allocation size per slot within this span. */
  elemSize: number;
  /** Size class identifier assigned to this span (-1 for large objects). */
  sizeClass: SizeClassIndex;
  /** Total count of currently active (allocated) object slots in span. */
  allocCount: number;
  /** Slot allocation bitmap (`true` = allocated, `false` = free slot). */
  freeBits: boolean[];
  /** Array tracking allocated {@link MemoryObject} references within slots. */
  objects: (MemoryObject | null)[];
  /** Go span execution lifecycle phase state. */
  state: 'mSpanInUse' | 'mSpanFree' | 'mSpanManual';
}

/**
 * Thread-local cache structure attached to simulated logical execution processor (`P`).
 *
 * ANCHOR: MCACHE_TYPE
 */
export interface MCache {
  /** Unique MCache identifier (e.g., `mcache_p0`). */
  id: string;
  /** Array of active spans indexed by size class. */
  alloc: (MSpan | null)[]; // Spans indexed by size class
}

/**
 * Centralized lock-guarded span pool providing replenishment for thread-local caches.
 *
 * ANCHOR: MCENTRAL_TYPE
 */
export interface MCentral {
  /** Size class index managed by this central span queue. */
  sizeClass: SizeClassIndex;
  /** List of spans containing available unallocated memory slots. */
  nonempty: MSpan[];
  /** List of fully allocated spans containing zero free slots. */
  empty: MSpan[];
}

/**
 * Global heap manager tracking entire virtual address arena allocation state.
 *
 * ANCHOR: MHEAP_TYPE
 */
export interface MHeap {
  /** Base virtual memory address of global heap arena. */
  arenaStart: number;
  /** Total active allocated bytes across current heap arena. */
  arenaUsed: number;
  /** Maximum addressable virtual arena size capacity in bytes. */
  arenaSize: number;
  /** Page size granularity constant (8192 bytes). */
  pageSize: number;
  /** Array of centralized size-class span managers (`MCentral`). */
  central: MCentral[];
}
