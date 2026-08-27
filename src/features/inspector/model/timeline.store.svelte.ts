/**
 * @file src/features/inspector/model/timeline.store.svelte.ts
 * @module features/inspector/model/timeline.store
 *
 * @architecture Reactive Concurrency Timeline Simulation Store (Svelte 5 Runes)
 * @description Central timeline store orchestrating execution snapshot histories, step playback,
 * concurrency issue analysis (deadlocks, race conditions), and kernel instruction dispatch.
 *
 * @remarks
 * **Snapshot Immutability Strategy:**
 * Step mutations produce new snapshot instances appended to the timeline array, enabling bidirectional step playback
 * (`stepForward` / `stepBackward`) without re-executing state calculations.
 *
 * @see {@link https://github.com/golang/go Go Concurrency Execution Engine (`tsgoruntime-kernel`)}
 */

import {
  createInitialSnapshot,
  scheduleTick,
  spawnGoroutine,
  stepClose,
  stepContextCancel,
  stepMutexLock,
  stepMutexUnlock,
  stepReceive,
  stepSelect,
  stepSend,
  stepWGAdd,
  stepWGWait,
  analyzeConcurrencyIssues,
  type RuntimeSnapshot,
  type ConcurrencyIssue,
} from 'tsgoruntime-kernel';

/**
 * Reactive simulation timeline store managing Go runtime execution snapshots using Svelte 5 signal runes.
 * ANCHOR: TIMELINE_STORE_CLASS
 */
class TimelineStore {
  /** Array of immutable execution snapshots representing simulator history. */
  snapshots = $state<RuntimeSnapshot[]>([]);
  /** Current active snapshot timeline index position. */
  currentIndex = $state<number>(0);
  /** Last caught execution error message string or `null`. */
  lastError = $state<string | null>(null);

  /** Active snapshot instance derived reference. ANCHOR: CURRENT_SNAPSHOT_DERIVED */
  currentSnapshot = $derived(this.snapshots[this.currentIndex] ?? null);
  /** Indicates whether forward step navigation is available. */
  canStepForward = $derived(this.currentIndex < this.snapshots.length - 1);
  /** Indicates whether backward step navigation is available. */
  canStepBackward = $derived(this.currentIndex > 0);

  /** Real-time analyzed concurrency issues array (deadlocks, race conditions). ANCHOR: CONCURRENCY_ISSUES_DERIVED */
  issues = $derived<ConcurrencyIssue[]>(analyzeConcurrencyIssues(this.currentSnapshot));

  /**
   * Executes a state transition step, pushing a new snapshot to timeline history.
   *
   * ANCHOR: STEP_EXECUTION_WRAPPER
   *
   * @param action - State transition function returning a new {@link RuntimeSnapshot}.
   */
  private executeStep(action: () => RuntimeSnapshot): void {
    if (!this.currentSnapshot) return;
    try {
      const next = action();
      this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), next];
      this.currentIndex++;
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
    }
  }

  /**
   * Initializes timeline with an initial bootstrap snapshot for given processor capacity.
   *
   * @param capacity - Number of logical processors ($P$) and thread workers ($M$).
   */
  init(capacity: number): void {
    const initial = createInitialSnapshot({ numP: capacity, numM: capacity });
    this.snapshots = [initial];
    this.currentIndex = 0;
  }

  send(val: string, chanAddr?: string): void {
    this.executeStep(() => stepSend(this.currentSnapshot!, val, chanAddr));
  }
  receive(chanAddr?: string): void {
    this.executeStep(() => stepReceive(this.currentSnapshot!, chanAddr).snapshot);
  }
  close(chanAddr?: string): void {
    this.executeStep(() => stepClose(this.currentSnapshot!, chanAddr));
  }
  select(_hasDefault = false): void {
    this.executeStep(() => stepSelect(this.currentSnapshot!, []));
  }
  mutexLock(mutexAddr?: string): void {
    this.executeStep(() => stepMutexLock(this.currentSnapshot!, mutexAddr));
  }
  mutexUnlock(mutexAddr?: string): void {
    this.executeStep(() => stepMutexUnlock(this.currentSnapshot!, mutexAddr));
  }
  wgAdd(delta: number, wgAddr?: string): void {
    this.executeStep(() => stepWGAdd(this.currentSnapshot!, delta, wgAddr));
  }
  wgWait(wgAddr?: string): void {
    this.executeStep(() => stepWGWait(this.currentSnapshot!, wgAddr));
  }
  contextCancel(ctxAddr?: string): void {
    this.executeStep(() => stepContextCancel(this.currentSnapshot!, ctxAddr));
  }
  spawn(): void {
    this.executeStep(() => spawnGoroutine(this.currentSnapshot!));
  }
  schedule(): void {
    this.executeStep(() => scheduleTick(this.currentSnapshot!));
  }

  stepForward(): void {
    if (this.canStepForward) this.currentIndex++;
  }
  stepBackward(): void {
    if (this.canStepBackward) this.currentIndex--;
  }
}

/** Singleton timeline store instance. */
export const timeline = new TimelineStore();
