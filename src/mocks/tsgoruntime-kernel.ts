/* eslint-disable @typescript-eslint/no-explicit-any */
export const createInitialSnapshot = (): any => ({
  goroutines: {},
  channels: {},
  processors: {},
  sched: { grq: [] },
});

export const scheduleTick = (): any => ({});
export const spawnGoroutine = (): any => ({});
export const stepClose = (): any => ({});
export const stepContextCancel = (): any => ({});
export const stepMutexLock = (): any => ({});
export const stepMutexUnlock = (): any => ({});
export const stepReceive = (): any => ({});
export const stepSelect = (): any => ({});
export const stepSend = (): any => ({});
export const stepWGAdd = (): any => ({});
export const stepWGWait = (): any => ({});
export const analyzeConcurrencyIssues = (): any[] => [];
