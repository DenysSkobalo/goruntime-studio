/**
 * @todo Issue #CANVAS-101: Expand CanvasNodeType for core synchronization primitives.
 * Target primitives to be implemented in future tasks:
 * - 'mutex' (sync.Mutex)
 * - 'waitgroup' (sync.WaitGroup)
 * - 'context' (context.Context)
 * - 'select' (selectgo)
 * - 'atomic'
 */
export type CanvasNodeType = 'goroutine' | 'channel';

export type GoroutineStatus =
  '_Gidle' | '_Grunnable' | '_Grunning' | '_Gsyscall' | '_Gwaiting' | '_Gdead';

export type ChannelElemType = 'string' | 'int64' | 'bool' | 'struct{}';

export interface BaseCanvasNode {
  id: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  label: string;
}

export interface GoroutineNode extends BaseCanvasNode {
  type: 'goroutine';
  goid: number;
  status: GoroutineStatus;
}

export interface ChannelNode extends BaseCanvasNode {
  type: 'channel';
  capacity: number;
  elemType: ChannelElemType;
  values: string[];
  closed: boolean;
}

export type CanvasNode = GoroutineNode | ChannelNode;

export type EdgeKind = 'sudog_link';

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

export function isGoroutineNode(node: CanvasNode | null): node is GoroutineNode {
  return node?.type === 'goroutine';
}

export function isChannelNode(node: CanvasNode | null): node is ChannelNode {
  return node?.type === 'channel';
}
