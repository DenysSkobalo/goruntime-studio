export type Lang = 'uk' | 'en';

export interface Translations {
  app: {
    title: string;
  };
  nav: {
    theme: string;
    language: string;
  };
  common: {
    workspace: string;
    docs: string;
    settings: string;
    language: string;
    theme: string;
    close: string;
    backToWorkspace: string;
    nodes: string;
    edges: string;
  };
  header: {
    simulate: string;
    pause: string;
    inspectStackHeap: string;
    inspectStackHeapTarget: string;
    clear: string;
  };
  docs: {
    title: string;
    description: string;
    searchPlaceholder: string;
    memoryLayout: string;
    keyInvariants: string;
    size64Bit: string;
    sourceCode: string;
    primitivesHeader: string;
    platformSpec: string;
    offset: string;
    field: string;
    type: string;
    note: string;
  };
  toolbar: {
    addGoroutine: string;
    addChannel: string;
    selectTool: string;
    connectTool: string;
    clearCanvas: string;
    toolBanner: string;
  };
  inspector: {
    title: string;
    target: string;
    noSelection: string;
    detailsTab: string;
    schedulerTab: string;
    stackArena: string;
    heapArena: string;
    targetIdentity: string;
    variableName: string;
    heapAddress: string;
    descriptorG: string;
    descriptorHchan: string;
    descriptorSudog: string;
    stateG: string;
    stateHchan: string;
    docAndSpec: string;
    elementType: string;
    ringBuffer: string;
    empty: string;
    timeline: {
      step: string;
    };
  };
  connector: {
    sudogHeapAddress: string;
    directStackTransferTitle: string;
    directStackTransferDesc: string;
  };
  scheduler: {
    grqTitle: string;
    grqElements: string;
    processorsTitle: string;
    lrq: string;
  };
  actionExecutor: {
    title: string;
    payload: string;
  };
  stackModal: {
    title: string;
    subtitle: string;
    stackArena: string;
    fixedPageSlot: string;
    highBoundary: string;
    stackPointer: string;
    stackGuard: string;
    lowBoundary: string;
    virtualHeapArena: string;
    sizeClasses: string;
  };
  settingsModal: {
    title: string;
    subtitle: string;
    themeSection: string;
    languageSection: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
  };
  analyzer: {
    issuesTitle: string;
    noIssues: string;
    goroutineLabel: string;
  };
}
