/**
 * @file src/core/memory/gc.ts
 * @module core/memory/gc
 *
 * @architecture Concurrent Tri-Color Mark-Sweep Garbage Collector Engine
 * @description Simulates the Go runtime Garbage Collector using Dijkstra/Yuasa hybrid write barriers,
 * root scanning, mark phase transitions, pointer traversal, and sweep reclamation.
 *
 * @remarks
 * **Tricolor Marking Abstraction:**
 * - **White**: Unvisited heap objects; candidates for collection during sweep.
 * - **Grey**: Reachable objects whose reachable child pointers are not yet scanned.
 * - **Black**: Confirmed live objects whose outgoing references have been fully scanned.
 *
 * **Write Barrier Invariant (Strong/Weak Tricolor Protection):**
 * During concurrent marking (`_GCmark`), mutating a heap pointer must invoke `writeBarrier`.
 * If a write operation attempts to install a reference to a White object, the Write Barrier shades
 * the target object to Grey to prevent premature reclamation by the collector.
 *
 * @see {@link https://github.com/golang/go/blob/master/src/runtime/mgc.go Go GC Subsystem Implementation}
 * @see Dijkstra, E. W., et al. (1978). *On-the-fly garbage collection: An exercise in cooperation*. CACM.
 * @see Yuasa, T. (1990). *Real-time garbage collection on general-purpose machines*. Journal of Systems and Software.
 */

/**
 * Execution phases of the concurrent garbage collector.
 * ANCHOR: GC_PHASES
 */
export type GCPhase = '_GCoff' | '_GCmark' | '_GCmarktermination';

/**
 * Tri-color marking visual color state model.
 * ANCHOR: COLOR_MARK
 */
export type ColorMark = 'white' | 'grey' | 'black';

/**
 * Structure representing an allocated heap object inside the GC tracking table.
 */
export interface HeapObject {
  /** Hexadecimal virtual address identifier. */
  address: string;
  /** Size of payload block in bytes. */
  size: number;
  /** Current tri-color collection mark state. */
  color: ColorMark;
  /** Addresses of outgoing child heap pointers referenced by this object. */
  pointers: string[];
}

/**
 * Simulates concurrent tri-color mark-sweep garbage collection runtime logic.
 *
 * INVARIANT: Write barrier is strictly active whenever phase === '_GCmark'.
 */
export class GarbageCollector {
  private phase: GCPhase = '_GCoff';
  private heap: Map<string, HeapObject> = new Map();
  private writeBarrierEnabled: boolean = false;

  constructor() {
    this.initMockHeap();
  }

  /**
   * Initializes baseline mock heap objects for testing collection cycles.
   * @internal
   */
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

  /**
   * Retrieves current active GC phase.
   * @returns Current phase (`_GCoff`, `_GCmark`, `_GCmarktermination`).
   */
  public getPhase(): GCPhase {
    return this.phase;
  }

  /**
   * Returns write barrier active state.
   * @returns True if write barrier guard is enabled.
   */
  public isWriteBarrierActive(): boolean {
    return this.writeBarrierEnabled;
  }

  /**
   * Initiates concurrent marking phase, enabling Write Barrier and marking roots.
   *
   * ANCHOR: TRICOLOR_MARK_START
   *
   * @param roots - List of virtual addresses corresponding to root pointers (stacks, globals).
   * @returns Phase status, list of newly shaded grey addresses, and log message.
   *
   * @see {@link https://github.com/golang/go/blob/master/src/runtime/mgc.go#L1200 gcStart}
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
   * Performs a tri-color marking step (`gcDrain` step): shades object to Black and child references to Grey.
   *
   * ANCHOR: MARK_OBJECT_STEP
   *
   * @param address - Virtual address of target Grey object to process.
   * @returns Transition details listing black-shaded object and newly greyed children.
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
   * Intercepts pointer writes during concurrent mark phase to enforce tricolor invariants.
   *
   * ANCHOR: WRITE_BARRIER_HOOK
   *
   * @remarks
   * **Dijkstra Insertion Barrier Hook:**
   * Ensures any white target object assigned to a pointer slot during concurrent marking is instantly shaded to grey.
   * Prevents mutator threads from hiding white objects behind black objects without GC awareness.
   *
   * @param _slotAddr - Address of memory field holding pointer reference.
   * @param newPtrAddr - Address of newly assigned pointer target.
   * @returns Result indicating shaded target object address if shading occurred.
   *
   * @see {@link https://github.com/golang/go/blob/master/src/runtime/mwbbuf.go Go Write Barrier Buffer}
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
   * Executes GC sweep phase: reclaims all remaining White objects and resets Black objects to White.
   *
   * ANCHOR: GC_SWEEP
   *
   * @returns Object listing addresses of reclaimed unreachable memory blocks.
   *
   * @see {@link https://github.com/golang/go/blob/master/src/runtime/mgcswp.go Go GC Sweep}
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

  /**
   * Retrieves array of all current heap objects for inspection.
   * @returns Array of {@link HeapObject} descriptors.
   */
  public getHeapSnapshot(): HeapObject[] {
    return Array.from(this.heap.values());
  }
}
