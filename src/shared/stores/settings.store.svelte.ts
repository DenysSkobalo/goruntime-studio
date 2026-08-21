class SettingsStore {
  open = $state(false);

  setOpen(value: boolean) {
    this.open = value;
  }

  toggle() {
    this.open = !this.open;
  }
}

export const settingsStore = new SettingsStore();
