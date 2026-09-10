import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

const UI_CLICK = require('../../assets/sounds/ui-click.wav');

const POOL_SIZE = 4;
const VOLUME = 0.65;

let pool: AudioPlayer[] = [];
let cursor = 0;
let loading: Promise<void> | null = null;

async function ensureAudioMode(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
    shouldPlayInBackground: false,
    interruptionModeAndroid: 'duckOthers',
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
      pool = Array.from({ length: POOL_SIZE }, () => {
        const player = createAudioPlayer(UI_CLICK);
        player.volume = VOLUME;
        return player;
      });
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

    instance.volume = VOLUME;
    await instance.seekTo(0);
    instance.play();
  } catch {
    // Audio may be unavailable on simulators / restricted devices.
  }
}

export async function unloadUiClickSound(): Promise<void> {
  const current = pool;
  pool = [];
  cursor = 0;
  for (const player of current) {
    try {
      (player as unknown as { release(): void }).release();
    } catch {
      // ignore
    }
  }
}
