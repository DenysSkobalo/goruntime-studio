export const PAGE_SIZE = 8192; // 8 KB Page
export const MAX_SMALL_SIZE = 32768; // 32 KB Limit for MCache
export const HEAP_ARENA_START = 0x00c000000000;

// Таблиця 67 класів розмірів Go Runtime (вибірка основних)
export const SIZE_CLASSES = [
  0, 8, 16, 24, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256,
  320, 384, 448, 512, 1024, 2048, 4096, 8192, 16384, 32768
];

export interface MSpan {
  startAddr: number;      // Початкова Hex-адреса спану у віртуальній арені
  npages: number;         // Кількість 8KB сторінок
  spanclass: number;      // (sizeclass << 1) | (noscan ? 1 : 0)
  elemsize: number;       // Розмір одного елемента в байтах
  nelems: number;         // Загальна кількість елементів у спані
  allocCount: number;     // Кількість виділених елементів
  allocBits: boolean[];   // Бітова карта виділених слотів
  gcmarkBits: boolean[];  // Бітова карта триколірного маркування GC
}

export interface MCache {
  alloc: Record<number, MSpan | null>; // 67 classes * 2 (scan/noscan) = 134 span-слоти
}

export interface MCentral {
  spanclass: number;
  nonempty: MSpan[]; // Спани з вільними об'єктами
  empty: MSpan[];    // Повністю заповнені спани
}

export class GoHeapAllocator {
  private arenaNextAddr = HEAP_ARENA_START;
  public mheapPages: Map<number, MSpan> = new Map();
  public centrals: Map<number, MCentral> = new Map();

  constructor() {
    this.initCentrals();
  }

  private initCentrals(): void {
    for (let sc = 0; sc < SIZE_CLASSES.length * 2; sc++) {
      this.centrals.set(sc, { spanclass: sc, nonempty: [], empty: [] });
    }
  }

  public createMCache(): MCache {
    const cache: MCache = { alloc: {} };
    for (let sc = 0; sc < SIZE_CLASSES.length * 2; sc++) {
      cache.alloc[sc] = null;
    }
    return cache;
  }

  /**
   * Головна функція виділення пам'яті у купі (runtime.mallocgc)
   */
  public mallocgc(size: number, scan: boolean, mcache: MCache): { address: string; spanclass: number } {
    if (size === 0) return { address: '0x000000000000', spanclass: 0 };

    // 1. Large Allocation (> 32 KB): Виділення напряму з mheap без MCache
    if (size > MAX_SMALL_SIZE) {
      const npages = Math.ceil(size / PAGE_SIZE);
      const span = this.allocLargeSpan(npages);
      return { address: `0x${span.startAddr.toString(16)}`, spanclass: 0 };
    }

    // 2. Small Allocation (<= 32 KB): Пошук належного Size Class
    const sizeclass = SIZE_CLASSES.findIndex((s) => s >= size) || 1;
    const spanclass = (sizeclass << 1) | (scan ? 0 : 1);
    const elemsize = SIZE_CLASSES[sizeclass];

    // 3. Перевірка локального кешу MCache
    let span = mcache.alloc[spanclass];

    if (!span || span.allocCount >= span.nelems) {
      // MCache Cache Miss -> Виклики runtime.mcacheRefill та запит з MCentral
      span = this.refillMCache(mcache, spanclass, elemsize);
    }

    // 4. Пошук першого вільного слота через allocBits
    const freeIndex = span.allocBits.findIndex((allocated) => !allocated);
    span.allocBits[freeIndex] = true;
    span.allocCount++;

    const objAddr = span.startAddr + freeIndex * elemsize;
    return { address: `0x${objAddr.toString(16)}`, spanclass };
  }

  private refillMCache(mcache: MCache, spanclass: number, elemsize: number): MSpan {
    const central = this.centrals.get(spanclass)!;

    if (central.nonempty.length === 0) {
      // MCentral порожній -> Запит нової сторінки 8KB з mheap
      const npages = 1;
      const newSpan: MSpan = {
        startAddr: this.arenaNextAddr,
        npages,
        spanclass,
        elemsize,
        nelems: Math.floor((npages * PAGE_SIZE) / elemsize),
        allocCount: 0,
        allocBits: new Array(Math.floor((npages * PAGE_SIZE) / elemsize)).fill(false),
        gcmarkBits: new Array(Math.floor((npages * PAGE_SIZE) / elemsize)).fill(false),
      };

      this.arenaNextAddr += npages * PAGE_SIZE;
      central.nonempty.push(newSpan);
    }

    const span = central.nonempty.pop()!;
    mcache.alloc[spanclass] = span;
    return span;
  }

  private allocLargeSpan(npages: number): MSpan {
    const startAddr = this.arenaNextAddr;
    this.arenaNextAddr += npages * PAGE_SIZE;

    return {
      startAddr,
      npages,
      spanclass: 0,
      elemsize: npages * PAGE_SIZE,
      nelems: 1,
      allocCount: 1,
      allocBits: [true],
      gcmarkBits: [false],
    };
  }
}
