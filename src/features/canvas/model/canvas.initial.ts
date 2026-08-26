import type { CanvasEdge, CanvasNode } from '$shared/types/nodes';

export const DEFAULT_CANVAS_NODES: CanvasNode[] = [
  {
    id: 'goroutine-1',
    type: 'goroutine',
    position: { x: 120, y: 180 },
    label: 'main.main',
    goid: 1,
    status: '_Grunning',
  },
  {
    id: 'channel-1',
    type: 'channel',
    position: { x: 420, y: 180 },
    label: 'ch1',
    capacity: 2,
    elemType: 'string',
    values: [],
    closed: false,
  },
];

export const DEFAULT_CANVAS_EDGES: CanvasEdge[] = [
  {
    id: 'edge-initial-1',
    sourceNodeId: 'goroutine-1',
    targetNodeId: 'channel-1',
    source: 'goroutine-1',
    target: 'channel-1',
    kind: 'sudog_link',
  },
];
