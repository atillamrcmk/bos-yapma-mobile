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
  | 'timing';

export type GameCategory =
  'reflex' | 'memory' | 'knowledge' | 'logic' | 'math' | 'visual' | 'timing';

export interface GameResult {
  gameId: GameId;
  score: number;
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
}
