import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, radius, spacing, touchTargetMin, typography } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OptionButtonProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function OptionButton({
  label,
  onPress,
  selected = false,
  correct = false,
  wrong = false,
  disabled = false,
  style,
}: OptionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = correct
    ? colors.success
    : wrong
      ? colors.error
      : selected
        ? colors.accentPrimary
        : colors.borderSubtle;

  const backgroundColor = correct
    ? 'rgba(110, 231, 160, 0.12)'
    : wrong
      ? 'rgba(240, 113, 103, 0.12)'
      : colors.surface;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) scale.value = withTiming(0.98, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 110 });
      }}
      style={[
        styles.button,
        { borderColor, backgroundColor },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTargetMin + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.heading,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  disabled: {
    opacity: 0.6,
  },
});
