import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '@/theme';

interface FeedbackOverlayProps {
  message: string;
  subMessage?: string;
  accentColor?: string;
  visible: boolean;
}

export function FeedbackOverlay({
  message,
  subMessage,
  accentColor = colors.accentPrimary,
  visible,
}: FeedbackOverlayProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={styles.overlay}
    >
      <View style={[styles.card, { borderColor: accentColor }]}>
        <Text style={[styles.message, { color: accentColor }]}>{message}</Text>
        {subMessage ? <Text style={styles.sub}>{subMessage}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  message: {
    ...typography.title,
    textAlign: 'center',
  },
  sub: {
    ...typography.body,
    textAlign: 'center',
  },
});
