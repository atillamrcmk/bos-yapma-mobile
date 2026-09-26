import { selectKnowledgeCombo } from '@/content/knowledge/select';
import type { KnowledgeItem } from '@/content/knowledge/types';
import { createSeededRandom } from '@/utils/seeded-random';

export interface WhichCameFirstChallenge {
  left: KnowledgeItem;
  right: KnowledgeItem;
  /** Id of the earlier item. */
  earlierId: string;
  yearDiff: number;
  fact: string;
  pairKey: string;
}

function pairKeyFor(a: string, b: string): string {
  return [a, b].sort().join('::');
}

/**
 * Builds a two-option "which came first" challenge from year-metric knowledge items.
 */
export function buildWhichCameFirstChallenge(
  seed: number,
  difficulty: number,
  excludeIds: string[] = [],
  excludePairKeys: string[] = [],
): WhichCameFirstChallenge | null {
  const excludedPairs = new Set(excludePairKeys);
  const random = createSeededRandom(seed);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const picked = selectKnowledgeCombo({
      count: 2,
      seed: seed + attempt * 13,
      difficulty,
      excludeIds,
      preferredMetrics: ['year'],
    });
    if (!picked || picked.length !== 2) continue;

    const [a, b] = picked;
    if (!a || !b || a.value === b.value) continue;

    const key = pairKeyFor(a.id, b.id);
    if (excludedPairs.has(key)) continue;

    const earlier = a.value < b.value ? a : b;
    const later = a.value < b.value ? b : a;
    const swap = random() < 0.5;
    const left = swap ? later : earlier;
    const right = swap ? earlier : later;

    return {
      left,
      right,
      earlierId: earlier.id,
      yearDiff: Math.abs(a.value - b.value),
      fact: earlier.fact,
      pairKey: key,
    };
  }

  return null;
}
