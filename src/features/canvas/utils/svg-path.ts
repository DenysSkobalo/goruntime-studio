/**
 * @file src/features/canvas/utils/svg-path.ts
 * @module features/canvas/utils/svg-path
 *
 * @architecture Parametric Cubic Bezier Vector Path Engine
 * @description Mathematical functions computing Cubic Bezier control points, SVG path strings,
 * and parametric curve midpoints ($t = 0.5$) for smooth canvas connectors.
 *
 * @remarks
 * **Parametric Cubic Bezier Formula:**
 * A Cubic Bezier curve is defined by four points ($P_0, P_1, P_2, P_3$):
 * $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]$$
 * For midpoint positioning ($t = 0.5$), this simplifies to the linear combination:
 * $$B(0.5) = 0.125 P_0 + 0.375 P_1 + 0.375 P_2 + 0.125 P_3$$
 */

import type { AnchorSide, Point } from './geometry';

/**
 * Control parameters defining a 2D Cubic Bezier curve.
 */
export interface BezierParams {
  sx: number;
  sy: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  tx: number;
  ty: number;
}

/**
 * Calculates smooth Cubic Bezier control points based on anchor side orientations and euclidean distance.
 *
 * ANCHOR: BEZIER_PARAM_GENERATOR
 *
 * @param coords - Source and target anchor coordinates and side orientations.
 * @returns Computed {@link BezierParams} object containing curve endpoints and control handles.
 */
export function getBezierParams(coords: {
  sx: number;
  sy: number;
  sideS: AnchorSide;
  tx: number;
  ty: number;
  sideT: AnchorSide;
}): BezierParams {
  const { sx, sy, sideS, tx, ty, sideT } = coords;
  const dist = Math.hypot(tx - sx, ty - sy);
  const offset = Math.max(dist * 0.4, 40);

  let cx1 = sx;
  let cy1 = sy;
  if (sideS === 'left') cx1 -= offset;
  else if (sideS === 'right') cx1 += offset;
  else if (sideS === 'top') cy1 -= offset;
  else if (sideS === 'bottom') cy1 += offset;

  let cx2 = tx;
  let cy2 = ty;
  if (sideT === 'left') cx2 -= offset;
  else if (sideT === 'right') cx2 += offset;
  else if (sideT === 'top') cy2 -= offset;
  else if (sideT === 'bottom') cy2 += offset;

  return { sx, sy, cx1, cy1, cx2, cy2, tx, ty };
}

/**
 * Constructs an SVG path attribute string (`d="M sx sy C cx1 cy1, cx2 cy2, tx ty"`).
 *
 * ANCHOR: BEZIER_PATH_BUILDER
 *
 * @param params - Cubic Bezier curve control parameters.
 * @returns Formatted SVG path string.
 */
export function computeBezierPath(params: BezierParams): string {
  const { sx, sy, cx1, cy1, cx2, cy2, tx, ty } = params;
  return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
}

/**
 * Evaluates the exact parametric midpoint ($t = 0.5$) of a Cubic Bezier curve.
 *
 * ANCHOR: BEZIER_MIDPOINT_EVALUATOR
 *
 * @remarks
 * Uses Bernstein polynomial evaluation at $t = 0.5$ to position overlay delete buttons directly on the path center point.
 *
 * @param params - Cubic Bezier parameters.
 * @returns 2D {@link Point} coordinate representing the curve midpoint.
 */
export function computeBezierMidpoint(params: BezierParams): Point {
  const { sx, sy, cx1, cy1, cx2, cy2, tx, ty } = params;
  return {
    x: 0.125 * sx + 0.375 * cx1 + 0.375 * cx2 + 0.125 * tx,
    y: 0.125 * sy + 0.375 * cy1 + 0.375 * cy2 + 0.125 * ty,
  };
}
