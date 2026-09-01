import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';

const GRID_SIZE = 4;
const SYMBOLS = ['●', '■', '▲', '◆'] as const;

interface CellData {
  id: number;
  symbol: string;
  isOdd: boolean;
}

function generateGrid(seed: number): CellData[] {
  const random = createSeededRandom(seed);
  const normalSymbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
  let oddSymbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
  while (oddSymbol === normalSymbol) {
    oddSymbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
  }

  const oddIndex = Math.floor(random() * GRID_SIZE * GRID_SIZE);
  const cells: CellData[] = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
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
  const { width } = useWindowDimensions();
  const startAtRef = useRef(nowMs());
  const [answered, setAnswered] = useState(false);
  const [wrongId, setWrongId] = useState<number | null>(null);

  const cells = useMemo(() => generateGrid(seed), [seed]);
  const gap = spacing.sm;
  const horizontalPadding = spacing.lg * 2;
  const cellSize = Math.floor((width - horizontalPadding - gap * (GRID_SIZE - 1)) / GRID_SIZE);
  const accent = gameAccents['odd-one-out'];

  const handleSelect = useCallback(
    (cell: CellData) => {
      if (answered) return;

      if (cell.isOdd) {
        setAnswered(true);
        haptics.success();
        setTimeout(() => {
          onComplete({
            gameId: 'odd-one-out',
            score: 100,
            correct: true,
            durationMs: nowMs() - startAtRef.current,
            startedAt: startAtRef.current,
            completedAt: nowMs(),
          });
        }, 600);
      } else {
        setWrongId(cell.id);
        haptics.warning();
        setTimeout(() => setWrongId(null), 400);
      }
    },
    [answered, onComplete],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farklı olanı bul</Text>
      <View style={[styles.grid, { gap, maxWidth: cellSize * GRID_SIZE + gap * (GRID_SIZE - 1) }]}>
        {cells.map((cell) => (
          <Cell
            key={cell.id}
            accent={accent}
            cell={cell}
            correct={answered && cell.isOdd}
            onPress={() => handleSelect(cell)}
            size={cellSize}
            wrong={wrongId === cell.id}
          />
        ))}
      </View>
    </View>
  );
}

function Cell({
  cell,
  size,
  onPress,
  correct,
  wrong,
  accent,
}: {
  cell: CellData;
  size: number;
  onPress: () => void;
  correct: boolean;
  wrong: boolean;
  accent: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: wrong ? colors.error : correct ? colors.success : colors.borderSubtle,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withTiming(1.05, { duration: 120 }),
    );
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderColor: wrong ? colors.error : correct ? accent : colors.borderSubtle,
            backgroundColor: correct ? `${accent}22` : colors.surface,
          },
        ]}
      >
        <Text style={[styles.symbol, { color: correct ? accent : colors.textPrimary }]}>
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
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 28,
  },
});
