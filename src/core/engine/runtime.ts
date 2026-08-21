import type {
  RuntimeSnapshot,
  Goroutine,
  Processor,
  Machine,
  HChan,
  Sudog,
  SelectCase,
} from './types';

export const MEM_ADDRESSES = {
  CH1: '0x00c000082000',
  CH2: '0x00c000082080',
  MUTEX: '0x00c000090000',
  WAITGROUP: '0x00c000090080',
  SEMA_ROOT: '0x00c000021000',
  CTX_BG: '0x00c0000a0000',
  CTX_CANCEL: '0x00c0000a0040',
} as const;

/**
 * Детективне LCG-джерело псевдовипадкових чисел для емуляції runtime.fastrand().
 */
function createDeterministicRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Глибоке клонування Snapshot для забезпечення імутабельності станів.
 */
function cloneSnapshot(prev: RuntimeSnapshot): RuntimeSnapshot {
  return JSON.parse(JSON.stringify(prev));
}

/**
 * Ініціалізація початкового стану рантайму (runtime.schedinit).
 */
export function createInitialSnapshot(capacity: number): RuntimeSnapshot {
  const ch1: HChan = {
    address: MEM_ADDRESSES.CH1,
    name: 'ch1 (buffered)',
    qcount: 0,
    dataqsiz: capacity,
    buf: new Array(capacity).fill(null),
    elemsize: 16,
    closed: false,
    sendx: 0,
    recvx: 0,
    recvq: [],
    sendq: [],
    isLocked: false,
  };

  const ch2: HChan = {
    address: MEM_ADDRESSES.CH2,
    name: 'ch2 (unbuffered)',
    qcount: 0,
    dataqsiz: 0,
    buf: [],
    elemsize: 16,
    closed: false,
    sendx: 0,
    recvx: 0,
    recvq: [],
    sendq: [],
    isLocked: false,
  };

  const g1: Goroutine = {
    goid: 1,
    status: '_Grunning',
    stack: { lo: '0x00c000435000', hi: '0x00c000435800', sp: '0x00c0004357f0' },
    assignedM: 0,
  };

  const p0: Processor = { id: 0, status: '_Prunning', runq: [], schedtick: 0, m: 0 };
  const p1: Processor = { id: 1, status: '_Pidle', runq: [], schedtick: 0 };
  const m0: Machine = { id: 0, p: 0, curg: 1, inSyscall: false };

  return {
    step: 0,
    action: 'runtime.schedinit()',
    explanation:
      'Ініціалізація Go Runtime (64-bit architecture). Виділено канали у купі, примітиви sync, семафору semaRoot та початковий фрейм G1.',
    codeLine: 1,
    channels: { [MEM_ADDRESSES.CH1]: ch1, [MEM_ADDRESSES.CH2]: ch2 },
    goroutines: { 1: g1 },
    processors: { 0: p0, 1: p1 },
    machines: { 0: m0 },
    sched: { grq: [], lock: false },
    mutexes: {
      [MEM_ADDRESSES.MUTEX]: {
        address: MEM_ADDRESSES.MUTEX,
        name: 'mu',
        locked: false,
        woken: false,
        starving: false,
        waitersCount: 0,
        waitq: [],
      },
    },
    waitGroups: {
      [MEM_ADDRESSES.WAITGROUP]: {
        address: MEM_ADDRESSES.WAITGROUP,
        name: 'wg',
        counter: 0,
        waiterCount: 0,
        waitq: [],
      },
    },
    semaRoot: {
      address: MEM_ADDRESSES.SEMA_ROOT,
      waiters: [],
    },
    contexts: {
      [MEM_ADDRESSES.CTX_BG]: {
        address: MEM_ADDRESSES.CTX_BG,
        name: 'context.Background()',
        kind: 'background',
        done: false,
        children: [MEM_ADDRESSES.CTX_CANCEL],
      },
      [MEM_ADDRESSES.CTX_CANCEL]: {
        address: MEM_ADDRESSES.CTX_CANCEL,
        name: 'ctxWithCancel',
        kind: 'cancelCtx',
        parentAddress: MEM_ADDRESSES.CTX_BG,
        done: false,
        children: [],
      },
    },
  };
}

/**
 * Передача даних у канал (runtime.chansend).
 */
export function stepSend(
  prev: RuntimeSnapshot,
  val: string,
  chanAddr: string = MEM_ADDRESSES.CH1
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  const hchan = next.channels[chanAddr];

  if (!hchan) throw new Error(`Channel at ${chanAddr} not found`);
  if (hchan.closed) throw new Error('panic: send on closed channel');

  // Fast-Path 1: Наявність очікуючого читача у recvq (Direct Stack Transfer)
  if (hchan.recvq.length > 0) {
    const sudog = hchan.recvq.shift()!;
    next.action = `${hchan.name} <- "${val}" (sendDirect)`;
    next.explanation = `chansend(): Виконано пряму передачу стек-в-стек (runtime.memmove) до заблокованої G${sudog.goid}. Переведено G${sudog.goid} у _Grunnable через goready().`;

    if (next.goroutines[sudog.goid]) {
      next.goroutines[sudog.goid].status = '_Grunnable';
      next.goroutines[sudog.goid].waitReason = undefined;
    }
    return next;
  }

  // Fast-Path 2: Запис у вільний слот кільцевого буфера hchan.buf
  if (hchan.dataqsiz > 0 && hchan.qcount < hchan.dataqsiz) {
    hchan.buf[hchan.sendx] = { id: `elem-${next.step}`, val };
    hchan.sendx = (hchan.sendx + 1) % hchan.dataqsiz;
    hchan.qcount++;

    next.action = `${hchan.name} <- "${val}"`;
    next.explanation = `chansend(): Записано в кільцевий буфер buf[${
      (hchan.sendx - 1 + hchan.dataqsiz) % hchan.dataqsiz
    }]. qcount = ${hchan.qcount}.`;
    return next;
  }

  // Slow-Path: Блокування виробника (Park via gopark)
  const currentGoid = next.machines[0]?.curg ?? 1;
  const sudog: Sudog = {
    id: `sudog-${next.step}`,
    goid: currentGoid,
    elem: val,
    isSender: true,
    chanAddr,
  };
  hchan.sendq.push(sudog);

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'chan send';
  }

  next.action = `${hchan.name} <- "${val}" (BLOCKED)`;
  next.explanation = `chansend(): Буфер повний/канал небуферизований. Об'єкт sudog додано до sendq. Переведено G${currentGoid} у _Gwaiting через gopark().`;
  return next;
}

/**
 * Читання з каналу (runtime.chanrecv).
 */
export function stepReceive(
  prev: RuntimeSnapshot,
  chanAddr: string = MEM_ADDRESSES.CH1
): { snapshot: RuntimeSnapshot; val?: string } {
  const next = cloneSnapshot(prev);
  next.step++;
  const hchan = next.channels[chanAddr];

  if (!hchan) throw new Error(`Channel at ${chanAddr} not found`);

  // Fast-Path 1: Наявність заблокованого виробника у sendq
  if (hchan.sendq.length > 0) {
    const sudog = hchan.sendq.shift()!;
    let receivedVal = sudog.elem;

    if (hchan.dataqsiz > 0) {
      const bufVal = hchan.buf[hchan.recvx]?.val;
      hchan.buf[hchan.sendx] = { id: `elem-${next.step}`, val: sudog.elem };
      hchan.sendx = (hchan.sendx + 1) % hchan.dataqsiz;
      hchan.recvx = (hchan.recvx + 1) % hchan.dataqsiz;
      receivedVal = bufVal;
    }

    if (next.goroutines[sudog.goid]) {
      next.goroutines[sudog.goid].status = '_Grunnable';
      next.goroutines[sudog.goid].waitReason = undefined;
    }

    next.action = `<-${hchan.name} (val: "${receivedVal}")`;
    next.explanation = `chanrecv(): Вилучено заблокованого виробника G${sudog.goid} із sendq. Переведено G${sudog.goid} у стан _Grunnable.`;
    return { snapshot: next, val: receivedVal };
  }

  // Fast-Path 2: Читання з кільцевого буфера
  if (hchan.qcount > 0) {
    const item = hchan.buf[hchan.recvx];
    const val = item?.val;
    hchan.buf[hchan.recvx] = null;
    hchan.recvx = (hchan.recvx + 1) % hchan.dataqsiz;
    hchan.qcount--;

    next.action = `<-${hchan.name} (val: "${val}")`;
    next.explanation = `chanrecv(): Прочитано елемент з кільцевого буфера buf[${
      (hchan.recvx - 1 + hchan.dataqsiz) % hchan.dataqsiz
    }].`;
    return { snapshot: next, val };
  }

  // Slow-Path: Блокування споживача
  const currentGoid = next.machines[0]?.curg ?? 1;
  const sudog: Sudog = {
    id: `sudog-${next.step}`,
    goid: currentGoid,
    isSender: false,
    chanAddr,
  };
  hchan.recvq.push(sudog);

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'chan receive';
  }

  next.action = `<-${hchan.name} (BLOCKED)`;
  next.explanation = `chanrecv(): Канал порожній. Об'єкт sudog додано до recvq. Переведено G${currentGoid} у _Gwaiting.`;
  return { snapshot: next };
}

/**
 * Мультиплексор runtime.selectgo (pollorder + lockorder).
 */
export function stepSelect(prev: RuntimeSnapshot, hasDefault = false): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const rand = createDeterministicRandom(next.step * 31);
  const ch1 = next.channels[MEM_ADDRESSES.CH1];
  const ch2 = next.channels[MEM_ADDRESSES.CH2];

  const cases: SelectCase[] = [
    {
      id: 0,
      kind: 'caseRecv',
      chanAddr: MEM_ADDRESSES.CH1,
      chanName: 'ch1',
      ready: ch1 ? ch1.qcount > 0 || ch1.sendq.length > 0 : false,
    },
    {
      id: 1,
      kind: 'caseSend',
      chanAddr: MEM_ADDRESSES.CH2,
      chanName: 'ch2',
      val: 'select_data',
      ready: ch2 ? ch2.recvq.length > 0 || (ch2.dataqsiz > 0 && ch2.qcount < ch2.dataqsiz) : false,
    },
  ];

  if (hasDefault) {
    cases.push({
      id: 2,
      kind: 'caseDefault',
      chanAddr: '0x000000000000',
      chanName: 'default',
      ready: true,
    });
  }

  const ncases = cases.length;

  // 1. Генерація pollorder (Псевдовипадкова тасовка)
  const pollOrder = Array.from({ length: ncases }, (_, i) => i);
  for (let i = ncases - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pollOrder[i], pollOrder[j]] = [pollOrder[j], pollOrder[i]];
  }

  // 2. Генерація lockorder (Сортування за зростанням адрес у пам'яті для уникнення Deadlock)
  const lockOrder = Array.from({ length: ncases }, (_, i) => i);
  lockOrder.sort((a, b) => {
    if (cases[a].kind === 'caseDefault') return 1;
    if (cases[b].kind === 'caseDefault') return -1;
    return parseInt(cases[a].chanAddr, 16) - parseInt(cases[b].chanAddr, 16);
  });

  // Оцінка доступності каналів відповідно до pollorder
  let chosenIndex: number | undefined = undefined;
  for (const caseIdx of pollOrder) {
    if (cases[caseIdx].ready) {
      chosenIndex = caseIdx;
      break;
    }
  }

  const currentGoid = next.machines[0]?.curg ?? 1;

  if (chosenIndex === undefined) {
    const registeredSudogs: Array<{ chanAddr: string; sudogId: string }> = [];

    for (const c of cases) {
      if (c.kind === 'caseDefault') continue;

      const targetChan = next.channels[c.chanAddr];
      if (!targetChan) continue;

      const sudog: Sudog = {
        id: `sudog-select-${next.step}-${c.id}`,
        goid: currentGoid,
        elem: c.val,
        isSender: c.kind === 'caseSend',
        chanAddr: c.chanAddr,
        selectCaseIdx: c.id,
      };

      if (c.kind === 'caseSend') {
        targetChan.sendq.push(sudog);
      } else {
        targetChan.recvq.push(sudog);
      }

      registeredSudogs.push({ chanAddr: c.chanAddr, sudogId: sudog.id });
    }

    if (next.goroutines[currentGoid]) {
      next.goroutines[currentGoid].status = '_Gwaiting';
      next.goroutines[currentGoid].waitReason = 'select';
    }

    next.selectState = {
      cases,
      pollOrder,
      lockOrder,
      chosenCaseIndex: undefined,
      isBlocked: true,
      registeredSudogs,
    };

    next.action = 'select { ... } (BLOCKED)';
    next.explanation = `selectgo(): Жоден канал не готовий. Розміщено sudog у черги ВСІХ очікуваних каналів. Виконано gopark() для G${currentGoid}.`;
    return next;
  }

  const chosenCase = cases[chosenIndex];

  next.selectState = {
    cases,
    pollOrder,
    lockOrder,
    chosenCaseIndex: chosenIndex,
    isBlocked: false,
    registeredSudogs: [],
  };

  next.action = `select { case ${chosenCase.chanName} }`;
  next.explanation = `selectgo(): Оцінено канали за pollorder [${pollOrder.join(
    ', '
  )}]. Захоплено м'ютекси за lockorder [${lockOrder.join(', ')}]. Обрано гілку "${chosenCase.chanName}".`;

  return next;
}

/**
 * Блокування м'ютекса (sync.Mutex.Lock).
 */
export function stepMutexLock(
  prev: RuntimeSnapshot,
  mutexAddr: string = MEM_ADDRESSES.MUTEX
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const mu = next.mutexes?.[mutexAddr];
  if (!mu) throw new Error(`Mutex at ${mutexAddr} not found`);

  const currentGoid = next.machines[0]?.curg ?? 1;

  // Fast-Path: Атомарна інструкція CAS (0 -> mutexLocked)
  if (!mu.locked && !mu.starving) {
    mu.locked = true;
    next.action = `${mu.name}.Lock() (Fast-path CAS)`;
    next.explanation = `atomic.CompareAndSwapUint32(&mu.state, 0, mutexLocked): Захоплено блокування атомарно на Fast-Path.`;
    return next;
  }

  // Slow-Path: Нарощування waitersCount та перехід у starving mode при затримках
  mu.waitersCount++;
  if (mu.waitersCount >= 3) {
    mu.starving = true;
  }

  const sudog: Sudog = {
    id: `sudog-mutex-${next.step}`,
    goid: currentGoid,
    isSender: false,
    chanAddr: mutexAddr,
  };

  mu.waitq.push(sudog);
  if (next.semaRoot) {
    next.semaRoot.waiters.push({ goid: currentGoid, sudogId: sudog.id, elemAddr: mutexAddr });
  }

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'sync.Mutex.Lock';
  }

  next.action = `${mu.name}.Lock() (BLOCKED - Slow-path)`;
  next.explanation = mu.starving
    ? `М'ютекс переведено у STARVING mode. Пряма передача володіння (Direct Handoff). G${currentGoid} запарковано у semaRoot via semacquire1().`
    : `Невдача CAS та Spinlock. Додано G${currentGoid} у чергу семафори. Кількість очікуючих = ${mu.waitersCount}.`;

  return next;
}

/**
 * Розблокування м'ютекса (sync.Mutex.Unlock).
 */
export function stepMutexUnlock(
  prev: RuntimeSnapshot,
  mutexAddr: string = MEM_ADDRESSES.MUTEX
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const mu = next.mutexes?.[mutexAddr];
  if (!mu) throw new Error(`Mutex at ${mutexAddr} not found`);
  if (!mu.locked) throw new Error('panic: sync: unlock of unlocked mutex');

  if (mu.waitq.length === 0) {
    mu.locked = false;
    mu.starving = false;
    next.action = `${mu.name}.Unlock() (Fast-path)`;
    next.explanation = `atomic.AddUint32(&mu.state, -mutexLocked): Розблоковано на Fast-Path. Черга очікування порожня.`;
    return next;
  }

  const sudog = mu.waitq.shift()!;
  mu.waitersCount = Math.max(0, mu.waitersCount - 1);
  if (next.semaRoot) {
    next.semaRoot.waiters = next.semaRoot.waiters.filter((w) => w.sudogId !== sudog.id);
  }

  if (next.goroutines[sudog.goid]) {
    next.goroutines[sudog.goid].status = '_Grunnable';
    next.goroutines[sudog.goid].waitReason = undefined;
  }

  if (mu.waitersCount === 0) {
    mu.starving = false;
  }

  next.action = `${mu.name}.Unlock() -> Розбуджено G${sudog.goid}`;
  next.explanation = `semarelease(): Розблоковано м'ютекс та передано право блокування до G${sudog.goid} через semaRoot.`;
  return next;
}

/**
 * Створення нової горутини (runtime.newproc / go func()).
 */
export function spawnGoroutine(prev: RuntimeSnapshot): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  const newGoid = Object.keys(next.goroutines).length + 1;

  next.goroutines[newGoid] = {
    goid: newGoid,
    status: '_Grunnable',
    stack: { lo: '0x00c000436000', hi: '0x00c000436800', sp: '0x00c0004367f0' },
  };

  const p0 = next.processors[0];
  if (p0.runnext === undefined) {
    p0.runnext = newGoid;
  } else {
    p0.runq.push(newGoid);
  }

  next.action = `go func() [G${newGoid}]`;
  next.explanation = `newproc(): Створено G${newGoid} у стані _Grunnable. Розміщено у слот P0.runnext (Fast-path scheduling).`;
  return next;
}

/**
 * Крок планувальника (runtime.schedule).
 */
export function scheduleTick(prev: RuntimeSnapshot): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  next.action = 'runtime.schedule()';

  const p0 = next.processors[0];
  const m0 = next.machines[0];

  if (p0.runnext !== undefined) {
    const nextGoid = p0.runnext;
    p0.runnext = undefined;
    m0.curg = nextGoid;
    next.goroutines[nextGoid].status = '_Grunning';
    p0.schedtick++;
    next.explanation = `schedule(): Обрано G${nextGoid} зі слота P0.runnext.`;
    return next;
  }

  if (p0.runq.length > 0) {
    const nextGoid = p0.runq.shift()!;
    m0.curg = nextGoid;
    next.goroutines[nextGoid].status = '_Grunning';
    p0.schedtick++;
    next.explanation = `schedule(): Вилучено G${nextGoid} з локальної черги P0 (LRQ).`;
    return next;
  }

  next.explanation = 'schedule(): Не знайдено горутин у стані _Grunnable.';
  return next;
}

/**
 * Закриття каналу (runtime.closechan).
 */
export function stepClose(
  prev: RuntimeSnapshot,
  chanAddr: string = MEM_ADDRESSES.CH1
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  const hchan = next.channels[chanAddr];

  if (!hchan) throw new Error(`Channel at ${chanAddr} not found`);
  if (hchan.closed) throw new Error('panic: close of closed channel');
  hchan.closed = true;

  while (hchan.recvq.length > 0) {
    const sudog = hchan.recvq.shift()!;
    if (next.goroutines[sudog.goid]) {
      next.goroutines[sudog.goid].status = '_Grunnable';
      next.goroutines[sudog.goid].waitReason = undefined;
    }
  }

  next.action = `close(${hchan.name})`;
  next.explanation = `closechan(): Канал закрито. Усі очікуючі горутини з recvq переведено у _Grunnable via goready().`;
  return next;
}

/**
 * Зміна лічильника sync.WaitGroup.Add(delta).
 */
export function stepWGAdd(
  prev: RuntimeSnapshot,
  delta: number,
  wgAddr: string = MEM_ADDRESSES.WAITGROUP
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const wg = next.waitGroups?.[wgAddr];
  if (!wg) throw new Error(`WaitGroup at ${wgAddr} not found`);

  wg.counter += delta;
  if (wg.counter < 0) throw new Error('panic: sync: negative WaitGroup counter');

  if (wg.counter === 0 && wg.waitq.length > 0) {
    while (wg.waitq.length > 0) {
      const sudog = wg.waitq.shift()!;
      if (next.goroutines[sudog.goid]) {
        next.goroutines[sudog.goid].status = '_Grunnable';
        next.goroutines[sudog.goid].waitReason = undefined;
      }
    }
    wg.waiterCount = 0;
    next.action = `${wg.name}.Add(${delta}) [Counter reached 0]`;
    next.explanation = `Лічильник WaitGroup досяг 0. Розбуджено всі очікуючі горутини через semarelease().`;
    return next;
  }

  next.action = `${wg.name}.Add(${delta})`;
  next.explanation = `Атомарна зміна старших 32 біт поля state1. Нове значення counter = ${wg.counter}.`;
  return next;
}

/**
 * Очікування завершення sync.WaitGroup.Wait().
 */
export function stepWGWait(
  prev: RuntimeSnapshot,
  wgAddr: string = MEM_ADDRESSES.WAITGROUP
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const wg = next.waitGroups?.[wgAddr];
  if (!wg) throw new Error(`WaitGroup at ${wgAddr} not found`);

  if (wg.counter === 0) {
    next.action = `${wg.name}.Wait() (No-op)`;
    next.explanation = `Counter = 0. Повернення без блокування потоку.`;
    return next;
  }

  const currentGoid = next.machines[0]?.curg ?? 1;
  wg.waiterCount++;

  const sudog: Sudog = {
    id: `sudog-wg-${next.step}`,
    goid: currentGoid,
    isSender: false,
    chanAddr: wgAddr,
  };

  wg.waitq.push(sudog);

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'sync.WaitGroup.Wait';
  }

  next.action = `${wg.name}.Wait() (BLOCKED)`;
  next.explanation = `Counter = ${wg.counter} > 0. Додано G${currentGoid} у чергу очікування WaitGroup. Виконано gopark().`;
  return next;
}

/**
 * Скасування контексту context.CancelFunc.
 */
export function stepContextCancel(
  prev: RuntimeSnapshot,
  ctxAddr: string = MEM_ADDRESSES.CTX_CANCEL
): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const ctx = next.contexts?.[ctxAddr];
  if (!ctx) return next;

  const cancelRecursive = (targetAddr: string) => {
    const target = next.contexts?.[targetAddr];
    if (!target) return;
    target.done = true;
    target.children.forEach(cancelRecursive);
  };

  cancelRecursive(ctxAddr);

  next.action = `cancel() [${ctx.name}]`;
  next.explanation = `cancelCtx: Закрито внутрішній канал 'done' (close(c.done)). Каскадне розповсюдження сигналу скасування по всьому піддереву контекстів.`;
  return next;
}