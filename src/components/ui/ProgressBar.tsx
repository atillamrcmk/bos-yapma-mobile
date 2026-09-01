import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = colors.accentPrimary,
  height = 3,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(clamped, { duration: 200 }) }],
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: color, height, borderRadius: height / 2 },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    transformOrigin: 'left',
  },
});
