import { getEnabledMetadata } from '../games/metadata';
import { getDifficultyForDuration, selectNextChallenge } from './generator';
import type { GameCategory, GameId } from '../types/game';
import { SESSION_DURATION_MS, type SessionDuration } from '../types/session';

function simulateSession(
  durationMinutes: SessionDuration,
  runSeed: number,
): {
  targetMs: number;
  actualMs: number;
  challengeCount: number;
  overshootMs: number;
} {
  const targetMs = SESSION_DURATION_MS[durationMinutes];
  const difficulty = getDifficultyForDuration(durationMinutes);
  const defs = getEnabledMetadata();
  const durationById = Object.fromEntries(defs.map((d) => [d.id, d.estimatedDurationMs])) as Record<
    GameId,
    number
  >;

  let elapsed = 0;
  let seed = runSeed;
  const playedGameIds: GameId[] = [];
  const playedCategories: GameCategory[] = [];
  let challengeCount = 0;

  while (elapsed < targetMs || challengeCount === 0) {
    const challenge = selectNextChallenge({
      targetDurationMs: targetMs,
      elapsedMs: elapsed,
      durationMinutes,
      playedGameIds,
      playedCategories,
      difficulty,
      seed,
    });
    seed += 997;
    challengeCount += 1;

    const jitter = 0.85 + (Math.sin(seed) * 0.5 + 0.5) * 0.3;
    const gameDuration = Math.round(durationById[challenge.gameId] * jitter);
    elapsed += gameDuration;

    playedGameIds.push(challenge.gameId);
    playedCategories.push(defs.find((d) => d.id === challenge.gameId)!.category);

    if (elapsed >= targetMs) break;
    if (challengeCount > 30) break;
  }

  return {
    targetMs,
    actualMs: elapsed,
    challengeCount,
    overshootMs: Math.max(0, elapsed - targetMs),
  };
}

function runBatch(durationMinutes: SessionDuration, runs: number) {
  const results = Array.from({ length: runs }, (_, i) =>
    simulateSession(durationMinutes, Date.now() + i * 13),
  );
  const avgActual = results.reduce((s, r) => s + r.actualMs, 0) / runs;
  const avgCount = results.reduce((s, r) => s + r.challengeCount, 0) / runs;
  const avgOvershoot = results.reduce((s, r) => s + r.overshootMs, 0) / runs;

  return {
    durationMinutes,
    targetMs: SESSION_DURATION_MS[durationMinutes],
    avgActualMs: Math.round(avgActual),
    avgChallengeCount: Math.round(avgCount * 10) / 10,
    avgOvershootMs: Math.round(avgOvershoot),
    samples: results,
  };
}

const one = runBatch(1, 12);
const three = runBatch(3, 12);
const five = runBatch(5, 12);

console.log('=== Session Duration Simulation ===\n');
for (const batch of [one, three, five]) {
  console.log(`${batch.durationMinutes} dk target (${batch.targetMs}ms):`);
  console.log(`  avg actual: ${batch.avgActualMs}ms (${(batch.avgActualMs / 1000).toFixed(1)}s)`);
  console.log(`  avg challenges: ${batch.avgChallengeCount}`);
  console.log(
    `  avg overshoot: ${batch.avgOvershootMs}ms (${(batch.avgOvershootMs / 1000).toFixed(1)}s)`,
  );
  console.log('');
}

const allOvershoots = [...one.samples, ...three.samples, ...five.samples].map((s) => s.overshootMs);
const globalAvgOvershoot = allOvershoots.reduce((a, b) => a + b, 0) / allOvershoots.length;
console.log(
  `Global avg overshoot: ${Math.round(globalAvgOvershoot)}ms (${(globalAvgOvershoot / 1000).toFixed(1)}s)`,
);
