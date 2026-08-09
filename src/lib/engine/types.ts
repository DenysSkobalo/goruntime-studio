export type GoroutineStatus = 
  | '_Gidle'
  | '_Grunnable'
  | '_Grunning'
  | '_Gsyscall'
  | '_Gwaiting'
  | '_Gdead';

export interface Goroutine {
  goid: number;
  status: GoroutineStatus;
  stack: {
    lo: string;
    hi: string;
    sp: string;
  };
  waitReason?: string;
  assignedM?: number;
}

export interface Machine {
  id: number;
  p?: number;
  curg?: number;
  inSyscall: boolean;
}

export interface Processor {
  id: number;
  status: '_Pidle' | '_Prunning' | '_Psyscall' | '_Pgcstop';
  runnext?: number;
  runq: number[];
  schedtick: number;
  m?: number;
}

export interface GlobalScheduler {
  grq: number[];
  lock: boolean;
}

export interface Sudog {
  id: string;
  goid: number;
  elem?: any;
  isSender: boolean;
  chanAddr: string;
  selectCaseIdx?: number;
}

export interface HChan {
  address: string;
  name: string;
  qcount: number;
  dataqsiz: number;
  buf: Array<{ id: string; val: any } | null>;
  elemsize: number;
  closed: boolean;
  sendx: number;
  recvx: number;
  recvq: Sudog[];
  sendq: Sudog[];
  isLocked: boolean;
}

/**
 * Representation of runtime.scase struct for selectgo multiplexing.
 */
export interface SelectCase {
  id: number;
  kind: 'caseRecv' | 'caseSend' | 'caseDefault';
  chanAddr: string;
  chanName: string;
  val?: string;
  ready: boolean;
}

/**
 * Internal state of runtime.selectgo execution context.
 */
export interface SelectState {
  cases: SelectCase[];
  pollOrder: number[];
  lockOrder: number[];
  chosenCaseIndex?: number;
  isBlocked: boolean;
  registeredSudogs: Array<{ chanAddr: string; sudogId: string }>;
}

export interface RuntimeSnapshot {
  step: number;
  action: string;
  explanation: string;
  codeLine: number;
  channels: Record<string, HChan>; // Карта каналів у купі [address -> HChan]
  goroutines: Record<number, Goroutine>;
  processors: Record<number, Processor>;
  machines: Record<number, Machine>;
  sched: GlobalScheduler;
  selectState?: SelectState;
  mutexes?: Record<string, MutexState>;
  waitGroups?: Record<string, WaitGroupState>;
  semaRoot?: SemaRoot;
  contexts?: Record<string, ContextState>;
}

export interface MutexState {
  address: string;
  name: string;
  locked: boolean;
  woken: boolean;
  starving: boolean;
  waitersCount: number;
  waitq: Sudog[];
}

export interface WaitGroupState {
  address: string;
  name: string;
  counter: number;
  waiterCount: number;
  waitq: Sudog[];
}

export interface SemaRoot {
  address: string;
  waiters: Array<{ goid: number; sudogId: string; elemAddr: string }>;
}

// Додайте в кінець файлу:
export interface ContextState {
  address: string;
  name: string;
  kind: 'background' | 'cancelCtx' | 'timerCtx' | 'valueCtx';
  parentAddress?: string;
  done: boolean;
  deadline?: string;
  key?: string;
  val?: string;
  children: string[];
}


