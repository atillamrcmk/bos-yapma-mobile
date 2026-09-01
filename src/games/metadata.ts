import type { GameCategory, GameId } from '@/types/game';

export interface GameMetadata {
  id: GameId;
  category: GameCategory;
  estimatedDurationMs: number;
  weight: number;
  enabled: boolean;
}

export const gameMetadata: GameMetadata[] = [
  { id: 'reaction', category: 'reflex', estimatedDurationMs: 10_000, weight: 1, enabled: true },
  { id: 'odd-one-out', category: 'logic', estimatedDurationMs: 15_000, weight: 1, enabled: true },
  { id: 'estimate', category: 'knowledge', estimatedDurationMs: 25_000, weight: 1, enabled: true },
  { id: 'memory-grid', category: 'memory', estimatedDurationMs: 25_000, weight: 1, enabled: true },
  { id: 'quick-math', category: 'math', estimatedDurationMs: 12_000, weight: 1, enabled: true },
  {
    id: 'which-came-first',
    category: 'knowledge',
    estimatedDurationMs: 15_000,
    weight: 1,
    enabled: true,
  },
  { id: 'color-match', category: 'visual', estimatedDurationMs: 20_000, weight: 1, enabled: true },
  { id: 'sequence', category: 'logic', estimatedDurationMs: 12_000, weight: 1, enabled: true },
  { id: 'target-tap', category: 'reflex', estimatedDurationMs: 18_000, weight: 1, enabled: true },
  { id: 'flash-count', category: 'memory', estimatedDurationMs: 20_000, weight: 1, enabled: true },
  { id: 'timing', category: 'timing', estimatedDurationMs: 15_000, weight: 1, enabled: true },
];

export function getEnabledMetadata(): GameMetadata[] {
  return gameMetadata.filter((g) => g.enabled);
}
