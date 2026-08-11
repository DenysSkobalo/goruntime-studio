export interface Translation {
app: {
    title: string;
    subtitle: string;
};
nav: {
    inspector: string;
    canvas: string;
    theme: string;
    language: string;
};
inspector: {
    title: string;
    description: string;
    controls: {
        capacity: string;
        reinit: string;
        send: string;
        receive: string;
        close: string;
        spawn: string;
        schedule: string;
        select: string;
        mutexLock: string;
        mutexUnlock: string;
        wgAdd: string;
        wgWait: string;
        cancel: string;
    };
    timeline: {
        step: string;
        snapshot: string;
        previous: string;
        next: string;
        of: string;
    };
    scheduler: {
        title: string;
        subtitle: string;
        grq: string;
        processor: string;
        runnext: string;
        lrq: string;
        boundThread: string;
        goroutineLifecycle: string;
        stackHi: string;
        stackSp: string;
        stackLo: string;
        parkReason: string;
    };
    hchan: {
        title: string;
        heapAllocation: string;
        closed: string;
        locked: string;
        qcount: string;
        dataqsiz: string;
        sendx: string;
        recvx: string;
        buffer: string;
        elemsize: string;
        unbuffered: string;
        sendq: string;
        recvq: string;
        sudog: string;
        queueEmpty: string;
    };
    select: {
        title: string;
        subtitle: string;
        statusWaiting: string;
        statusExecuted: string;
        pollOrder: string;
        pollOrderHint: string;
        lockOrder: string;
        lockOrderHint: string;
        cases: string;
        caseRecv: string;
        caseSend: string;
        caseDefault: string;
        chosen: string;
        ready: string;
    };
    sync: {
        mutexTitle: string;
        waitGroupTitle: string;
        semaRootTitle: string;
        starvingMode: string;
        stateLocked: string;
        locked: string;
        unlocked: string;
        mutexWoken: string;
        mutexStarving: string;
        waiterShift: string;
        counter: string;
        waiterCount: string;
        semaEmpty: string;
    };
    context: {
        title: string;
        subtitle: string;
        doneClosed: string;
        active: string;
    };
};
canvas: {
    title: string;
    subtitle: string;
    addNode: string;
    simulate: string;
    placeholder: {
        title: string;
        description: string;
    };
    palette: {
        goroutine: string;
        channel: string;
        mutex: string;
        waitgroup: string;
        select: string;
    };
};
}