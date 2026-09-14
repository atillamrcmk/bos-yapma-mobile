export interface Point {
  x: number;
  y: number;
}

export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

export function calculateMeanRadius(points: Point[], center: Point): number {
  if (points.length === 0) return 0;
  let sum = 0;
  for (const p of points) {
    sum += Math.hypot(p.x - center.x, p.y - center.y);
  }
  return sum / points.length;
}

/** Coefficient of variation of radii (0 = perfect circle). */
export function calculateRadialDeviation(points: Point[], center: Point, meanR: number): number {
  if (points.length === 0 || meanR <= 1e-6) return 1;
  let varSum = 0;
  for (const p of points) {
    const r = Math.hypot(p.x - center.x, p.y - center.y);
    const d = r - meanR;
    varSum += d * d;
  }
  return Math.sqrt(varSum / points.length) / meanR;
}

export function calculateClosureError(points: Point[], meanR: number): number {
  if (points.length < 2 || meanR <= 1e-6) return 1;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return Math.hypot(first.x - last.x, first.y - last.y) / meanR;
}

/** Fraction of angle bins covered around the center (0..1). */
export function calculateAngularCoverage(points: Point[], center: Point, bins = 24): number {
  if (points.length < 3) return 0;
  const hit = new Array<boolean>(bins).fill(false);
  for (const p of points) {
    const a = Math.atan2(p.y - center.y, p.x - center.x);
    const norm = (a + Math.PI) / (2 * Math.PI);
    const idx = Math.min(bins - 1, Math.floor(norm * bins));
    hit[idx] = true;
  }
  return hit.filter(Boolean).length / bins;
}

export function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}

/**
 * Deterministic circle score 0–100.
 * Penalizes radial variance, poor closure, incomplete angular coverage, short paths.
 */
export function calculateCircleScore(points: Point[]): {
  score: number;
  center: Point;
  meanRadius: number;
  radialDeviation: number;
  closureError: number;
  angularCoverage: number;
} {
  if (points.length < 8) {
    return {
      score: 0,
      center: { x: 0, y: 0 },
      meanRadius: 0,
      radialDeviation: 1,
      closureError: 1,
      angularCoverage: 0,
    };
  }

  const center = calculateCentroid(points);
  const meanRadius = calculateMeanRadius(points, center);
  const radialDeviation = calculateRadialDeviation(points, center, meanRadius);
  const closureError = calculateClosureError(points, meanRadius);
  const angularCoverage = calculateAngularCoverage(points, center);
  const len = pathLength(points);
  const expected = 2 * Math.PI * meanRadius;

  let score = 100;
  score -= Math.min(55, radialDeviation * 120);
  score -= Math.min(25, closureError * 40);
  score -= Math.min(30, (1 - angularCoverage) * 45);

  if (expected > 1 && len < expected * 0.55) {
    score -= 40;
  }
  if (angularCoverage < 0.55) {
    score = Math.min(score, 35);
  }
  if (closureError > 0.55) {
    score = Math.min(score, 45);
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score: Math.round(score * 10) / 10,
    center,
    meanRadius,
    radialDeviation,
    closureError,
    angularCoverage,
  };
}
