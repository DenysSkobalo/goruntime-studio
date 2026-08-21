import type { CanvasEdge, CanvasNode, CanvasNodeType } from "$lib/types/nodes";

const typeCounters: Record<CanvasNodeType, number> = {
  goroutine: 0,
  channel: 0,
  mutex: 0,
  waitgroup: 0,
  select: 0,
};

export type CanvasTool = 'pointer' | 'connect' | CanvasNodeType;

export function isValidConnection(srcType: CanvasNodeType, tgtType: CanvasNodeType): boolean {
  if (srcType === 'mutex' || tgtType === 'mutex') {
    return (srcType === 'goroutine' && tgtType === 'mutex') || (srcType === 'mutex' && tgtType === 'goroutine');
  }
  if (srcType === 'waitgroup' || tgtType === 'waitgroup') {
    return (srcType === 'goroutine' && tgtType === 'waitgroup') || (srcType === 'waitgroup' && tgtType === 'goroutine');
  }
  if (srcType === 'select' || tgtType === 'select') {
    const allowed = ['goroutine', 'channel'];
    return allowed.includes(srcType) && allowed.includes(tgtType) && srcType !== tgtType;
  }
  if (srcType === 'channel' && tgtType === 'channel') {
    return false;
  }
  return true;
}

class CanvasStore {
  edges = $state<CanvasEdge[]>([]);
  nodes = $state<CanvasNode[]>([]);
  selectedNodeId = $state<string | null>(null);
  selectedEdgeId = $state<string | null>(null);
  activeTool = $state<CanvasTool>('pointer');
  isSimulating = $state(false);

  setTool(tool: CanvasTool) {
    this.activeTool = tool;
    if (tool !== 'pointer' && tool !== 'connect') {
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
    }
  }

  addNode(type: CanvasNodeType, position: { x: number; y: number }, label?: string): CanvasNode {
    typeCounters[type]++;
    const currentIndex = typeCounters[type];
    const id = `${type}-${currentIndex}`;
    const nodeLabel = label || `${type}-${currentIndex}`;

    const base = {
      id,
      type,
      position: { ...position },
      label: nodeLabel,
    };

    let node: CanvasNode;
    switch (type) {
      case 'goroutine':
        node = { ...base, type: 'goroutine', goid: currentIndex, status: '_Grunnable', instructions: [] };
        break;
      case 'channel':
        node = { ...base, type: 'channel', capacity: 2, values: [], closed: false };
        break;
      case 'mutex':
        node = { ...base, type: 'mutex', locked: false, starving: false, waitersCount: 0 };
        break;
      case 'waitgroup':
        node = { ...base, type: 'waitgroup', counter: 0, waiterCount: 0 };
        break;
      case 'select':
        node = { ...base, type: 'select', cases: [] };
        break;
      default:
        throw new Error(`Unknown node type: ${type}`);
    }

    this.nodes = [...this.nodes, node];
    this.selectNode(id);
    return node;
  }

  removeNode(id: string) {
    this.nodes = this.nodes.filter((n) => n.id !== id);
    this.edges = this.edges.filter((e) => e.source !== id && e.target !== id);
    if (this.selectedNodeId === id) this.selectedNodeId = null;
  }

  updatePosition(id: string, pos: { x: number; y: number }) {
    this.nodes = this.nodes.map((n) => (n.id === id ? { ...n, position: pos } : n));
  }

  selectNode(id: string | null) {
    this.selectedNodeId = id;
    if (id !== null) {
      this.selectedEdgeId = null;
    }
  }

  selectEdge(id: string | null) {
    this.selectedEdgeId = id;
    if (id !== null) {
      this.selectedNodeId = null;
    }
  }

  addEdge(sourceId: string, targetId: string, kind?: CanvasEdge['kind']): boolean {
    if (sourceId === targetId) return false;

    const src = this.getNode(sourceId);
    const tgt = this.getNode(targetId);
    if (!src || !tgt) return false;

    if (!isValidConnection(src.type, tgt.type)) {
      return false;
    }

    const exists = this.edges.some(
      (e) => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId)
    );
    if (exists) return false;

    let finalKind = kind;
    if (!finalKind) {
      if (tgt.type === 'mutex') finalKind = 'sync_lock';
      else if (tgt.type === 'waitgroup') finalKind = 'context_signal';
      else finalKind = 'data_flow';
    }

    const edgeId = `edge-${this.edges.length + 1}`;
    const edge: CanvasEdge = {
      id: edgeId,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      source: sourceId,
      target: targetId,
      kind: finalKind,
    };

    this.edges = [...this.edges, edge];
    this.selectEdge(edge.id);
    return true;
  }

  reconnectEdge(edgeId: string, end: 'source' | 'target', newNodeId: string): boolean {
    const edge = this.edges.find((e) => e.id === edgeId);
    if (!edge) return false;

    const sourceId = end === 'source' ? newNodeId : edge.source;
    const targetId = end === 'target' ? newNodeId : edge.target;

    if (sourceId === targetId) return false;

    const src = this.getNode(sourceId);
    const tgt = this.getNode(targetId);
    if (!src || !tgt) return false;

    if (!isValidConnection(src.type, tgt.type)) return false;

    this.edges = this.edges.map((e) => {
      if (e.id !== edgeId) return e;
      return {
        ...e,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        source: sourceId,
        target: targetId,
      };
    });
    this.selectEdge(edgeId);
    return true;
  }

  getEdge(id: string | null): CanvasEdge | null {
    if (!id) return null;
    return this.edges.find((e) => e.id === id) ?? null;
  }

  getNode(id: string | null): CanvasNode | null {
    if (!id) return null;
    return this.nodes.find((node) => node.id === id) ?? null;
  }

  removeEdge(id: string) {
    this.edges = this.edges.filter((e) => e.id !== id);
    if (this.selectedEdgeId === id) this.selectedEdgeId = null;
  }

  clear() {
    this.nodes = [];
    this.edges = [];
    this.selectedNodeId = null;
    this.selectedEdgeId = null;

    Object.keys(typeCounters).forEach((key) => {
      typeCounters[key as CanvasNodeType] = 0;
    });
  }
}

export const canvasStore = new CanvasStore();