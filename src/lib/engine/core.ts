import type { 
  RuntimeSnapshot, 
  Goroutine, 
  Processor, 
  Machine, 
  HChan, 
  Sudog, 
  SelectCase, 
  ContextState 
} from './types';

function cloneSnapshot(prev: RuntimeSnapshot): RuntimeSnapshot {
  return JSON.parse(JSON.stringify(prev));
}

/**
 * Ініціалізує початковий стан рантайму Go з об'єктами купи, GMP, sync та context.
 */
export function createInitialSnapshot(capacity: number): RuntimeSnapshot {
  const ch1Addr = '0x00c000082000';
  const ch2Addr = '0x00c000082080';
  const muAddr = '0x00c000090000';
  const wgAddr = '0x00c000090080';
  const semaAddr = '0x00c000021000';
  const ctxBgAddr = '0x00c0000a0000';
  const ctxCancelAddr = '0x00c0000a0040';

  const ch1: HChan = {
    address: ch1Addr,
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
    isLocked: false
  };

  const ch2: HChan = {
    address: ch2Addr,
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
    isLocked: false
  };

  const g1: Goroutine = {
    goid: 1,
    status: '_Grunning',
    stack: { lo: '0xc000032000', hi: '0xc000034000', sp: '0xc000033fa0' },
    assignedM: 0
  };

  const p0: Processor = { id: 0, status: '_Prunning', runq: [], schedtick: 0, m: 0 };
  const p1: Processor = { id: 1, status: '_Pidle', runq: [], schedtick: 0 };
  const m0: Machine = { id: 0, p: 0, curg: 1, inSyscall: false };

  return {
    step: 0,
    action: 'runtime.schedinit()',
    explanation: `Initialized Go Runtime. Allocated channels, sync primitives (sync.Mutex, sync.WaitGroup), semaRoot treap, and context tree.`,
    codeLine: 1,
    channels: { [ch1Addr]: ch1, [ch2Addr]: ch2 },
    goroutines: { 1: g1 },
    processors: { 0: p0, 1: p1 },
    machines: { 0: m0 },
    sched: { grq: [], lock: false },
    mutexes: {
      [muAddr]: {
        address: muAddr,
        name: 'mu',
        locked: false,
        woken: false,
        starving: false,
        waitersCount: 0,
        waitq: []
      }
    },
    waitGroups: {
      [wgAddr]: {
        address: wgAddr,
        name: 'wg',
        counter: 0,
        waiterCount: 0,
        waitq: []
      }
    },
    semaRoot: {
      address: semaAddr,
      waiters: []
    },
    contexts: {
      [ctxBgAddr]: {
        address: ctxBgAddr,
        name: 'context.Background()',
        kind: 'background',
        done: false,
        children: [ctxCancelAddr]
      },
      [ctxCancelAddr]: {
        address: ctxCancelAddr,
        name: 'ctxWithCancel',
        kind: 'cancelCtx',
        parentAddress: ctxBgAddr,
        done: false,
        children: []
      }
    }
  };
}

/**
 * Пряма передача даних між стеками або буферизація (chansend).
 */
export function stepSend(prev: RuntimeSnapshot, val: string, chanAddr = '0x00c000082000'): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  const hchan = next.channels[chanAddr];

  if (!hchan) throw new Error(`Channel at ${chanAddr} not found`);
  if (hchan.closed) throw new Error('panic: send on closed channel');

  if (hchan.recvq.length > 0) {
    const sudog = hchan.recvq.shift()!;
    next.action = `${hchan.name} <- "${val}" (sendDirect)`;
    next.explanation = `chansend(): Direct stack-to-stack copy to waiting G${sudog.goid}. Unparked G${sudog.goid} via goready().`;
    
    if (next.goroutines[sudog.goid]) {
      next.goroutines[sudog.goid].status = '_Grunnable';
      next.goroutines[sudog.goid].waitReason = undefined;
    }
    return next;
  }

  if (hchan.dataqsiz > 0 && hchan.qcount < hchan.dataqsiz) {
    hchan.buf[hchan.sendx] = { id: `elem-${next.step}`, val };
    hchan.sendx = (hchan.sendx + 1) % hchan.dataqsiz;
    hchan.qcount++;

    next.action = `${hchan.name} <- "${val}"`;
    next.explanation = `chansend(): Written to ring buffer slot [${(hchan.sendx - 1 + hchan.dataqsiz) % hchan.dataqsiz}]. qcount = ${hchan.qcount}.`;
    return next;
  }

  const currentGoid = next.machines[0]?.curg ?? 1;
  const sudog: Sudog = {
    id: `sudog-${next.step}`,
    goid: currentGoid,
    elem: val,
    isSender: true,
    chanAddr
  };
  hchan.sendq.push(sudog);

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'chan send';
  }

  next.action = `${hchan.name} <- "${val}" (BLOCKED)`;
  next.explanation = `chansend(): Channel full/unbuffered. Enqueued sudog into sendq. Parked G${currentGoid} via gopark().`;
  return next;
}

/**
 * Читання з каналу (chanrecv).
 */
export function stepReceive(prev: RuntimeSnapshot, chanAddr = '0x00c000082000'): { snapshot: RuntimeSnapshot; val?: string } {
  const next = cloneSnapshot(prev);
  next.step++;
  const hchan = next.channels[chanAddr];

  if (!hchan) throw new Error(`Channel at ${chanAddr} not found`);

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
    next.explanation = `chanrecv(): Drained blocked producer G${sudog.goid} from sendq. Transitioned G${sudog.goid} to _Grunnable.`;
    return { snapshot: next, val: receivedVal };
  }

  if (hchan.qcount > 0) {
    const item = hchan.buf[hchan.recvx];
    const val = item?.val;
    hchan.buf[hchan.recvx] = null;
    hchan.recvx = (hchan.recvx + 1) % hchan.dataqsiz;
    hchan.qcount--;

    next.action = `<-${hchan.name} (val: "${val}")`;
    next.explanation = `chanrecv(): Dequeued element from ring buffer slot [${(hchan.recvx - 1 + hchan.dataqsiz) % hchan.dataqsiz}].`;
    return { snapshot: next, val };
  }

  const currentGoid = next.machines[0]?.curg ?? 1;
  const sudog: Sudog = {
    id: `sudog-${next.step}`,
    goid: currentGoid,
    isSender: false,
    chanAddr
  };
  hchan.recvq.push(sudog);

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'chan receive';
  }

  next.action = `<-${hchan.name} (BLOCKED)`;
  next.explanation = `chanrecv(): Channel empty. Enqueued sudog into recvq. Parked G${currentGoid} via gopark().`;
  return { snapshot: next };
}

/**
 * Мультиплексор runtime.selectgo з алгоритмами pollorder та lockorder.
 */
export function stepSelect(prev: RuntimeSnapshot, hasDefault = false): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const ch1Addr = '0x00c000082000';
  const ch2Addr = '0x00c000082080';

  const ch1 = next.channels[ch1Addr];
  const ch2 = next.channels[ch2Addr];

  const cases: SelectCase[] = [
    {
      id: 0,
      kind: 'caseRecv',
      chanAddr: ch1Addr,
      chanName: 'ch1',
      ready: ch1.qcount > 0 || ch1.sendq.length > 0
    },
    {
      id: 1,
      kind: 'caseSend',
      chanAddr: ch2Addr,
      chanName: 'ch2',
      val: 'select_data',
      ready: ch2.recvq.length > 0 || (ch2.dataqsiz > 0 && ch2.qcount < ch2.dataqsiz)
    }
  ];

  if (hasDefault) {
    cases.push({
      id: 2,
      kind: 'caseDefault',
      chanAddr: '0x000000000000',
      chanName: 'default',
      ready: true
    });
  }

  const ncases = cases.length;

  const pollOrder = Array.from({ length: ncases }, (_, i) => i);
  for (let i = ncases - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pollOrder[i], pollOrder[j]] = [pollOrder[j], pollOrder[i]];
  }

  const lockOrder = Array.from({ length: ncases }, (_, i) => i);
  lockOrder.sort((a, b) => {
    if (cases[a].kind === 'caseDefault') return 1;
    if (cases[b].kind === 'caseDefault') return -1;
    return parseInt(cases[a].chanAddr, 16) - parseInt(cases[b].chanAddr, 16);
  });

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
      const sudog: Sudog = {
        id: `sudog-select-${next.step}-${c.id}`,
        goid: currentGoid,
        elem: c.val,
        isSender: c.kind === 'caseSend',
        chanAddr: c.chanAddr,
        selectCaseIdx: c.id
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
      registeredSudogs
    };

    next.action = 'select { ... } (BLOCKED)';
    next.explanation = `selectgo(): No channels ready. Allocated sudog structs across ALL channels. Executed gopark() for G${currentGoid}.`;
    return next;
  }

  const chosenCase = cases[chosenIndex];

  next.selectState = {
    cases,
    pollOrder,
    lockOrder,
    chosenCaseIndex: chosenIndex,
    isBlocked: false,
    registeredSudogs: []
  };

  next.action = `select { case ${chosenCase.chanName} }`;
  next.explanation = `selectgo(): Evaluated channels in pollorder [${pollOrder.join(', ')}]. Acquired locks in lockorder [${lockOrder.join(', ')}]. Selected case "${chosenCase.chanName}".`;

  return next;
}

export function spawnGoroutine(prev: RuntimeSnapshot): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  const newGoid = Object.keys(next.goroutines).length + 1;
  
  next.goroutines[newGoid] = {
    goid: newGoid,
    status: '_Grunnable',
    stack: { lo: '0xc000040000', hi: '0xc000042000', sp: '0xc000041f00' }
  };

  const p0 = next.processors[0];
  if (p0.runnext === undefined) {
    p0.runnext = newGoid;
  } else {
    p0.runq.push(newGoid);
  }

  next.action = `go func() [G${newGoid}]`;
  next.explanation = `newproc(): Created G${newGoid} in status _Grunnable. Enqueued into P0.`;
  return next;
}

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
    next.explanation = `schedule(): Picked G${nextGoid} from P0.runnext slot.`;
    return next;
  }

  if (p0.runq.length > 0) {
    const nextGoid = p0.runq.shift()!;
    m0.curg = nextGoid;
    next.goroutines[nextGoid].status = '_Grunning';
    p0.schedtick++;
    next.explanation = `schedule(): Dequeued G${nextGoid} from P0 LRQ.`;
    return next;
  }

  next.explanation = 'schedule(): No runnable Goroutines found.';
  return next;
}

export function triggerWorkSteal(prev: RuntimeSnapshot): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  next.action = 'runtime.runqsteal()';
  return next;
}

export function stepClose(prev: RuntimeSnapshot, chanAddr = '0x00c000082000'): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;
  const hchan = next.channels[chanAddr];

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
  next.explanation = `closechan(): Closed ${hchan.name}. Flushed wait queues via goready().`;
  return next;
}

/**
 * Симуляція sync.Mutex.Lock()
 */
export function stepMutexLock(prev: RuntimeSnapshot, mutexAddr = '0x00c000090000'): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const mu = next.mutexes?.[mutexAddr];
  if (!mu) throw new Error(`Mutex at ${mutexAddr} not found`);

  const currentGoid = next.machines[0]?.curg ?? 1;

  if (!mu.locked && !mu.starving) {
    mu.locked = true;
    next.action = `${mu.name}.Lock() (Fast-path CAS)`;
    next.explanation = `atomic.CompareAndSwapUint32(&mu.state, 0, mutexLocked): Acquired lock immediately via fast-path.`;
    return next;
  }

  mu.waitersCount++;
  if (mu.waitersCount >= 3) {
    mu.starving = true;
  }

  const sudog: Sudog = {
    id: `sudog-mutex-${next.step}`,
    goid: currentGoid,
    isSender: false,
    chanAddr: mutexAddr
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
    ? `Mutex switched to STARVING mode. Direct handoff active. G${currentGoid} parked in semaRoot via semacquire1().`
    : `CAS failed. Spin yield failed. Enqueued G${currentGoid} into semaRoot queue. State waiters = ${mu.waitersCount}.`;

  return next;
}

/**
 * Симуляція sync.Mutex.Unlock()
 */
export function stepMutexUnlock(prev: RuntimeSnapshot, mutexAddr = '0x00c000090000'): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const mu = next.mutexes?.[mutexAddr];
  if (!mu) throw new Error(`Mutex at ${mutexAddr} not found`);
  if (!mu.locked) throw new Error('panic: sync: unlock of unlocked mutex');

  if (mu.waitq.length === 0) {
    mu.locked = false;
    mu.starving = false;
    next.action = `${mu.name}.Unlock() (Fast-path)`;
    next.explanation = `atomic.AddUint32(&mu.state, -mutexLocked): Released lock with no waiters.`;
    return next;
  }

  const sudog = mu.waitq.shift()!;
  mu.waitersCount = Math.max(0, mu.waitersCount - 1);
  if (next.semaRoot) {
    next.semaRoot.waiters = next.semaRoot.waiters.filter(w => w.sudogId !== sudog.id);
  }

  if (next.goroutines[sudog.goid]) {
    next.goroutines[sudog.goid].status = '_Grunnable';
    next.goroutines[sudog.goid].waitReason = undefined;
  }

  if (mu.waitersCount === 0) {
    mu.starving = false;
  }

  next.action = `${mu.name}.Unlock() -> Woke G${sudog.goid}`;
  next.explanation = `semarelease(): Unlocked mutex and handed ownership to G${sudog.goid} via semaRoot.`;
  return next;
}

/**
 * Симуляція sync.WaitGroup.Add(delta)
 */
export function stepWGAdd(prev: RuntimeSnapshot, delta: number, wgAddr = '0x00c000090080'): RuntimeSnapshot {
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
    next.explanation = `WaitGroup counter reached 0. Released all waiting goroutines via semarelease().`;
    return next;
  }

  next.action = `${wg.name}.Add(${delta})`;
  next.explanation = `Atomic addition to high 32 bits of state. New counter = ${wg.counter}.`;
  return next;
}

/**
 * Симуляція sync.WaitGroup.Wait()
 */
export function stepWGWait(prev: RuntimeSnapshot, wgAddr = '0x00c000090080'): RuntimeSnapshot {
  const next = cloneSnapshot(prev);
  next.step++;

  const wg = next.waitGroups?.[wgAddr];
  if (!wg) throw new Error(`WaitGroup at ${wgAddr} not found`);

  if (wg.counter === 0) {
    next.action = `${wg.name}.Wait() (No-op)`;
    next.explanation = `Counter is 0. Wait() returned immediately without parking.`;
    return next;
  }

  const currentGoid = next.machines[0]?.curg ?? 1;
  wg.waiterCount++;

  const sudog: Sudog = {
    id: `sudog-wg-${next.step}`,
    goid: currentGoid,
    isSender: false,
    chanAddr: wgAddr
  };

  wg.waitq.push(sudog);

  if (next.goroutines[currentGoid]) {
    next.goroutines[currentGoid].status = '_Gwaiting';
    next.goroutines[currentGoid].waitReason = 'sync.WaitGroup.Wait';
  }

  next.action = `${wg.name}.Wait() (BLOCKED)`;
  next.explanation = `Counter = ${wg.counter} > 0. Enqueued G${currentGoid} into WaitGroup sema queue. Executed gopark().`;
  return next;
}

/**
 * Симуляція скасування контексту cancel()
 */
export function stepContextCancel(prev: RuntimeSnapshot, ctxAddr = '0x00c0000a0040'): RuntimeSnapshot {
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
  next.explanation = `cancelCtx: Closed internal 'done' channel (close(c.done)). Cascaded cancellation signal down the context tree.`;
  return next;
}
