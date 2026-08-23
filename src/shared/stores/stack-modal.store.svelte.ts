class StackModalStore {
  isOpen = $state(false);
  selectedGoid = $state<number>(1);

  open(goid: number = 1) {
    this.selectedGoid = goid;
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  selectGoroutine(goid: number) {
    this.selectedGoid = goid;
  }
}

export const stackModalStore = new StackModalStore();
