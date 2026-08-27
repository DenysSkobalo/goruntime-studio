/**
 * @file src/features/canvas/utils/geometry.ts
 * @module features/canvas/utils/geometry
 *
 * @architecture Spatial Geometry & Node Anchor Utility
 * @description Provides 2D geometric vector spatial calculations, perimeter anchor selection,
 * and distance optimization algorithms for canvas node connections.
 */

/**
 * 2D spatial coordinate point.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Generic node geometry descriptor.
 */
export interface NodeLike {
  position: Point;
}

/**
 * Bounding box perimeter side anchor location.
 */
export type AnchorSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Calculated perimeter connection anchor metadata.
 */
export interface Anchor {
  x: number;
  y: number;
  side: AnchorSide;
}

/**
 * Computes the optimal perimeter anchor point on a target node bounding box closest to a target destination point.
 *
 * ANCHOR: NODE_ANCHOR_CALCULATOR
 *
 * @remarks
 * **Why Euclidean distance minimization is used:**
 * Evaluates Euclidean distances ($d = \sqrt{(x_a - x_t)^2 + (y_a - y_t)^2}$) across all 4 side midpoints
 * (top, bottom, left, right) of a node box ($145\,\text{px} \times 74\,\text{px}$) to select the shortest connector path,
 * preventing connector lines from clipping through node interior boundaries.
 *
 * @param node - Source node object containing layout position.
 * @param targetPt - Target point coordinates towards which connector routes.
 * @returns Nearest perimeter {@link Anchor} metadata.
 */
export function getNodeAnchor(node: NodeLike, targetPt: Point): Anchor {
  const w = 145;
  const h = 74;
  const x = node.position.x;
  const y = node.position.y;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const anchors: Anchor[] = [
    { x: cx, y, side: 'top' },
    { x: cx, y: y + h, side: 'bottom' },
    { x, y: cy, side: 'left' },
    { x: x + w, y: cy, side: 'right' },
  ];

  let best: Anchor = anchors[0]!;
  let minDist = Infinity;

  for (const a of anchors) {
    const dist = Math.hypot(a.x - targetPt.x, a.y - targetPt.y);
    if (dist < minDist) {
      minDist = dist;
      best = a;
    }
  }

  return best;
}
