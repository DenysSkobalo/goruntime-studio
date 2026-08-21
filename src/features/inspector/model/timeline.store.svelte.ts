import { createInitialSnapshot, scheduleTick, spawnGoroutine, stepClose, stepContextCancel, stepMutexLock, stepMutexUnlock, stepReceive, stepSelect, stepSend, stepWGAdd, stepWGWait } from "$core/engine/runtime";
import type { RuntimeSnapshot } from "$core/engine/types";


class TimelineStore {
  snapshots = $state<RuntimeSnapshot[]>([]);
  currentIndex = $state<number>(0);
  lastError = $state<string | null>(null);

  currentSnapshot = $derived(this.snapshots[this.currentIndex] ?? null);
  canStepForward = $derived(this.currentIndex < this.snapshots.length - 1);
  canStepBackward = $derived(this.currentIndex > 0);

  clearError(): void {
    this.lastError = null;
  }

  private executeStep(action: () => RuntimeSnapshot): void {
    if (!this.currentSnapshot) return;
    this.clearError();
    try {
      const next = action();
      this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), next];
      this.currentIndex++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.lastError = msg;
      console.error('Runtime Panic:', msg);
    }
  }

  init(capacity: number): void {
    this.clearError();
    const initial = createInitialSnapshot(capacity);
    this.snapshots = [initial];
    this.currentIndex = 0;
  }

  /**
   * Реактивне (Live) оновлення ємності каналу (dataqsiz) у поточному snapshot.
   * Не вимагає скидання всієї історії timeline (без re-init).
   */
  updateChannelCapacity(chanAddr: string, newCap: number): void {
    if (!this.currentSnapshot) return;
    this.clearError();

    const cap = Math.max(0, Math.min(8, newCap));
    const nextSnapshot: RuntimeSnapshot = JSON.parse(JSON.stringify(this.currentSnapshot));
    const hchan = nextSnapshot.channels[chanAddr];

    if (!hchan) return;

    hchan.dataqsiz = cap;

    if (cap === 0) {
      // При переході в unbuffered (cap=0) очищаємо кольцевий буфер
      hchan.buf = [];
      hchan.qcount = 0;
      hchan.sendx = 0;
      hchan.recvx = 0;
    } else {
      // При коригуванні буфера підганяємо масив
      const currentValidElems = hchan.buf.filter((b) => b !== null);
      const newBuf = new Array(cap).fill(null);

      for (let i = 0; i < Math.min(currentValidElems.length, cap); i++) {
        newBuf[i] = currentValidElems[i];
      }

      hchan.buf = newBuf;
      hchan.qcount = Math.min(currentValidElems.length, cap);
      hchan.sendx = hchan.qcount % cap;
      hchan.recvx = 0;
    }

    nextSnapshot.action = `runtime.makechan(${hchan.name}, cap=${cap})`;
    nextSnapshot.explanation = `Реактивна зміна dataqsiz для ${hchan.name}. Встановлено ємність = ${cap} B. Стан буфера перераховано live.`;

    this.pushSnapshot(nextSnapshot);
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

  select(hasDefault = false): void {
    this.executeStep(() => stepSelect(this.currentSnapshot!, hasDefault));
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

  pushSnapshot(snapshot: RuntimeSnapshot): void {
    this.clearError();
    this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), snapshot];
    this.currentIndex++;
  }

  stepForward(): void {
    if (this.canStepForward) {
      this.clearError();
      this.currentIndex++;
    }
  }

  stepBackward(): void {
    if (this.canStepBackward) {
      this.clearError();
      this.currentIndex--;
    }
  }
}

export const timeline = new TimelineStore();