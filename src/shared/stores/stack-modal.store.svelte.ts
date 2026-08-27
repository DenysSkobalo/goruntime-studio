/**
 * @file src/shared/stores/stack-modal.store.svelte.ts
 * @module shared/stores/stack-modal.store
 *
 * @architecture Reactive Goroutine Stack Modal Inspector Store (Svelte 5 Runes)
 * @description Reactive store controlling open state and active Goroutine target selection (`goid`)
 * for the visual Stack & Heap Inspector modal dialog.
 */

/**
 * Store managing Goroutine stack inspector modal state using Svelte 5 signal runes.
 * ANCHOR: STACK_MODAL_STORE_CLASS
 */
class StackModalStore {
  /** Modal visibility boolean signal. */
  isOpen = $state(false);
  /** Currently selected Goroutine ID for stack frame evaluation. */
  selectedGoid = $state<number>(1);

  /**
   * Opens stack inspector modal targeted to specified Goroutine ID.
   *
   * @param goid - Target Goroutine ID (defaults to `1` for main).
   */
  open(goid: number = 1) {
    this.selectedGoid = goid;
    this.isOpen = true;
  }

  /** Dismisses stack inspector modal. */
  close() {
    this.isOpen = false;
  }

  /** Updates selected Goroutine ID without toggling visibility. */
  selectGoroutine(goid: number) {
    this.selectedGoid = goid;
  }
}

/** Singleton stack modal store instance. */
export const stackModalStore = new StackModalStore();
