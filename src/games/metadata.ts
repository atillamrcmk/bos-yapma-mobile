import type { GameCategory, GameId, InteractionType } from '@/types/game';

export type { InteractionType };

export interface GameMetadata {
  id: GameId;
  title: string;
  category: GameCategory;
  interactionType: InteractionType;
  estimatedDurationMs: number;
  weight: number;
  enabled: boolean;
  /** When false, excluded from duration-based main session pool. Still playable in DEV. */
  enabledInMainMix: boolean;
  difficultyRange: [number, number];
  /** Legacy quiz layout flag — main mix should avoid these. */
  quizPattern?: boolean;
}

export const gameMetadata: GameMetadata[] = [
  {
    id: 'reaction',
    title: 'REFLEKS',
    category: 'ACTION',
    interactionType: 'tap',
    estimatedDurationMs: 10_000,
    weight: 1.2,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'target-tap',
    title: 'HEDEF',
    category: 'ACTION',
    interactionType: 'tap',
    estimatedDurationMs: 16_000,
    weight: 1.1,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'timing',
    title: 'ZAMANLA',
    category: 'TIMING',
    interactionType: 'timing',
    estimatedDurationMs: 14_000,
    weight: 1,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'hold-it',
    title: 'TUT',
    category: 'TIMING',
    interactionType: 'hold',
    estimatedDurationMs: 12_000,
    weight: 1,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'odd-one-out',
    title: 'FARKLI OLAN',
    category: 'PERCEPTION',
    interactionType: 'observe',
    estimatedDurationMs: 14_000,
    weight: 1,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'memory-grid',
    title: 'HAFIZA',
    category: 'MEMORY',
    interactionType: 'memory',
    estimatedDurationMs: 22_000,
    weight: 1,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'color-match',
    title: 'RENK',
    category: 'PERCEPTION',
    interactionType: 'tap',
    estimatedDurationMs: 16_000,
    weight: 0.9,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'untangle',
    title: 'DÜĞÜMÜ ÇÖZ',
    category: 'PUZZLE',
    interactionType: 'drag',
    estimatedDurationMs: 28_000,
    weight: 1.4,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'stop-the-line',
    title: 'DURDUR',
    category: 'ACTION',
    interactionType: 'timing',
    estimatedDurationMs: 16_000,
    weight: 1.3,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'fit-it',
    title: 'YERİNE OTURT',
    category: 'PUZZLE',
    interactionType: 'spatial',
    estimatedDurationMs: 20_000,
    weight: 1.3,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'spot-change',
    title: 'NE DEĞİŞTİ?',
    category: 'PERCEPTION',
    interactionType: 'observe',
    estimatedDurationMs: 18_000,
    weight: 1.2,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  {
    id: 'perfect-circle',
    title: 'DAİRE ÇİZ',
    category: 'PUZZLE',
    interactionType: 'draw',
    estimatedDurationMs: 18_000,
    weight: 1.3,
    enabled: true,
    enabledInMainMix: true,
    difficultyRange: [1, 3],
  },
  // --- Quiz / knowledge: kept for DEV, off main mix ---
  {
    id: 'estimate',
    title: 'TAHMİN',
    category: 'OTHER',
    interactionType: 'drag',
    estimatedDurationMs: 25_000,
    weight: 0.2,
    enabled: true,
    enabledInMainMix: false,
    difficultyRange: [1, 3],
  },
  {
    id: 'quick-math',
    title: 'HESAP',
    category: 'OTHER',
    interactionType: 'choice',
    estimatedDurationMs: 12_000,
    weight: 0.1,
    enabled: true,
    enabledInMainMix: false,
    difficultyRange: [1, 3],
    quizPattern: true,
  },
  {
    id: 'which-came-first',
    title: 'HANGİSİ ÖNCE',
    category: 'OTHER',
    interactionType: 'choice',
    estimatedDurationMs: 15_000,
    weight: 0.1,
    enabled: true,
    enabledInMainMix: false,
    difficultyRange: [1, 3],
  },
  {
    id: 'order-three',
    title: 'SIRALA',
    category: 'OTHER',
    interactionType: 'choice',
    estimatedDurationMs: 18_000,
    weight: 0.1,
    enabled: true,
    enabledInMainMix: false,
    difficultyRange: [1, 3],
  },
  {
    id: 'sequence',
    title: 'DİZİ',
    category: 'OTHER',
    interactionType: 'choice',
    estimatedDurationMs: 12_000,
    weight: 0.1,
    enabled: true,
    enabledInMainMix: false,
    difficultyRange: [1, 3],
    quizPattern: true,
  },
  {
    id: 'flash-count',
    title: 'SAY',
    category: 'MEMORY',
    interactionType: 'choice',
    estimatedDurationMs: 18_000,
    weight: 0.2,
    enabled: true,
    enabledInMainMix: false,
    difficultyRange: [1, 3],
    quizPattern: true,
  },
];

export function getEnabledMetadata(): GameMetadata[] {
  return gameMetadata.filter((g) => g.enabled);
}

export function getMainMixMetadata(): GameMetadata[] {
  return gameMetadata.filter((g) => g.enabled && g.enabledInMainMix);
}
