export type GCPhase = '_GCoff' | '_GCmark' | '_GCmarktermination';

export type ColorMark = 'white' | 'grey' | 'black';

export interface HeapObject {
  address: string;
  size: number;
  color: ColorMark;
  pointers: string[];
}

/**
 * @todo Issue #MEMORY-302: Connect memory primitives to visual timeline stream.
 * Connect GoHeapAllocator (mcache -> mcentral -> mheap) and GarbageCollector (Tri-color marking)
 * to timeline.store.svelte.ts for real-time heap frame animation and mark-sweep visualization.
 */
export class GarbageCollector {
  private phase: GCPhase = '_GCoff';
  private heap: Map<string, HeapObject> = new Map();
  private writeBarrierEnabled: boolean = false;

  constructor() {
    this.initMockHeap();
  }

  private initMockHeap(): void {
    this.heap.set('0xc000100000', {
      address: '0xc000100000',
      size: 16,
      color: 'white',
      pointers: ['0xc000100020'],
    });
    this.heap.set('0xc000100020', {
      address: '0xc000100020',
      size: 32,
      color: 'white',
      pointers: [],
    });
    this.heap.set('0xc000100040', {
      address: '0xc000100040',
      size: 64,
      color: 'white',
      pointers: [],
    });
  }

  public getPhase(): GCPhase {
    return this.phase;
  }

  public isWriteBarrierActive(): boolean {
    return this.writeBarrierEnabled;
  }

  /**
   * Concurrent Mark Phase transition with Write Barrier enablement (Dijkstra/Yuasa hybrid barrier).
   */
  public startMarkingPhase(roots: string[]): {
    phase: GCPhase;
    markedGrey: string[];
    explanation: string;
  } {
    this.phase = '_GCmark';
    this.writeBarrierEnabled = true;

    const markedGrey: string[] = [];

    // Mark roots as Grey
    for (const rootAddr of roots) {
      const obj = this.heap.get(rootAddr);
      if (obj && obj.color === 'white') {
        obj.color = 'grey';
        markedGrey.push(rootAddr);
      }
    }

    return {
      phase: this.phase,
      markedGrey,
      explanation:
        'gcStart(): Увімкнено Write Barrier (STW). Перехід до _GCmark. Кореневі посилання (Stack/Globals) позначено сірим (Grey).',
    };
  }

  /**
   * Tri-color marking step (Shade object & scan pointers).
   */
  public markObject(address: string): {
    shadedBlack: string;
    shadedGrey: string[];
    explanation: string;
  } {
    const obj = this.heap.get(address);
    if (!obj || obj.color !== 'grey') {
      return { shadedBlack: '', shadedGrey: [], explanation: "Об'єкт не перебуває у сірій черзі." };
    }

    obj.color = 'black';
    const shadedGrey: string[] = [];

    for (const ptr of obj.pointers) {
      const child = this.heap.get(ptr);
      if (child && child.color === 'white') {
        child.color = 'grey';
        shadedGrey.push(ptr);
      }
    }

    return {
      shadedBlack: address,
      shadedGrey,
      explanation: `gcDrain(): Об'єкт ${address} пофарбовано в чорний (Black). Знайдені дочірні посилання (${shadedGrey.join(', ') || 'none'}) пофарбовано в сірий (Grey).`,
    };
  }

  /**
   * Write Barrier hook for pointer manipulation during concurrent mark.
   */
  public writeBarrier(
    _slotAddr: string,
    newPtrAddr: string,
  ): { shadeTarget: string | null; explanation: string } {
    if (!this.writeBarrierEnabled) {
      return { shadeTarget: null, explanation: 'Write barrier disabled.' };
    }

    const targetObj = this.heap.get(newPtrAddr);
    if (targetObj && targetObj.color === 'white') {
      targetObj.color = 'grey';
      return {
        shadeTarget: newPtrAddr,
        explanation: `gcWriteBarrier(): Виявлено запис посилання на білий об'єкт ${newPtrAddr} під час маркування. Об'єкт затінено (Shaded to Grey) для збереження інваріанту.`,
      };
    }

    return { shadeTarget: null, explanation: "Об'єкт вже є сірим або чорним." };
  }

  /**
   * Sweep Phase & GC termination.
   */
  public sweep(): { reclaimedAddresses: string[]; explanation: string } {
    this.phase = '_GCmarktermination';
    const reclaimedAddresses: string[] = [];

    for (const [addr, obj] of this.heap.entries()) {
      if (obj.color === 'white') {
        reclaimedAddresses.push(addr);
        this.heap.delete(addr);
      } else {
        // Reset color for next cycle
        obj.color = 'white';
      }
    }

    this.writeBarrierEnabled = false;
    this.phase = '_GCoff';

    return {
      reclaimedAddresses,
      explanation: `sweep(): Очищено невикористовувану пам'ять (${reclaimedAddresses.length} об'єктів). Вимкнено Write Barrier. Перехід у _GCoff.`,
    };
  }

  public getHeapSnapshot(): HeapObject[] {
    return Array.from(this.heap.values());
  }
}
