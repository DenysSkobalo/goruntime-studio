import type { AnchorSide, Point } from './geometry';

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

export function computeBezierPath(params: BezierParams): string {
  const { sx, sy, cx1, cy1, cx2, cy2, tx, ty } = params;
  return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
}

export function computeBezierMidpoint(params: BezierParams): Point {
  const { sx, sy, cx1, cy1, cx2, cy2, tx, ty } = params;
  return {
    x: 0.125 * sx + 0.375 * cx1 + 0.375 * cx2 + 0.125 * tx,
    y: 0.125 * sy + 0.375 * cy1 + 0.375 * cy2 + 0.125 * ty,
  };
}
