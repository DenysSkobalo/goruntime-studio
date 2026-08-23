import type { CanvasEdge, CanvasNode, CanvasNodeType, ChannelElemType } from '$shared/types/nodes';

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
  ignoreEdgeId?: string
): ConnectionCheck {
  if (sourceId === targetId) {
    return { valid: false, reason: 'Self connection impossible' };
  }

  const src = nodes.find((n) => n.id === sourceId);
  const tgt = nodes.find((n) => n.id === targetId);
  if (!src || !tgt) return { valid: false, reason: 'Node not found' };

  // Правило 1: Дозволено лише Goroutine <-> Channel
  const isCorrectPair =
    (src.type === 'goroutine' && tgt.type === 'channel') ||
    (src.type === 'channel' && tgt.type === 'goroutine');

  if (!isCorrectPair) {
    if (src.type === tgt.type) {
      return {
        valid: false,
        reason: src.type === 'goroutine'
          ? 'Direct Goroutine-to-Goroutine connection invalid in runtime'
          : 'Direct Channel-to-Channel connection invalid in runtime'
      };
    }
    return { valid: false, reason: 'Invalid connection type' };
  }

  // Правило 2: Максимум 1 конектор між конкретною парою нод A та B
  const alreadyConnected = edges.some(
    (e) =>
      e.id !== ignoreEdgeId &&
      ((e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId))
  );

  if (alreadyConnected) {
    return { valid: false, reason: 'Connector already exists between these nodes' };
  }

  return { valid: true };
}

class CanvasStore {
  edges = $state<CanvasEdge[]>([]);
  nodes = $state<CanvasNode[]>([]);
  selectedNodeId = $state<string | null>(null);
  selectedEdgeId = $state<string | null>(null);
  activeTool = $state<CanvasTool>('pointer');
  isSimulating = $state(false);

  constructor() {
    this.initMainWorkspace();
  }

  setTool(tool: CanvasTool) {
    this.activeTool = tool;
  }

  initMainWorkspace() {
    this.nodes = [];
    this.edges = [];

    const gMain: CanvasNode = {
      id: 'goroutine-1',
      type: 'goroutine',
      position: { x: 120, y: 180 },
      label: 'main.main',
      goid: 1,
      status: '_Grunning'
    };

    const mainChan: CanvasNode = {
      id: 'channel-1',
      type: 'channel',
      position: { x: 420, y: 180 },
      label: 'ch1',
      capacity: 2,
      elemType: 'string',
      values: [],
      closed: false
    };

    this.nodes = [gMain, mainChan];
    this.addEdge('goroutine-1', 'channel-1', 'sudog_link');
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
      node = { ...base, type: 'channel', capacity: 2, elemType: 'string', values: [], closed: false };
    }

    this.nodes = [...this.nodes, node];
    this.selectNode(id);
    return node;
  }

  setNodeLabel(id: string, label: string) {
    this.nodes = this.nodes.map((n) => (n.id === id ? { ...n, label } : n));
  }

  setChannelCapacity(id: string, capacity: number) {
    this.nodes = this.nodes.map((n) => {
      if (n.id === id && n.type === 'channel') {
        return { ...n, capacity: Math.max(0, capacity) };
      }
      return n;
    });
  }

  setChannelElemType(id: string, elemType: ChannelElemType) {
    this.nodes = this.nodes.map((n) => {
      if (n.id === id && n.type === 'channel') {
        return { ...n, elemType };
      }
      return n;
    });
  }

  removeNode(id: string) {
    this.nodes = this.nodes.filter((n) => n.id !== id);
    this.edges = this.edges.filter((e) => e.source !== id && e.target !== id);
    if (this.selectedNodeId === id) this.selectedNodeId = null;
  }

  updatePosition(id: string, pos: { x: number; y: number }) {
	  const node = this.nodes.find((n) => n.id === id);
	  if (node) {
		// Точкова мутація властивостей у глибокому $state проксі Svelte 5
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
    const edge: CanvasEdge = { id: edgeId, sourceNodeId: sourceId, targetNodeId: targetId, source: sourceId, target: targetId, kind };

    this.edges = [...this.edges, edge];
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

    this.edges = this.edges.map((e) => {
      if (e.id === edgeId) {
        return { ...e, sourceNodeId: source, targetNodeId: target, source, target };
      }
      return e;
    });
    return true;
  }

  getNode(id: string | null): CanvasNode | null {
    return id ? this.nodes.find((node) => node.id === id) ?? null : null;
  }

  getEdge(id: string | null): CanvasEdge | null {
    return id ? this.edges.find((e) => e.id === id) ?? null : null;
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
  }
}

export const canvasStore = new CanvasStore();
