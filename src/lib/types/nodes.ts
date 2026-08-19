export type CanvasNodeType = 'goroutine' | 'channel' | 'mutex' | 'waitgroup' | 'select';

export interface BaseCanvasNode {
  id: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  label: string;
}

export interface GoroutineInstruction {
  type: 'send' | 'recv' | 'lock' | 'unlock' | 'wg_add' | 'wg_wait';
  targetId: string;
  payload?: string;
}

export interface GoroutineNode extends BaseCanvasNode {
  type: 'goroutine';
  goid: number;
  status: '_Gidle' | '_Grunnable' | '_Grunning' | '_Gsyscall' | '_Gwaiting' | '_Gdead';
  instructions?: GoroutineInstruction[];
}

export interface ChannelNode extends BaseCanvasNode {
  type: 'channel';
  capacity: number;
  values: any[];
  closed: boolean;
}

export interface MutexNode extends BaseCanvasNode {
  type: 'mutex';
  locked: boolean;
  starving: boolean;
  waitersCount: number;
}

export interface WaitGroupNode extends BaseCanvasNode {
  type: 'waitgroup';
  counter: number;
  waiterCount: number;
}

export interface SelectCase {
  id: string;
  kind: 'caseSend' | 'caseRecv' | 'caseDefault';
  chanId?: string;
}

export interface SelectNode extends BaseCanvasNode {
  type: 'select';
  cases: SelectCase[];
}

export type CanvasNode =
  | GoroutineNode
  | ChannelNode
  | MutexNode
  | WaitGroupNode
  | SelectNode;

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  source?: string;
  target?: string;
  kind?: 'data_flow' | 'sync_lock' | 'context_signal';
}