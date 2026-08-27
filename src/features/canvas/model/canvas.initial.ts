/**
 * @file src/features/canvas/model/canvas.initial.ts
 * @module features/canvas/model/canvas.initial
 *
 * @architecture Default Initial Workspace Seed Data
 * @description Bootstrap layout definitions containing initial nodes (`goroutine-1`, `channel-1`)
 * and default connectors (`edge-initial-1`) for fresh simulation sessions.
 *
 * @see {@link DEFAULT_CANVAS_NODES}
 * @see {@link DEFAULT_CANVAS_EDGES}
 */

import type { CanvasEdge, CanvasNode } from '$shared/types/nodes';

/**
 * Initial node dataset seeded when bootstrapping the interactive canvas.
 * ANCHOR: DEFAULT_CANVAS_NODES
 */
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

/**
 * Initial edge connection dataset linking default bootstrap nodes.
 * ANCHOR: DEFAULT_CANVAS_EDGES
 */
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
