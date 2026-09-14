import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { IconButton } from './IconButton';
import { ProgressBar } from './ProgressBar';
import { spacing } from '@/theme';
import { nowMs } from '@/utils/time';

interface GameHeaderProps {
  sessionStartedAt: number;
  targetDurationMs: number;
  complete?: boolean;
  onExit: () => void;
}

export function GameHeader({
  sessionStartedAt,
  targetDurationMs,
  complete = false,
  onExit,
}: GameHeaderProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (complete) {
      progress.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
      return;
    }

    const elapsed = nowMs() - sessionStartedAt;
    const remaining = Math.max(0, targetDurationMs - elapsed);
    const startP = Math.min(1, elapsed / Math.max(1, targetDurationMs));
    progress.value = startP;
    if (remaining > 0 && startP < 1) {
      progress.value = withTiming(1, { duration: remaining, easing: Easing.linear });
    }
  }, [complete, progress, sessionStartedAt, targetDurationMs]);

  return (
    <View style={styles.row}>
      <IconButton accessibilityLabel="Oturumu kapat" icon="✕" onPress={onExit} />
      <ProgressBar progress={progress} />
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  spacer: {
    width: 44,
  },
});
