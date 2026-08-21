/**
 * Стан Горутини у планувальнику GMP (src/runtime/runtime2.go).
 */
export type GoroutineStatus =
  | '_Gidle'
  | '_Grunnable'
  | '_Grunning'
  | '_Gsyscall'
  | '_Gwaiting'
  | '_Gdead';

/**
 * Дескриптор горутини runtime.g (376 B на 64-bit).
 */
export interface Goroutine {
  goid: number;
  status: GoroutineStatus;
  stack: {
    lo: string; // Нижня межа стека (_StackMin = 2048 B)
    hi: string; // Верхня межа стека
    sp: string; // Stack Pointer (sched.sp)
  };
  waitReason?: string;
  assignedM?: number;
}

/**
 * Дескриптор ОС-потоку runtime.m.
 */
export interface Machine {
  id: number;
  p?: number;
  curg?: number;
  inSyscall: boolean;
}

/**
 * Дескриптор процесора планувальника runtime.p.
 */
export interface Processor {
  id: number;
  status: '_Pidle' | '_Prunning' | '_Psyscall' | '_Pgcstop';
  runnext?: number; // Fast-path слот (1-element LRQ override)
  runq: number[];  // Local Run Queue (макс 256 елементів)
  schedtick: number;
  m?: number;
}

/**
 * Глобальна черга планувальника Global Run Queue (GRQ).
 */
export interface GlobalScheduler {
  grq: number[];
  lock: boolean;
}

/**
 * Вузол черги очікування runtime.sudog (88 B на 64-bit).
 */
export interface Sudog {
  id: string;
  goid: number;
  elem?: any;               // Вказівник на фрейм стека (Direct Stack Transfer)
  isSender: boolean;
  chanAddr: string;        // Вказівник hchan або адреса примітива sync
  selectCaseIdx?: number;  // Для сесій selectgo
  acquiretime?: number;
}

/**
 * Структура каналу runtime.hchan (96 B на 64-bit).
 */
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
 * Окрема канальна операція в мультиплексорі runtime.scase.
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
 * Внутрішній стан контексту виконання runtime.selectgo.
 */
export interface SelectState {
  cases: SelectCase[];
  pollOrder: number[]; // Псевдовипадкова перестановка (fastrand)
  lockOrder: number[]; // Відсортовані адреси для запобігання Deadlock
  chosenCaseIndex?: number;
  isBlocked: boolean;
  registeredSudogs: Array<{ chanAddr: string; sudogId: string }>;
}

/**
 * Стан примітива sync.Mutex (8 B на 64-bit: int32 state + uint32 sema).
 */
export interface MutexState {
  address: string;
  name: string;
  locked: boolean;
  woken: boolean;
  starving: boolean;
  waitersCount: number; // Обчислюється як state >> mutexWaiterShift (3)
  waitq: Sudog[];
}

/**
 * Стан примітива sync.WaitGroup (12 B на 64-bit).
 */
export interface WaitGroupState {
  address: string;
  name: string;
  counter: number;     // High 32 bits від state1
  waiterCount: number; // Low 32 bits від state1
  waitq: Sudog[];
}

/**
 * Глобальне балансоване дерево очікування семафор runtime.semaRoot.
 */
export interface SemaRoot {
  address: string;
  waiters: Array<{ goid: number; sudogId: string; elemAddr: string }>;
}

/**
 * Дерево контекстів context.Context.
 */
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

/**
 * Незмінний знімок стану всієї віртуальної машини Go Runtime.
 */
export interface RuntimeSnapshot {
  step: number;
  action: string;
  explanation: string;
  codeLine: number;
  channels: Record<string, HChan>;
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