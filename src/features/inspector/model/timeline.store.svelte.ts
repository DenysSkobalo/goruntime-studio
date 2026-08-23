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

class TimelineStore {
  snapshots = $state<RuntimeSnapshot[]>([]);
  currentIndex = $state<number>(0);
  lastError = $state<string | null>(null);

  currentSnapshot = $derived(this.snapshots[this.currentIndex] ?? null);
  canStepForward = $derived(this.currentIndex < this.snapshots.length - 1);
  canStepBackward = $derived(this.currentIndex > 0);

  issues = $derived<ConcurrencyIssue[]>(analyzeConcurrencyIssues(this.currentSnapshot));

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

  init(capacity: number): void {
    const initial = createInitialSnapshot({ numP: capacity, numM: capacity });
    this.snapshots = [initial];
    this.currentIndex = 0;
  }

  send(val: string, chanAddr?: string): void { this.executeStep(() => stepSend(this.currentSnapshot!, val, chanAddr)); }
  receive(chanAddr?: string): void { this.executeStep(() => stepReceive(this.currentSnapshot!, chanAddr).snapshot); }
  close(chanAddr?: string): void { this.executeStep(() => stepClose(this.currentSnapshot!, chanAddr)); }
  select(hasDefault = false): void { this.executeStep(() => stepSelect(this.currentSnapshot!, hasDefault)); }
  mutexLock(mutexAddr?: string): void { this.executeStep(() => stepMutexLock(this.currentSnapshot!, mutexAddr)); }
  mutexUnlock(mutexAddr?: string): void { this.executeStep(() => stepMutexUnlock(this.currentSnapshot!, mutexAddr)); }
  wgAdd(delta: number, wgAddr?: string): void { this.executeStep(() => stepWGAdd(this.currentSnapshot!, delta, wgAddr)); }
  wgWait(wgAddr?: string): void { this.executeStep(() => stepWGWait(this.currentSnapshot!, wgAddr)); }
  contextCancel(ctxAddr?: string): void { this.executeStep(() => stepContextCancel(this.currentSnapshot!, ctxAddr)); }
  spawn(): void { this.executeStep(() => spawnGoroutine(this.currentSnapshot!)); }
  schedule(): void { this.executeStep(() => scheduleTick(this.currentSnapshot!)); }

  stepForward(): void { if (this.canStepForward) this.currentIndex++; }
  stepBackward(): void { if (this.canStepBackward) this.currentIndex--; }
}

export const timeline = new TimelineStore();
