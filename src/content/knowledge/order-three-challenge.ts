import {
  ensureShuffledNotSorted,
  selectKnowledgeCombo,
} from '@/content/knowledge/select';
import { promptForMetric, type KnowledgeItem, type OrderPrompt } from '@/content/knowledge/types';

export interface OrderThreeChallenge {
  prompt: OrderPrompt;
  metric: KnowledgeItem['metric'];
  /** Display order (shuffled). */
  cards: KnowledgeItem[];
  /** Correct ascending order by value. */
  correctOrderIds: string[];
  fact: string;
  trioKey: string;
}

export interface OrderThreeEvaluation {
  isSuccess: boolean;
  score: number;
  correctOrderIds: string[];
  selectedOrderIds: string[];
}

function trioKeyFor(ids: string[]): string {
  return [...ids].sort().join('::');
}

export function buildOrderThreeChallenge(
  seed: number,
  difficulty: number,
  excludeIds: string[] = [],
  excludeTrioKeys: string[] = [],
): OrderThreeChallenge | null {
  const excludedTrios = new Set(excludeTrioKeys);

  for (let attempt = 0; attempt < 48; attempt += 1) {
    const picked = selectKnowledgeCombo({
      count: 3,
      seed: seed + attempt * 19,
      difficulty,
      excludeIds,
    });
    if (!picked || picked.length !== 3) continue;

    const values = new Set(picked.map((item) => item.value));
    if (values.size !== 3) continue;

    const key = trioKeyFor(picked.map((item) => item.id));
    if (excludedTrios.has(key)) continue;

    const correct = [...picked].sort((a, b) => a.value - b.value);
    const cards = ensureShuffledNotSorted(picked, seed + attempt * 7);
    const metric = picked[0]!.metric;

    return {
      prompt: promptForMetric(metric),
      metric,
      cards,
      correctOrderIds: correct.map((item) => item.id),
      fact: correct[0]?.fact ?? correct[1]?.fact ?? '',
      trioKey: key,
    };
  }

  return null;
}

/** Relative pairwise order score: each of 3 pairs contributes ~33 points when ordered correctly. */
export function evaluateOrderThree(
  selectedOrderIds: string[],
  correctOrderIds: string[],
): OrderThreeEvaluation {
  const isSuccess =
    selectedOrderIds.length === correctOrderIds.length &&
    selectedOrderIds.every((id, index) => id === correctOrderIds[index]);

  if (isSuccess) {
    return {
      isSuccess: true,
      score: 100,
      correctOrderIds,
      selectedOrderIds,
    };
  }

  let pairScore = 0;
  const pairs: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  const selectedIndex = new Map(selectedOrderIds.map((id, index) => [id, index]));

  for (const [i, j] of pairs) {
    const earlier = correctOrderIds[i]!;
    const later = correctOrderIds[j]!;
    const si = selectedIndex.get(earlier);
    const sj = selectedIndex.get(later);
    if (si != null && sj != null && si < sj) pairScore += 1;
  }

  return {
    isSuccess: false,
    score: Math.round((pairScore / 3) * 70),
    correctOrderIds,
    selectedOrderIds,
  };
}
