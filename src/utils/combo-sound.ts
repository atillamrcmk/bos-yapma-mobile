import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

const COMBO_POP = require('../../assets/sounds/combo-pop.wav');

const BASE_RATE = 1;
const RATE_STEP = 0.08;
const MAX_RATE = 1.8;

let sound: AudioPlayer | null = null;
let loading: Promise<AudioPlayer | null> | null = null;

async function ensureSound(): Promise<AudioPlayer | null> {
  if (Platform.OS === 'web') return null;
  if (sound) return sound;
  if (loading) return loading;

  loading = (async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionModeAndroid: 'duckOthers',
      });
      const created = createAudioPlayer(COMBO_POP);
      created.volume = 0.85;
      sound = created;
      return created;
    } catch {
      return null;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export function rateForCombo(combo: number): number {
  return Math.min(MAX_RATE, BASE_RATE + Math.max(0, combo - 1) * RATE_STEP);
}

/** Plays the combo pop with pitch rising as combo grows (`shouldCorrectPitch: false`). */
export async function playComboSound(combo: number): Promise<void> {
  const instance = await ensureSound();
  if (!instance) return;

  try {
    instance.shouldCorrectPitch = false;
    instance.playbackRate = rateForCombo(combo);
    await instance.seekTo(0);
    instance.play();
  } catch {
    // Audio may be unavailable on simulators / restricted devices.
  }
}

export async function unloadComboSound(): Promise<void> {
  if (!sound) return;
  try {
    (sound as unknown as { release(): void }).release();
  } catch {
    // ignore
  }
  sound = null;
}
