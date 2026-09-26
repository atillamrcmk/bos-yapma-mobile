export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  a: Point;
  b: Point;
}

const EPS = 1e-9;

function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, p: Point): boolean {
  return (
    Math.min(a.x, b.x) - EPS <= p.x &&
    p.x <= Math.max(a.x, b.x) + EPS &&
    Math.min(a.y, b.y) - EPS <= p.y &&
    p.y <= Math.max(a.y, b.y) + EPS
  );
}

/** Proper or improper intersection of two segments. Shared endpoints do not count. */
export function segmentsIntersect(s1: Segment, s2: Segment): boolean {
  const { a: p1, b: q1 } = s1;
  const { a: p2, b: q2 } = s2;

  // Shared node: not an intersection for graph edges.
  if (
    (Math.abs(p1.x - p2.x) < EPS && Math.abs(p1.y - p2.y) < EPS) ||
    (Math.abs(p1.x - q2.x) < EPS && Math.abs(p1.y - q2.y) < EPS) ||
    (Math.abs(q1.x - p2.x) < EPS && Math.abs(q1.y - p2.y) < EPS) ||
    (Math.abs(q1.x - q2.x) < EPS && Math.abs(q1.y - q2.y) < EPS)
  ) {
    return false;
  }

  const o1 = orient(p1, q1, p2);
  const o2 = orient(p1, q1, q2);
  const o3 = orient(p2, q2, p1);
  const o4 = orient(p2, q2, q1);

  if (o1 * o2 < -EPS && o3 * o4 < -EPS) return true;

  // Collinear specials (rare with templates) — treat as non-crossing for gameplay.
  if (Math.abs(o1) < EPS && onSegment(p1, q1, p2)) return false;
  if (Math.abs(o2) < EPS && onSegment(p1, q1, q2)) return false;
  if (Math.abs(o3) < EPS && onSegment(p2, q2, p1)) return false;
  if (Math.abs(o4) < EPS && onSegment(p2, q2, q1)) return false;

  return false;
}

export function countIntersections(
  nodes: Point[],
  edges: Array<[number, number]>,
): number {
  const segs: Segment[] = edges.map(([i, j]) => ({
    a: nodes[i]!,
    b: nodes[j]!,
  }));

  let count = 0;
  for (let i = 0; i < segs.length; i += 1) {
    for (let j = i + 1; j < segs.length; j += 1) {
      const e1 = edges[i]!;
      const e2 = edges[j]!;
      // Edges sharing a node never count.
      if (e1[0] === e2[0] || e1[0] === e2[1] || e1[1] === e2[0] || e1[1] === e2[1]) {
        continue;
      }
      if (segmentsIntersect(segs[i]!, segs[j]!)) count += 1;
    }
  }
  return count;
}
