import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';
import { playUiClick } from '@/utils/ui-click-sound';

const SYMBOLS = ['●', '■', '▲', '◆'] as const;
const GRID_MIN = 4;
const GRID_MAX = 7;

interface CellData {
  id: number;
  symbol: string;
  isOdd: boolean;
}

function generateGrid(seed: number, gridSize: number): CellData[] {
  const random = createSeededRandom(seed);
  const normalSymbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
  let oddSymbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
  while (oddSymbol === normalSymbol) {
    oddSymbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
  }

  const total = gridSize * gridSize;
  const oddIndex = Math.floor(random() * total);
  const cells: CellData[] = [];

  for (let i = 0; i < total; i += 1) {
    const isOdd = i === oddIndex;
    cells.push({
      id: i,
      symbol: isOdd ? oddSymbol : normalSymbol,
      isOdd,
    });
  }

  return cells;
}

export function OddOneOutGame({ onComplete, seed }: GameComponentProps) {
  const startAtRef = useRef(nowMs());
  const [answered, setAnswered] = useState(false);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const gridSize = useMemo(() => {
    const random = createSeededRandom(seed + 41);
    return GRID_MIN + Math.floor(random() * (GRID_MAX - GRID_MIN + 1));
  }, [seed]);
  const cells = useMemo(() => generateGrid(seed, gridSize), [gridSize, seed]);

  const windowWidth = Dimensions.get('window').width;
  const gap = Math.max(4, Math.round(spacing.sm * (GRID_MAX / gridSize) * 0.55));
  const horizontalPadding = spacing.lg * 2;
  const availableWidth = windowWidth - horizontalPadding;
  const cellSize = Math.floor((availableWidth - gap * (gridSize - 1)) / gridSize);
  const accent = gameAccents['odd-one-out'];

  const shakeX = useSharedValue(0);

  const gridAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(-6, { duration: 40 }),
      withTiming(6, { duration: 40 }),
      withTiming(-3, { duration: 35 }),
      withTiming(0, { duration: 35 }),
    );
  }, [shakeX]);

  const handleSelect = useCallback(
    (cell: CellData) => {
      if (answered) return;

      if (cell.isOdd) {
        setAnswered(true);
        setSuccessId(cell.id);
        haptics.success();
        setTimeout(() => {
          onComplete({
            gameId: 'odd-one-out',
            score: 100,
            isSuccess: true,
            correct: true,
            durationMs: nowMs() - startAtRef.current,
            startedAt: startAtRef.current,
            completedAt: nowMs(),
            metadata: { gridSize },
          });
        }, 600);
      } else {
        setAnswered(true);
        setWrongId(cell.id);
        triggerShake();
        haptics.warning();
        setTimeout(() => {
          onComplete({
            gameId: 'odd-one-out',
            score: 0,
            isSuccess: false,
            correct: false,
            durationMs: nowMs() - startAtRef.current,
            startedAt: startAtRef.current,
            completedAt: nowMs(),
            metadata: { gridSize },
          });
        }, 500);
      }
    },
    [answered, gridSize, onComplete, triggerShake],
  );

  const gridWidth = cellSize * gridSize + gap * (gridSize - 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farklı olanı bul</Text>
      <Animated.View
        style={[
          styles.grid,
          gridAnimatedStyle,
          { gap, width: gridWidth },
        ]}
      >
        {cells.map((cell) => (
          <Cell
            key={cell.id}
            accent={accent}
            cell={cell}
            correct={successId === cell.id}
            faded={Boolean(answered && successId != null && cell.id !== successId)}
            onPress={() => handleSelect(cell)}
            size={cellSize}
            wrong={wrongId === cell.id}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function Cell({
  cell,
  size,
  onPress,
  correct,
  wrong,
  faded,
  accent,
}: {
  cell: CellData;
  size: number;
  onPress: () => void;
  correct: boolean;
  wrong: boolean;
  faded: boolean;
  accent: string;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (!correct) return;
    scale.value = withSequence(
      withSpring(1.16, { damping: 12, stiffness: 280 }),
      withSpring(1.06, { damping: 14, stiffness: 220 }),
    );
  }, [correct, scale]);

  useEffect(() => {
    if (!faded) return;
    opacity.value = withTiming(0.32, { duration: 180 });
  }, [faded, opacity]);

  const onCellPress = () => {
    playUiClick();
    if (!correct) {
      scale.value = withSequence(
        withTiming(0.92, { duration: 70 }),
        withTiming(1, { duration: 100 }),
      );
    }
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onCellPress}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: Math.max(6, Math.round(size * 0.18)),
            borderWidth: correct ? 2 : 1.5,
            borderColor: wrong ? colors.error : correct ? accent : colors.borderSubtle,
            backgroundColor: correct ? `${accent}22` : colors.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.symbol,
            {
              color: correct ? accent : colors.textPrimary,
              fontSize: Math.max(12, Math.min(28, size * 0.45)),
            },
          ]}
        >
          {cell.symbol}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cell: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 28,
  },
});
