import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameId } from '@/types/game';

const KEY = 'seenGameTutorials.v1';

let cache: Set<string> | null = null;

async function load(): Promise<Set<string>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

export async function hasSeenTutorial(gameId: GameId): Promise<boolean> {
  const set = await load();
  return set.has(gameId);
}

export async function markTutorialSeen(gameId: GameId): Promise<void> {
  const set = await load();
  if (set.has(gameId)) return;
  set.add(gameId);
  await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
}
