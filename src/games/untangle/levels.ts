import type { Point } from '@/games/untangle/geometry';
import { createSeededRandom } from '@/utils/seeded-random';

export interface UntangleTemplate {
  /** Edges as node index pairs. Graph is planar-embeddable. */
  edges: Array<[number, number]>;
  /** Ideal planar layout in 0..1 normalized coords. */
  planar: Point[];
}

/** Solvable planar templates — scrambled at runtime. */
const TEMPLATES: UntangleTemplate[] = [
  {
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 2],
    ],
    planar: [
      { x: 0.22, y: 0.28 },
      { x: 0.78, y: 0.28 },
      { x: 0.78, y: 0.72 },
      { x: 0.22, y: 0.72 },
    ],
  },
  {
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [0, 2],
      [1, 3],
    ],
    planar: [
      { x: 0.5, y: 0.18 },
      { x: 0.82, y: 0.42 },
      { x: 0.7, y: 0.8 },
      { x: 0.3, y: 0.8 },
      { x: 0.18, y: 0.42 },
    ],
  },
  {
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [0, 2],
      [1, 4],
      [2, 5],
    ],
    planar: [
      { x: 0.5, y: 0.14 },
      { x: 0.84, y: 0.34 },
      { x: 0.84, y: 0.68 },
      { x: 0.5, y: 0.86 },
      { x: 0.16, y: 0.68 },
      { x: 0.16, y: 0.34 },
    ],
  },
  {
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [1, 3],
      [2, 3],
    ],
    planar: [
      { x: 0.28, y: 0.3 },
      { x: 0.72, y: 0.3 },
      { x: 0.5, y: 0.7 },
      { x: 0.5, y: 0.48 },
    ],
  },
  {
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ],
    planar: [
      { x: 0.22, y: 0.24 },
      { x: 0.78, y: 0.24 },
      { x: 0.78, y: 0.76 },
      { x: 0.22, y: 0.76 },
      { x: 0.5, y: 0.5 },
    ],
  },
];

function scrambleForCrossings(points: Point[], seed: number): Point[] {
  const random = createSeededRandom(seed);
  const nodes = points.map((p) => ({ ...p }));
  // Swap non-adjacent nodes a few times to create edge crossings while keeping solvability
  // (same planar embedding exists — player must untangle back).
  const swaps = 2 + Math.floor(random() * 3);
  for (let s = 0; s < swaps; s += 1) {
    const i = Math.floor(random() * nodes.length);
    let j = Math.floor(random() * nodes.length);
    while (j === i) j = Math.floor(random() * nodes.length);
    const tmp = nodes[i]!;
    nodes[i] = nodes[j]!;
    nodes[j] = tmp;
  }
  return nodes.map((p) => ({
    x: Math.min(0.9, Math.max(0.1, p.x + (random() - 0.5) * 0.04)),
    y: Math.min(0.9, Math.max(0.1, p.y + (random() - 0.5) * 0.04)),
  }));
}

export function buildUntangleLevel(
  seed: number,
  difficulty: number,
): { nodes: Point[]; edges: Array<[number, number]> } {
  const random = createSeededRandom(seed);
  const nodeTarget = difficulty >= 3 ? 6 : difficulty >= 2 ? 5 : 4;
  const candidates = TEMPLATES.filter((t) => t.planar.length === nodeTarget);
  const pool =
    candidates.length > 0 ? candidates : TEMPLATES.filter((t) => t.planar.length <= nodeTarget);
  const template = pool[Math.floor(random() * pool.length)] ?? TEMPLATES[0]!;

  return {
    nodes: scrambleForCrossings(template.planar, seed + 17),
    edges: template.edges.map(([a, b]) => [a, b] as [number, number]),
  };
}
