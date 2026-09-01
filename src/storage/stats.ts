import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bos_yapma/stats';

export interface UserStats {
  bestReactionMs: number | null;
  sessionsCompleted: number;
  bestEstimateAccuracy: number | null;
  bestMemoryScore: number | null;
  lastPlayedAt: string | null;
  lastSessionReactionMs: number | null;
  lastSessionEstimateAccuracy: number | null;
  lastSessionMemoryCorrect: number | null;
  lastSessionMemoryTotal: number | null;
}

const defaultStats: UserStats = {
  bestReactionMs: null,
  sessionsCompleted: 0,
  bestEstimateAccuracy: null,
  bestMemoryScore: null,
  lastPlayedAt: null,
  lastSessionReactionMs: null,
  lastSessionEstimateAccuracy: null,
  lastSessionMemoryCorrect: null,
  lastSessionMemoryTotal: null,
};

export async function getStats(): Promise<UserStats> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultStats };
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return { ...defaultStats };
  }
}

export async function saveStats(stats: UserStats): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export interface SessionStatsUpdate {
  reactionMs?: number | null;
  estimateAccuracy?: number | null;
  memoryCorrect?: number | null;
  memoryTotal?: number | null;
}

export async function updateStatsAfterSession(update: SessionStatsUpdate): Promise<UserStats> {
  const current = await getStats();
  const next: UserStats = {
    ...current,
    sessionsCompleted: current.sessionsCompleted + 1,
    lastPlayedAt: new Date().toISOString(),
    lastSessionReactionMs: update.reactionMs ?? null,
    lastSessionEstimateAccuracy: update.estimateAccuracy ?? null,
    lastSessionMemoryCorrect: update.memoryCorrect ?? null,
    lastSessionMemoryTotal: update.memoryTotal ?? null,
  };

  if (update.reactionMs != null) {
    next.bestReactionMs =
      current.bestReactionMs == null
        ? update.reactionMs
        : Math.min(current.bestReactionMs, update.reactionMs);
  }

  if (update.estimateAccuracy != null) {
    next.bestEstimateAccuracy =
      current.bestEstimateAccuracy == null
        ? update.estimateAccuracy
        : Math.max(current.bestEstimateAccuracy, update.estimateAccuracy);
  }

  if (update.memoryCorrect != null) {
    next.bestMemoryScore =
      current.bestMemoryScore == null
        ? update.memoryCorrect
        : Math.max(current.bestMemoryScore, update.memoryCorrect);
  }

  await saveStats(next);
  return next;
}
