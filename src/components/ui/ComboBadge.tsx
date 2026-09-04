import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '@/theme';

const VISIBLE_FROM = 3;

interface ComboBadgeProps {
  combo: number;
  pulseKey: number;
}

export function ComboBadge({ combo, pulseKey }: ComboBadgeProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const visible = combo >= VISIBLE_FROM;

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 160 });
  }, [opacity, visible]);

  useEffect(() => {
    if (!visible || pulseKey === 0) return;
    scale.value = withSequence(
      withSpring(1.28, { damping: 8, stiffness: 320 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
  }, [pulseKey, scale, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible && combo === 0) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.badge, animatedStyle]}>
      <View style={styles.row}>
        <Text style={styles.x}>x</Text>
        <Text style={styles.value}>{combo}</Text>
      </View>
      <Text style={styles.label}>COMBO</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    zIndex: 50,
    right: spacing.md,
    bottom: spacing.md,
    minWidth: 76,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  x: {
    ...typography.label,
    color: colors.accentPrimary,
    fontSize: 14,
    letterSpacing: 0,
    textTransform: 'none',
    marginBottom: 4,
  },
  value: {
    ...typography.metricSmall,
    fontSize: 28,
    color: colors.accentPrimary,
    lineHeight: 32,
  },
  label: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 1.4,
    color: colors.textMuted,
    marginTop: 2,
  },
});
