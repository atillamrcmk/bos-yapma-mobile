import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from './IconButton';
import { ProgressBar } from './ProgressBar';
import { colors, spacing, typography } from '@/theme';

interface GameHeaderProps {
  current: number;
  total?: number;
  sessionProgress: number;
  onExit: () => void;
}

export function GameHeader({ current, total, sessionProgress, onExit }: GameHeaderProps) {
  const indicator = total != null ? `${current} / ${total}` : `#${current}`;
  return (
    <View style={styles.wrapper}>
      <ProgressBar progress={sessionProgress} />
      <View style={styles.row}>
        <IconButton accessibilityLabel="Oturumu kapat" icon="✕" onPress={onExit} />
        <Text style={styles.indicator}>{indicator}</Text>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indicator: {
    ...typography.label,
    fontSize: 12,
    color: colors.textMuted,
  },
  spacer: {
    width: 44,
  },
});
