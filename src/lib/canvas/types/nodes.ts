export type CanvasNodeType = 'goroutine' | 'channel' | 'mutex' | 'waitgroup' | 'select';

export interface BaseCanvasNode {
  id: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  label: string;
}

export interface GoroutineCanvasNode extends BaseCanvasNode {
  type: 'goroutine';
  goid: number;
  status: '_Grunnable' | '_Grunning' | '_Gwaiting';
  instructions: Array<{
    type: 'send' | 'recv' | 'lock' | 'unlock' | 'wg_add' | 'wg_wait';
    targetId: string;
    payload?: string;
  }>;
}

export interface ChannelCanvasNode extends BaseCanvasNode {
  type: 'channel';
  capacity: number;
  values: string[];
  closed: boolean;
}

export interface MutexCanvasNode extends BaseCanvasNode {
  type: 'mutex';
  locked: boolean;
  starving: boolean;
  waitersCount: number;
}

export interface WaitGroupCanvasNode extends BaseCanvasNode {
  type: 'waitgroup';
  counter: number;
  waiterCount: number;
}

export interface SelectCanvasNode extends BaseCanvasNode {
  type: 'select';
  cases: Array<{
    kind: 'send' | 'recv' | 'default';
    targetId: string;
  }>;
}

export type CanvasNode = GoroutineCanvasNode | ChannelCanvasNode | MutexCanvasNode | WaitGroupCanvasNode | SelectCanvasNode;

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  kind: 'data_flow' | 'sync_lock' | 'context_signal';
}