export type CanvasNodeType = 'goroutine' | 'channel';

export type GoroutineStatus = '_Gidle' | '_Grunnable' | '_Grunning' | '_Gsyscall' | '_Gwaiting' | '_Gdead';

export type ChannelElemType = 'string' | 'int64' | 'bool' | 'struct{}';

export const ELEM_SIZE_MAP: Record<ChannelElemType, number> = {
  'string': 16,
  'int64': 8,
  'bool': 1,
  'struct{}': 0,
};

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
