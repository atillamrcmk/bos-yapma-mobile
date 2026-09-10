export type GameId =
  | 'reaction'
  | 'odd-one-out'
  | 'estimate'
  | 'memory-grid'
  | 'quick-math'
  | 'which-came-first'
  | 'color-match'
  | 'sequence'
  | 'target-tap'
  | 'flash-count'
  | 'timing'
  | 'order-three';

export type GameCategory =
  'reflex' | 'memory' | 'knowledge' | 'logic' | 'math' | 'visual' | 'timing';

export interface GameResult {
  gameId: GameId;
  score: number;
  /** Challenge-level success used by session combo (seri). */
  isSuccess: boolean;
  /** @deprecated Prefer `isSuccess` for combo; kept for stats compatibility. */
  correct?: boolean;
  durationMs: number;
  startedAt: number;
  completedAt: number;
  metadata?: Record<string, unknown>;
}

export interface GameComponentProps {
  onComplete: (result: GameResult) => void;
  difficulty: number;
  seed: number;
  /** Optional session-scoped content exclusions for knowledge games. */
  excludeContentIds?: string[];
}
