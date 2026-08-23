export interface Point { x: number; y: number; }
export interface NodeLike { position: Point; }
export type AnchorSide = 'top' | 'bottom' | 'left' | 'right';

export interface Anchor {
  x: number;
  y: number;
  side: AnchorSide;
}

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

  let best = anchors[0];
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

export function getBezierParams(coords: { sx: number; sy: number; sideS: AnchorSide; tx: number; ty: number; sideT: AnchorSide }) {
  const { sx, sy, sideS, tx, ty, sideT } = coords;
  const dist = Math.hypot(tx - sx, ty - sy);
  const offset = Math.max(dist * 0.4, 40);

  let cx1 = sx; let cy1 = sy;
  if (sideS === 'left') cx1 -= offset;
  else if (sideS === 'right') cx1 += offset;
  else if (sideS === 'top') cy1 -= offset;
  else if (sideS === 'bottom') cy1 += offset;

  let cx2 = tx; let cy2 = ty;
  if (sideT === 'left') cx2 -= offset;
  else if (sideT === 'right') cx2 += offset;
  else if (sideT === 'top') cy2 -= offset;
  else if (sideT === 'bottom') cy2 += offset;

  return { sx, sy, cx1, cy1, cx2, cy2, tx, ty };
}

export function computeBezierPath(params: ReturnType<typeof getBezierParams>): string {
  const { sx, sy, cx1, cy1, cx2, cy2, tx, ty } = params;
  return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
}

export function computeBezierMidpoint(params: ReturnType<typeof getBezierParams>): Point {
  const { sx, sy, cx1, cy1, cx2, cy2, tx, ty } = params;
  return {
    x: 0.125 * sx + 0.375 * cx1 + 0.375 * cx2 + 0.125 * tx,
    y: 0.125 * sy + 0.375 * cy1 + 0.375 * cy2 + 0.125 * ty,
  };
}
