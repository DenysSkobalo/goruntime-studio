import { createInitialSnapshot, stepSend, stepReceive, stepClose } from '../../engine/core';
import type { RuntimeSnapshot } from '../../engine/types';

class TimelineStore {
  // Svelte 5 Reactive State via $state Rune
  snapshots = $state<RuntimeSnapshot[]>([]);
  currentIndex = $state<number>(0);

  // Derived Reactive Signals via $derived Rune
  currentSnapshot = $derived(this.snapshots[this.currentIndex] ?? null);
  canStepForward = $derived(this.currentIndex < this.snapshots.length - 1);
  canStepBackward = $derived(this.currentIndex > 0);

  /**
   * Initializes a new simulation timeline with an allocated runtime.hchan.
   */
  init(capacity: number): void {
    const initial = createInitialSnapshot(capacity);
    this.snapshots = [initial];
    this.currentIndex = 0;
  }

  /**
   * Executes a channel send operation (ch <- val) and appends a new state snapshot.
   * Truncates future redo history if scrubbing was active.
   */
  send(val: string): void {
    if (!this.currentSnapshot) return;
    try {
      const next = stepSend(this.currentSnapshot, val);
      this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), next];
      this.currentIndex++;
    } catch (err) {
      console.error('Runtime Panic:', err);
    }
  }

  /**
   * Executes a channel receive operation (<-ch) and appends a new state snapshot.
   */
  receive(): void {
    if (!this.currentSnapshot) return;
    try {
      const { snapshot } = stepReceive(this.currentSnapshot);
      this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), snapshot];
      this.currentIndex++;
    } catch (err) {
      console.error('Runtime Panic:', err);
    }
  }

  /**
   * Safely closes the channel (close(ch)) and appends a new state snapshot.
   */
  close(): void {
    if (!this.currentSnapshot) return;
    try {
      const next = stepClose(this.currentSnapshot);
      this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), next];
      this.currentIndex++;
    } catch (err) {
      console.error('Runtime Panic:', err);
    }
  }

  pushSnapshot(snapshot: RuntimeSnapshot): void {
    this.snapshots = [...this.snapshots.slice(0, this.currentIndex + 1), snapshot];
    this.currentIndex++;
  }

  /**
   * Navigates one step forward in execution history.
   */
  stepForward(): void {
    if (this.canStepForward) {
      this.currentIndex++;
    }
  }

  /**
   * Navigates one step backward in execution history.
   */
  stepBackward(): void {
    if (this.canStepBackward) {
      this.currentIndex--;
    }
  }
}

export const timeline = new TimelineStore();
