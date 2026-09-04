import { Audio, type AVPlaybackSource } from 'expo-av';
import { Platform } from 'react-native';

const COMBO_POP = require('../../assets/sounds/combo-pop.wav') as AVPlaybackSource;

const BASE_RATE = 1;
const RATE_STEP = 0.08;
const MAX_RATE = 1.8;

let sound: Audio.Sound | null = null;
let loading: Promise<Audio.Sound | null> | null = null;

async function ensureSound(): Promise<Audio.Sound | null> {
  if (Platform.OS === 'web') return null;
  if (sound) return sound;
  if (loading) return loading;

  loading = (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound: created } = await Audio.Sound.createAsync(COMBO_POP, {
        shouldPlay: false,
        volume: 0.85,
        isLooping: false,
      });
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
    const rate = rateForCombo(combo);
    await instance.setPositionAsync(0);
    await instance.setRateAsync(rate, false);
    await instance.playAsync();
  } catch {
    // Audio may be unavailable on simulators / restricted devices.
  }
}

export async function unloadComboSound(): Promise<void> {
  if (!sound) return;
  try {
    await sound.unloadAsync();
  } catch {
    // ignore
  }
  sound = null;
}
