import type { GameId, GameResult } from './game';

export type SessionDuration = 1 | 3 | 5;
export type SessionMood = 'mixed';

export const SESSION_DURATION_MS: Record<SessionDuration, number> = {
  1: 60_000,
  3: 180_000,
  5: 300_000,
};

export interface SessionConfig {
  durationMinutes: SessionDuration;
  targetDurationMs: number;
  mood: SessionMood;
}

export interface SessionChallenge {
  gameId: GameId;
  seed: number;
  difficulty: number;
}

export interface SessionSummary {
  config: SessionConfig;
  results: GameResult[];
  totalDurationMs: number;
  targetDurationMs: number;
  challengeCount: number;
  completedAt: string;
  highlightReactionMs: number | null;
  estimateAccuracy: number | null;
  memoryScore: string | null;
  newFactsCount: number;
}
