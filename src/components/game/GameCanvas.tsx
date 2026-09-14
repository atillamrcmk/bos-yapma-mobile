import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { spacing } from '@/theme';

interface GameCanvasProps {
  children: (size: { width: number; height: number }) => ReactNode;
  style?: ViewStyle;
  minHeight?: number;
}

/** Measured play area with safe padding — normalized coords should map to these bounds. */
export function GameCanvas({ children, style, minHeight = 280 }: GameCanvasProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  return (
    <View onLayout={onLayout} style={[styles.canvas, { minHeight }, style]}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: '100%',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
});
