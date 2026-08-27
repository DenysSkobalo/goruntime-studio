/**
 * @file src/shared/types/nodes.ts
 * @module shared/types/nodes
 *
 * @architecture Canvas Nodes & Primitive Model Contracts
 * @description Core TypeScript type definitions, interfaces, and type guards modeling 2D canvas nodes,
 * Go runtime primitive descriptors (`GoroutineNode`, `ChannelNode`), and connector edges (`sudog_link`).
 *
 * @remarks
 * **Concurrency Primitive Type System:**
 * Maps 2D spatial graph nodes to Go runtime primitives:
 * - `GoroutineNode` represents user-space execution threads (`runtime.g`).
 * - `ChannelNode` represents communication ring buffers (`runtime.hchan`).
 * - `CanvasEdge` represents wait queue links (`runtime.sudog`).
 *
 * @todo Issue #CANVAS-101: Expand CanvasNodeType for core synchronization primitives.
 * Target primitives to be implemented in future tasks:
 * - 'mutex' (sync.Mutex)
 * - 'waitgroup' (sync.WaitGroup)
 * - 'context' (context.Context)
 * - 'select' (selectgo)
 * - 'atomic'
 */

/** Primitive type identifier union. ANCHOR: CANVAS_NODE_TYPE */
export type CanvasNodeType = 'goroutine' | 'channel';

/** Go runtime Goroutine execution status union matching `runtime2.go` state definitions. ANCHOR: GOROUTINE_STATUS */
export type GoroutineStatus =
  '_Gidle' | '_Grunnable' | '_Grunning' | '_Gsyscall' | '_Gwaiting' | '_Gdead';

/** Supported Channel element type string union. ANCHOR: CHANNEL_ELEM_TYPE */
export type ChannelElemType = 'string' | 'int64' | 'bool' | 'struct{}';

/**
 * Base canvas node spatial positioning and identity interface.
 * ANCHOR: BASE_CANVAS_NODE
 */
export interface BaseCanvasNode {
  /** Unique node identifier string. */
  id: string;
  /** Primitive category classification. */
  type: CanvasNodeType;
  /** 2D cartesian layout position coordinates (pixels). */
  position: { x: number; y: number };
  /** Human-readable display variable name. */
  label: string;
}

/**
 * Goroutine primitive node instance interface (`runtime.g`).
 * ANCHOR: GOROUTINE_NODE_INTERFACE
 */
export interface GoroutineNode extends BaseCanvasNode {
  type: 'goroutine';
  /** Unique numeric Goroutine identifier (`goid`). */
  goid: number;
  /** Current runtime execution state. */
  status: GoroutineStatus;
}

/**
 * Channel primitive node instance interface (`runtime.hchan`).
 * ANCHOR: CHANNEL_NODE_INTERFACE
 */
export interface ChannelNode extends BaseCanvasNode {
  type: 'channel';
  /** Buffer capacity limit (`dataqsiz`). */
  capacity: number;
  /** Encapsulated element data type. */
  elemType: ChannelElemType;
  /** Buffered value payloads array (`buf`). */
  values: string[];
  /** Channel close state status. */
  closed: boolean;
}

/** Discriminated union of all supported canvas node types. ANCHOR: CANVAS_NODE_UNION */
export type CanvasNode = GoroutineNode | ChannelNode;

/** Edge connection relationship classification type. ANCHOR: EDGE_KIND_TYPE */
export type EdgeKind = 'sudog_link';

/**
 * Spatial connection edge representing a `sudog` wait queue link.
 * ANCHOR: CANVAS_EDGE_INTERFACE
 */
export interface CanvasEdge {
  /** Edge instance unique identifier. */
  id: string;
  /** Source node ID pointer. */
  sourceNodeId: string;
  /** Target node ID pointer. */
  targetNodeId: string;
  /** Source identifier compatibility handle. */
  source: string;
  /** Target identifier compatibility handle. */
  target: string;
  /** Relationship kind specification. */
  kind: EdgeKind;
}

/**
 * Type guard verifying if target node is a Goroutine (`runtime.g`).
 *
 * ANCHOR: IS_GOROUTINE_NODE_GUARD
 *
 * @param node - Candidate node or `null`.
 * @returns Boolean `true` if node type is `'goroutine'`.
 */
export function isGoroutineNode(node: CanvasNode | null): node is GoroutineNode {
  return node?.type === 'goroutine';
}

/**
 * Type guard verifying if target node is a Channel (`runtime.hchan`).
 *
 * ANCHOR: IS_CHANNEL_NODE_GUARD
 *
 * @param node - Candidate node or `null`.
 * @returns Boolean `true` if node type is `'channel'`.
 */
export function isChannelNode(node: CanvasNode | null): node is ChannelNode {
  return node?.type === 'channel';
}
