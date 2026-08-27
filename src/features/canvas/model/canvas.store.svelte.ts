/**
 * @file src/features/canvas/model/canvas.store.svelte.ts
 * @module features/canvas/model/canvas.store
 *
 * @architecture Reactive Canvas Workspace State Store (Svelte 5 Runes)
 * @description Centralized state engine managing interactive canvas nodes, edges, validation rules,
 * tool selections, element positions, and fast runtime lookup indices.
 *
 * @remarks
 * **Go Concurrency Structural Validation Rules:**
 * Direct Goroutine-to-Goroutine (`g -> g`) or Channel-to-Channel (`hchan -> hchan`) connections are prohibited.
 * In Go runtime semantics, Goroutines communicate strictly via synchronization channels or sync primitives (`hchan`, `sync.Mutex`).
 *
 * @see {@link validateConnection} Evaluates connection validity according to Go runtime primitives topology.
 */

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

/** Active interactive canvas tool options. */
export type CanvasTool = 'pointer' | 'connect' | CanvasNodeType;

/** Connection validation result contract. */
export interface ConnectionCheck {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether a proposed edge connection between two nodes satisfies Go runtime structural constraints.
 *
 * ANCHOR: VALIDATE_CONNECTION
 *
 * @param nodes - Current active node array.
 * @param edges - Current active edge array.
 * @param sourceId - Source node identifier.
 * @param targetId - Target node identifier.
 * @param ignoreEdgeId - Optional edge ID to ignore during duplicate connection checks (used when re-routing).
 * @returns {@link ConnectionCheck} detailing validity boolean state and failure explanation.
 */
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
 * Reactive state store managing the interactive graph workspace using Svelte 5 signal runes.
 * ANCHOR: CANVAS_STORE_CLASS
 */
class CanvasStore {
  /** Array of active vector edges connecting canvas nodes. */
  edges = $state<CanvasEdge[]>([]);
  /** Array of active nodes (Goroutines, Channels) placed on the canvas layout. */
  nodes = $state<CanvasNode[]>([]);
  /** Currently selected node identifier. */
  selectedNodeId = $state<string | null>(null);
  /** Currently selected edge identifier. */
  selectedEdgeId = $state<string | null>(null);
  /** Selected active creation or interaction tool. */
  activeTool = $state<CanvasTool>('pointer');
  /** Simulation playback flag. */
  isSimulating = $state(false);

  /**
   * Derived fast lookup Map indexing active Goroutines by their unique `goid`.
   * ANCHOR: GOROUTINES_BY_GOID_LOOKUP
   *
   * @complexity $\mathcal{O}(N)$ construction, $\mathcal{O}(1)$ lookup.
   */
  goroutinesByGoid = $derived.by(() => {
    const map = new Map<number, GoroutineNode>();
    for (const node of this.nodes) {
      if (node.type === 'goroutine') {
        map.set(node.goid, node);
      }
    }
    return map;
  });

  /**
   * Derived fast lookup Map indexing channels by both label (`ch1`) and simulated hex base address (`0xc000...`).
   * ANCHOR: CHANNELS_LOOKUP
   *
   * @complexity $\mathcal{O}(N)$ construction, $\mathcal{O}(1)$ lookup.
   */
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

  /**
   * Updates active workspace tool setting ('pointer', 'connect', 'goroutine', 'channel').
   */
  setTool(tool: CanvasTool) {
    this.activeTool = tool;
  }

  /**
   * Re-initializes workspace with default bootstrap initial nodes and edges.
   */
  initMainWorkspace() {
    this.nodes = structuredClone(DEFAULT_CANVAS_NODES);
    this.edges = structuredClone(DEFAULT_CANVAS_EDGES);
    this.selectNode('goroutine-1');
  }

  /**
   * Instantiates a new canvas node of specified type at given canvas position.
   *
   * @param type - Node primitive type ('goroutine' | 'channel').
   * @param position - Workspace X/Y coordinates.
   * @param label - Optional custom node label string.
   * @returns Newly created {@link CanvasNode}.
   */
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

/** Singleton canvas state store instance. */
export const canvasStore = new CanvasStore();
