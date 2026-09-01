import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function run(action: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    await action();
  } catch {
    // Haptics unavailable on some devices/simulators.
  }
}

export const haptics = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  selection: () => run(() => Haptics.selectionAsync()),
};
