import { knowledgeItems } from '@/content/knowledge/items';
import type { KnowledgeItem, KnowledgeMetric } from '@/content/knowledge/types';
import { createSeededRandom, shuffleWithSeed } from '@/utils/seeded-random';

const MAX_ATTEMPTS = 48;

function clampDifficulty(difficulty: number): 1 | 2 | 3 {
  if (difficulty <= 1) return 1;
  if (difficulty >= 3) return 3;
  return 2;
}

function relativeGap(a: KnowledgeItem, b: KnowledgeItem): number {
  const scale = Math.max(Math.abs(a.value), Math.abs(b.value), 1);
  return Math.abs(a.value - b.value) / scale;
}

function gapBand(difficulty: 1 | 2 | 3): { min: number; max: number } {
  if (difficulty === 1) return { min: 0.12, max: Number.POSITIVE_INFINITY };
  if (difficulty === 2) return { min: 0.04, max: 0.25 };
  return { min: 0, max: 0.08 };
}

function metricsWithEnoughItems(
  pool: KnowledgeItem[],
  count: number,
  excludeIds: Set<string>,
): KnowledgeMetric[] {
  const counts = new Map<KnowledgeMetric, number>();
  for (const item of pool) {
    if (excludeIds.has(item.id)) continue;
    counts.set(item.metric, (counts.get(item.metric) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n >= count).map(([m]) => m);
}

export function pickDistinctItems(
  pool: KnowledgeItem[],
  count: number,
  seed: number,
  excludeIds: string[] = [],
): KnowledgeItem[] | null {
  const excluded = new Set(excludeIds);
  const available = pool.filter((item) => !excluded.has(item.id));
  if (available.length < count) return null;

  const shuffled = shuffleWithSeed(available, seed);
  const picked: KnowledgeItem[] = [];
  const usedValues = new Set<number>();

  for (const item of shuffled) {
    if (usedValues.has(item.value)) continue;
    picked.push(item);
    usedValues.add(item.value);
    if (picked.length === count) return picked;
  }

  return null;
}

export function filterByGapBand(
  candidates: KnowledgeItem[],
  difficulty: 1 | 2 | 3,
): boolean {
  if (candidates.length < 2) return false;
  const sorted = [...candidates].sort((a, b) => a.value - b.value);
  const band = gapBand(difficulty);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    gaps.push(relativeGap(sorted[i - 1]!, sorted[i]!));
  }
  const minGap = Math.min(...gaps);
  const span = relativeGap(sorted[0]!, sorted[sorted.length - 1]!);

  if (difficulty === 1) return span >= band.min && minGap > 0;
  if (difficulty === 2) return minGap >= band.min && span <= band.max * 2;
  return span <= band.max || minGap <= band.max;
}

export function selectKnowledgeCombo(options: {
  count: number;
  seed: number;
  difficulty: number;
  excludeIds?: string[];
  preferredMetrics?: KnowledgeMetric[];
}): KnowledgeItem[] | null {
  const difficulty = clampDifficulty(options.difficulty);
  const excludeIds = options.excludeIds ?? [];
  const random = createSeededRandom(options.seed);

  const metrics =
    options.preferredMetrics && options.preferredMetrics.length > 0
      ? options.preferredMetrics
      : metricsWithEnoughItems(knowledgeItems, options.count, new Set(excludeIds));

  if (metrics.length === 0) {
    return pickDistinctItems(knowledgeItems, options.count, options.seed, excludeIds);
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const metric = metrics[Math.floor(random() * metrics.length)]!;
    const pool = knowledgeItems.filter((item) => item.metric === metric);
    const picked = pickDistinctItems(pool, options.count, options.seed + attempt * 17, excludeIds);
    if (!picked) continue;
    if (!filterByGapBand(picked, difficulty) && attempt < MAX_ATTEMPTS - 8) continue;
    return picked;
  }

  return pickDistinctItems(knowledgeItems, options.count, options.seed + 991, excludeIds);
}

export function ensureShuffledNotSorted(
  items: KnowledgeItem[],
  seed: number,
): KnowledgeItem[] {
  let shuffled = shuffleWithSeed(items, seed);
  const sortedIds = [...items]
    .sort((a, b) => a.value - b.value)
    .map((item) => item.id)
    .join('|');

  let guard = 0;
  while (shuffled.map((item) => item.id).join('|') === sortedIds && guard < 8) {
    shuffled = shuffleWithSeed(items, seed + 31 + guard);
    // Deterministic rotate if shuffle still matches sorted order.
    if (shuffled.map((item) => item.id).join('|') === sortedIds) {
      shuffled = [...shuffled.slice(1), shuffled[0]!];
    }
    guard += 1;
  }

  return shuffled;
}
