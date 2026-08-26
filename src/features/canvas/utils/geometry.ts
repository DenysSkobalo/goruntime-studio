export interface Point {
  x: number;
  y: number;
}

export interface NodeLike {
  position: Point;
}

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
