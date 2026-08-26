import type {
  CanvasEdge,
  CanvasNode,
  CanvasNodeType,
  ChannelElemType,
  GoroutineNode,
  ChannelNode,
} from '$shared/types/nodes';
import { formatHex, getRawBaseAddress } from '$core/memory/layout';
import { DEFAULT_CANVAS_NODES, DEFAULT_CANVAS_EDGES } from './canvas.initial';

export type CanvasTool = 'pointer' | 'connect' | CanvasNodeType;

export interface ConnectionCheck {
  valid: boolean;
  reason?: string;
}

export function validateConnection(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  sourceId: string,
  targetId: string,
  ignoreEdgeId?: string,
): ConnectionCheck {
  if (sourceId === targetId) {
    return { valid: false, reason: 'Self connection impossible' };
  }

  const src = nodes.find((n) => n.id === sourceId);
  const tgt = nodes.find((n) => n.id === targetId);
  if (!src || !tgt) return { valid: false, reason: 'Node not found' };

  const isCorrectPair =
    (src.type === 'goroutine' && tgt.type === 'channel') ||
    (src.type === 'channel' && tgt.type === 'goroutine');

  if (!isCorrectPair) {
    if (src.type === tgt.type) {
      return {
        valid: false,
        reason:
          src.type === 'goroutine'
            ? 'Direct Goroutine-to-Goroutine connection invalid in runtime'
            : 'Direct Channel-to-Channel connection invalid in runtime',
      };
    }
    return { valid: false, reason: 'Invalid connection type' };
  }

  const alreadyConnected = edges.some(
    (e) =>
      e.id !== ignoreEdgeId &&
      ((e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId)),
  );

  if (alreadyConnected) {
    return { valid: false, reason: 'Connector already exists between these nodes' };
  }

  return { valid: true };
}

/**
 * @todo Issue #CANVAS-102: Extend CanvasStore to map additional runtime primitives.
 * Update state handlers and mappers to synchronize:
 * - Mutex lock states and wait queues
 * - Semaphore trees (semaRoot)
 * - Channel multiplexing cases (selectgo)
 */
class CanvasStore {
  edges = $state<CanvasEdge[]>([]);
  nodes = $state<CanvasNode[]>([]);
  selectedNodeId = $state<string | null>(null);
  selectedEdgeId = $state<string | null>(null);
  activeTool = $state<CanvasTool>('pointer');
  isSimulating = $state(false);

  goroutinesByGoid = $derived.by(() => {
    const map = new Map<number, GoroutineNode>();
    for (const node of this.nodes) {
      if (node.type === 'goroutine') {
        map.set(node.goid, node);
      }
    }
    return map;
  });

  channelsByLabelOrAddress = $derived.by(() => {
    const map = new Map<string, ChannelNode>();
    for (const node of this.nodes) {
      if (node.type === 'channel') {
        map.set(node.label, node);
        map.set(formatHex(getRawBaseAddress(node.id)), node);
      }
    }
    return map;
  });

  constructor() {
    this.initMainWorkspace();
  }

  setTool(tool: CanvasTool) {
    this.activeTool = tool;
  }

  initMainWorkspace() {
    this.nodes = structuredClone(DEFAULT_CANVAS_NODES);
    this.edges = structuredClone(DEFAULT_CANVAS_EDGES);
    this.selectNode('goroutine-1');
  }

  addNode(type: CanvasNodeType, position: { x: number; y: number }, label?: string): CanvasNode {
    const currentIndex = this.nodes.filter((n) => n.type === type).length + 1;
    const id = `${type}-${currentIndex}`;
    const nodeLabel = label || (type === 'goroutine' ? `G${currentIndex}` : `ch${currentIndex}`);

    const base = { id, type, position: { ...position }, label: nodeLabel };
    let node: CanvasNode;

    if (type === 'goroutine') {
      node = { ...base, type: 'goroutine', goid: currentIndex, status: '_Grunnable' };
    } else {
      node = {
        ...base,
        type: 'channel',
        capacity: 2,
        elemType: 'string',
        values: [],
        closed: false,
      };
    }

    this.nodes.push(node);
    this.selectNode(id);
    return node;
  }

  setNodeLabel(id: string, label: string) {
    const node = this.getNode(id);
    if (node) {
      node.label = label;
    }
  }

  setChannelCapacity(id: string, capacity: number) {
    const node = this.getNode(id);
    if (node && node.type === 'channel') {
      node.capacity = Math.max(0, capacity);
    }
  }

  setChannelElemType(id: string, elemType: ChannelElemType) {
    const node = this.getNode(id);
    if (node && node.type === 'channel') {
      node.elemType = elemType;
    }
  }

  removeNode(id: string) {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      this.nodes.splice(idx, 1);
    }
    this.edges = this.edges.filter((e) => e.source !== id && e.target !== id);
    if (this.selectedNodeId === id) this.selectedNodeId = null;
  }

  updatePosition(id: string, pos: { x: number; y: number }) {
    const node = this.getNode(id);
    if (node) {
      node.position.x = pos.x;
      node.position.y = pos.y;
    }
  }

  selectNode(id: string | null) {
    this.selectedNodeId = id;
    if (id !== null) this.selectedEdgeId = null;
  }

  selectEdge(id: string | null) {
    this.selectedEdgeId = id;
    if (id !== null) this.selectedNodeId = null;
  }

  addEdge(sourceId: string, targetId: string, kind: CanvasEdge['kind'] = 'sudog_link'): boolean {
    const check = validateConnection(this.nodes, this.edges, sourceId, targetId);
    if (!check.valid) return false;

    const edgeId = `edge-${Date.now()}`;
    const edge: CanvasEdge = {
      id: edgeId,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      source: sourceId,
      target: targetId,
      kind,
    };

    this.edges.push(edge);
    this.selectEdge(edge.id);
    return true;
  }

  reconnectEdge(edgeId: string, newSourceId?: string, newTargetId?: string): boolean {
    const edge = this.getEdge(edgeId);
    if (!edge) return false;

    const source = newSourceId ?? edge.source;
    const target = newTargetId ?? edge.target;

    const check = validateConnection(this.nodes, this.edges, source, target, edgeId);
    if (!check.valid) return false;

    edge.sourceNodeId = source;
    edge.targetNodeId = target;
    edge.source = source;
    edge.target = target;
    return true;
  }

  getNode(id: string | null): CanvasNode | null {
    return id ? (this.nodes.find((node) => node.id === id) ?? null) : null;
  }

  getEdge(id: string | null): CanvasEdge | null {
    return id ? (this.edges.find((e) => e.id === id) ?? null) : null;
  }

  removeEdge(id: string) {
    const idx = this.edges.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.edges.splice(idx, 1);
    }
    if (this.selectedEdgeId === id) this.selectedEdgeId = null;
  }

  clear() {
    this.nodes = [];
    this.edges = [];
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
  }
}

export const canvasStore = new CanvasStore();
