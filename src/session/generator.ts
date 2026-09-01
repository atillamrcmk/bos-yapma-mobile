import { getEnabledMetadata, type GameMetadata } from '@/games/metadata';
import type { GameCategory, GameId } from '@/types/game';
import type { SessionChallenge, SessionDuration } from '@/types/session';
import { createSeededRandom } from '@/utils/seeded-random';

export interface GeneratorContext {
  targetDurationMs: number;
  elapsedMs: number;
  durationMinutes: SessionDuration;
  playedGameIds: GameId[];
  playedCategories: GameCategory[];
  difficulty: number;
  seed: number;
}

const SHORT_GAME_THRESHOLD_MS = 18_000;
const VERY_SHORT_REMAINING_MS = 12_000;
const LOW_REMAINING_MS = 20_000;

function isEligible(def: GameMetadata, ctx: GeneratorContext, strict: boolean): boolean {
  const lastId = ctx.playedGameIds[ctx.playedGameIds.length - 1];
  if (lastId && def.id === lastId) return false;

  const recentIds = ctx.playedGameIds.slice(-2);
  if (recentIds.includes(def.id)) return false;

  const recentCats = ctx.playedCategories.slice(-2);
  if (
    recentCats.length === 2 &&
    recentCats[0] === recentCats[1] &&
    recentCats[1] === def.category
  ) {
    return false;
  }

  const remaining = ctx.targetDurationMs - ctx.elapsedMs;
  if (remaining < VERY_SHORT_REMAINING_MS && def.estimatedDurationMs > 12_000) return false;
  if (remaining < LOW_REMAINING_MS && def.estimatedDurationMs > SHORT_GAME_THRESHOLD_MS) {
    return false;
  }

  if (strict && ctx.durationMinutes === 1) {
    const seenCategories = new Set(ctx.playedCategories);
    if (
      ctx.playedGameIds.length < 3 &&
      seenCategories.has(def.category) &&
      ctx.playedGameIds.length > 0
    ) {
      const needNewCategory = seenCategories.size < Math.min(3, ctx.playedGameIds.length + 1);
      if (needNewCategory && seenCategories.has(def.category) && !recentIds.includes(def.id)) {
        const onlyThisCategoryRepeated =
          ctx.playedCategories.filter((c) => c === def.category).length >= 2;
        if (onlyThisCategoryRepeated) return false;
      }
    }
  }

  return true;
}

function pickWeighted(games: GameMetadata[], seed: number): GameMetadata {
  const random = createSeededRandom(seed);
  const totalWeight = games.reduce((sum, g) => sum + g.weight, 0);
  let roll = random() * totalWeight;
  for (const game of games) {
    roll -= game.weight;
    if (roll <= 0) return game;
  }
  return games[games.length - 1]!;
}

export function selectNextChallenge(ctx: GeneratorContext): SessionChallenge {
  const pool = getEnabledMetadata();

  let eligible = pool.filter((g) => isEligible(g, ctx, true));

  if (eligible.length === 0) {
    eligible = pool.filter((g) => g.id !== ctx.playedGameIds[ctx.playedGameIds.length - 1]);
  }

  if (eligible.length === 0) {
    eligible = pool;
  }

  const remaining = ctx.targetDurationMs - ctx.elapsedMs;
  if (remaining < LOW_REMAINING_MS) {
    const short = eligible.filter((g) => g.estimatedDurationMs <= SHORT_GAME_THRESHOLD_MS);
    if (short.length > 0) eligible = short;
  }

  const picked = pickWeighted(eligible, ctx.seed);

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
