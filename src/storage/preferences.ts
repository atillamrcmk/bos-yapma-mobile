import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessionDuration } from '@/types/session';

const PREF_KEY = '@bos_yapma/preferences';

interface Preferences {
  lastDurationMinutes: SessionDuration;
}

const defaults: Preferences = {
  lastDurationMinutes: 3,
};

export async function getPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(PREF_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export async function saveDurationPreference(minutes: SessionDuration): Promise<void> {
  const prefs = await getPreferences();
  await AsyncStorage.setItem(PREF_KEY, JSON.stringify({ ...prefs, lastDurationMinutes: minutes }));
}
