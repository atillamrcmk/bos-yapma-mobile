import type { InteractionType } from '@/games/metadata';
import { getMainMixMetadata, type GameMetadata } from '@/games/metadata';
import type { GameCategory, GameId } from '@/types/game';
import type { SessionChallenge, SessionDuration } from '@/types/session';
import { createSeededRandom } from '@/utils/seeded-random';

export interface GeneratorContext {
  targetDurationMs: number;
  elapsedMs: number;
  durationMinutes: SessionDuration;
  playedGameIds: GameId[];
  playedCategories: GameCategory[];
  playedInteractionTypes?: InteractionType[];
  playedQuizPattern?: boolean[];
  difficulty: number;
  seed: number;
}

const SHORT_GAME_THRESHOLD_MS = 18_000;
const VERY_SHORT_REMAINING_MS = 12_000;
const LOW_REMAINING_MS = 22_000;

function lastOf<T>(items: T[] | undefined): T | undefined {
  if (!items || items.length === 0) return undefined;
  return items[items.length - 1];
}

function isEligible(def: GameMetadata, ctx: GeneratorContext): boolean {
  const lastId = lastOf(ctx.playedGameIds);
  if (lastId && def.id === lastId) return false;

  const lastThree = ctx.playedGameIds.slice(-3);
  if (lastThree.includes(def.id)) return false;

  const remaining = ctx.targetDurationMs - ctx.elapsedMs;
  if (remaining < VERY_SHORT_REMAINING_MS && def.estimatedDurationMs > 14_000) return false;
  if (remaining < LOW_REMAINING_MS && def.estimatedDurationMs > SHORT_GAME_THRESHOLD_MS) {
    return false;
  }

  return true;
}

function candidateScore(def: GameMetadata, ctx: GeneratorContext): number {
  let score = 100 * def.weight;

  const lastId = lastOf(ctx.playedGameIds);
  if (lastId === def.id) score -= 1000;

  const lastType = lastOf(ctx.playedInteractionTypes);
  if (lastType && lastType === def.interactionType) score -= 200;

  const lastCat = lastOf(ctx.playedCategories);
  if (lastCat && lastCat === def.category) score -= 80;

  const lastThree = ctx.playedGameIds.slice(-3);
  if (lastThree.includes(def.id)) score -= 100;

  if (!ctx.playedGameIds.includes(def.id)) score += 30;

  const remaining = ctx.targetDurationMs - ctx.elapsedMs;
  if (remaining > 0 && remaining < def.estimatedDurationMs * 0.65) score -= 50;

  // Soft category mix: prefer ACTION / PUZZLE / PERCEPTION variety early
  const catCounts = ctx.playedCategories.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});
  const total = ctx.playedCategories.length || 1;
  const share = (catCounts[def.category] ?? 0) / total;
  if (def.category === 'ACTION' && share > 0.4) score -= 25;
  if (def.category === 'PUZZLE' && share > 0.45) score -= 25;
  if (def.category === 'OTHER') score -= 500;

  return score;
}

function pickWeightedByScore(
  games: GameMetadata[],
  ctx: GeneratorContext,
  seed: number,
): GameMetadata {
  const random = createSeededRandom(seed);
  const scored = games.map((g) => ({ g, w: Math.max(1, candidateScore(g, ctx)) }));
  const totalWeight = scored.reduce((sum, item) => sum + item.w, 0);
  let roll = random() * totalWeight;
  for (const item of scored) {
    roll -= item.w;
    if (roll <= 0) return item.g;
  }
  return scored[scored.length - 1]!.g;
}

export function selectNextChallenge(ctx: GeneratorContext): SessionChallenge {
  const pool = getMainMixMetadata();
  const lastType = lastOf(ctx.playedInteractionTypes);

  let eligible = pool.filter((g) => isEligible(g, ctx));

  if (eligible.length === 0) {
    eligible = pool.filter((g) => g.id !== lastOf(ctx.playedGameIds));
  }

  if (eligible.length === 0) {
    eligible = [...pool];
  }

  const remaining = ctx.targetDurationMs - ctx.elapsedMs;
  if (remaining < LOW_REMAINING_MS) {
    const short = eligible.filter((g) => g.estimatedDurationMs <= SHORT_GAME_THRESHOLD_MS);
    if (short.length > 0) eligible = short;
  }

  if (lastType) {
    const differentType = eligible.filter((g) => g.interactionType !== lastType);
    if (differentType.length > 0) eligible = differentType;
  }

  const picked = pickWeightedByScore(eligible, ctx, ctx.seed);

  return {
    gameId: picked.id,
    seed: ctx.seed,
    difficulty: ctx.difficulty,
  };
}

export function getDifficultyForDuration(minutes: SessionDuration): number {
  if (minutes === 1) return 1;
  if (minutes === 5) return 3;
  return 2;
}
