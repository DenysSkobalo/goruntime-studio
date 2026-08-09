export type CanvasNodeType = 'goroutine' | 'channel' | 'mutex' | 'waitgroup' | 'context';

export interface BaseCanvasNode {
  id: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  label: string;
}

export interface GoroutineCanvasNode extends BaseCanvasNode {
  type: 'goroutine';
  goid: number;
  instructions: Array<{
    type: 'send' | 'recv' | 'lock' | 'unlock' | 'wg_add' | 'wg_wait';
    targetId: string; // ID вузла каналу або мутекса
    payload?: string;
  }>;
}

export interface ChannelCanvasNode extends BaseCanvasNode {
  type: 'channel';
  capacity: number;
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  kind: 'data_flow' | 'sync_lock' | 'context_signal';
}
