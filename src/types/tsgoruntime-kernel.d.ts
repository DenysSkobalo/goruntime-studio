/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'tsgoruntime-kernel' {
  export type GoroutineStatus = any;

  export interface StackInfo {
    lo: string | number | bigint;
    hi: string | number | bigint;
    sp: string | number | bigint;
    [key: string]: any;
  }

  export interface Goroutine {
    goid: number;
    status: GoroutineStatus;
    stackSize?: number;
    stack: StackInfo;
    [key: string]: any;
  }

  export interface KernelGoroutineState {
    goid: number;
    status: GoroutineStatus;
    stack?: StackInfo;
    [key: string]: any;
  }

  export interface KernelChannelState {
    name: string;
    address: string;
    bufSize?: number;
    buf: any[];
    closed: boolean;
    dataqsiz: number;
    [key: string]: any;
  }

  export interface Processor {
    id: number;
    status: string;
    runq: any[];
    [key: string]: any;
  }

  export interface SchedState {
    grq: any[];
    [key: string]: any;
  }

  export interface RuntimeSnapshot {
    goroutines: Record<string | number, KernelGoroutineState>;
    channels: Record<string | number, KernelChannelState>;
    processors: Record<string | number, Processor>;
    sched: SchedState;
    [key: string]: any;
  }

  export interface ConcurrencyIssue {
    id?: string | number;
    type?: string;
    code?: string;
    message?: string;
    severity: string;
    [key: string]: any;
  }

  export function createInitialSnapshot(...args: any[]): RuntimeSnapshot;
  export function scheduleTick(...args: any[]): any;
  export function spawnGoroutine(...args: any[]): any;
  export function stepClose(...args: any[]): any;
  export function stepContextCancel(...args: any[]): any;
  export function stepMutexLock(...args: any[]): any;
  export function stepMutexUnlock(...args: any[]): any;
  export function stepReceive(...args: any[]): any;
  export function stepSelect(...args: any[]): any;
  export function stepSend(...args: any[]): any;
  export function stepWGAdd(...args: any[]): any;
  export function stepWGWait(...args: any[]): any;
  export function analyzeConcurrencyIssues(...args: any[]): ConcurrencyIssue[];
}
