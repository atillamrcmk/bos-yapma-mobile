import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '@/theme';

interface ProgressBarProps {
  progress: SharedValue<number>;
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = colors.accentPrimary,
  height = 2,
}: ProgressBarProps) {
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(1, Math.max(0, progress.value)) }],
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
    flex: 1,
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    transformOrigin: 'left',
  },
});
