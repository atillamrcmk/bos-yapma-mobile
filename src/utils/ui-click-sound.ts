import { Audio, type AVPlaybackSource } from 'expo-av';
import { Platform } from 'react-native';

const UI_CLICK = require('../../assets/sounds/ui-click.wav') as AVPlaybackSource;

const POOL_SIZE = 4;
const VOLUME = 0.65;

let pool: Audio.Sound[] = [];
let cursor = 0;
let loading: Promise<void> | null = null;

async function ensureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

/** Preload a small sound pool so rapid taps have near-zero start latency. */
export async function preloadUiClickSound(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (pool.length > 0) return;
  if (loading) return loading;

  loading = (async () => {
    try {
      await ensureAudioMode();
      const created = await Promise.all(
        Array.from({ length: POOL_SIZE }, () =>
          Audio.Sound.createAsync(UI_CLICK, {
            shouldPlay: false,
            volume: VOLUME,
            isLooping: false,
          }).then(({ sound }) => sound),
        ),
      );
      pool = created;
      cursor = 0;
    } catch {
      pool = [];
    } finally {
      loading = null;
    }
  })();

  return loading;
}

/**
 * Fire-and-forget mechanical UI click.
 * Uses a rotating pool so overlapping Target Tap hits do not cut each other off.
 */
export function playUiClick(): void {
  if (Platform.OS === 'web') return;
  void playUiClickAsync();
}

async function playUiClickAsync(): Promise<void> {
  try {
    if (pool.length === 0) {
      await preloadUiClickSound();
    }
    if (pool.length === 0) return;

    const instance = pool[cursor % pool.length]!;
    cursor = (cursor + 1) % pool.length;

    // replayAsync seeks to 0 and plays — lower latency than separate setPosition + play.
    await instance.setVolumeAsync(VOLUME);
    await instance.replayAsync();
  } catch {
    // Audio may be unavailable on simulators / restricted devices.
  }
}

export async function unloadUiClickSound(): Promise<void> {
  const current = pool;
  pool = [];
  cursor = 0;
  await Promise.all(
    current.map(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch {
        // ignore
      }
    }),
  );
}
