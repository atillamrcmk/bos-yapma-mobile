import type { SessionConfig, SessionDuration } from '@/types/session';
import { SESSION_DURATION_MS } from '@/types/session';

export function createSessionConfig(durationMinutes: SessionDuration): SessionConfig {
  return {
    durationMinutes,
    targetDurationMs: SESSION_DURATION_MS[durationMinutes],
    mood: 'mixed',
  };
}

export function shouldEndSessionAfterChallenge(
  elapsedMs: number,
  targetDurationMs: number,
): boolean {
  return elapsedMs >= targetDurationMs;
}

export function getSessionProgress(elapsedMs: number, targetDurationMs: number): number {
  if (targetDurationMs <= 0) return 1;
  return Math.min(1, elapsedMs / targetDurationMs);
}
