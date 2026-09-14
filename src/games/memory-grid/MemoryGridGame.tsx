import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';
import { playUiClick } from '@/utils/ui-click-sound';

const GRID_MIN = 4;
const GRID_MAX = 7;

type Phase = 'show' | 'hiding' | 'recall' | 'result';

function targetCountForGrid(gridSize: number, random: () => number): number {
  if (gridSize >= 7) return random() < 0.5 ? 7 : 8;
  return gridSize;
}

export function MemoryGridGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const startAtRef = useRef(nowMs());
  const random = useMemo(() => createSeededRandom(seed), [seed]);

  const gridSize = useMemo(() => GRID_MIN + Math.floor(random() * (GRID_MAX - GRID_MIN + 1)), [random]);
  const targetCount = useMemo(
    () => targetCountForGrid(gridSize, random),
    [gridSize, random],
  );

  const targets = useMemo(() => {
    const indices = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    const selected: number[] = [];
    while (selected.length < targetCount) {
      const idx = Math.floor(random() * indices.length);
      selected.push(indices[idx]!);
      indices.splice(idx, 1);
    }
    return new Set(selected);
  }, [gridSize, random, targetCount]);

  const [phase, setPhase] = useState<Phase>('show');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [correctCount, setCorrectCount] = useState(0);

  const windowWidth = Dimensions.get('window').width;
  const gap = Math.max(4, Math.round(spacing.sm * (GRID_MAX / gridSize) * 0.65));
  const horizontalPadding = spacing.lg * 2;
  const availableWidth = windowWidth - horizontalPadding;
  const cellSize = Math.floor((availableWidth - gap * (gridSize - 1)) / gridSize);
  const gridWidth = cellSize * gridSize + gap * (gridSize - 1);
  const accent = gameAccents['memory-grid'];

  const showDuration = difficulty >= 3 ? 1000 + (gridSize - GRID_MIN) * 80 : 900 + (gridSize - GRID_MIN) * 60;

  useEffect(() => {
    const timer = setTimeout(() => setPhase('hiding'), showDuration);
    return () => clearTimeout(timer);
  }, [showDuration]);

  useEffect(() => {
    if (phase !== 'hiding') return;
    const timer = setTimeout(() => setPhase('recall'), 220);
    return () => clearTimeout(timer);
  }, [phase]);

  const toggleCell = (index: number) => {
    if (phase !== 'recall') return;
    haptics.selection();
    playUiClick();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDone = () => {
    let correct = 0;
    targets.forEach((t) => {
      if (selected.has(t)) correct += 1;
    });
    setCorrectCount(correct);
    setPhase('result');
    const perfect = correct === targetCount && selected.size === targetCount;
    if (perfect) haptics.success();
    else haptics.warning();

    setTimeout(() => {
      onComplete({
        gameId: 'memory-grid',
        score: Math.round((correct / targetCount) * 100),
        isSuccess: perfect,
        correct: perfect,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { correct, total: targetCount, gridSize },
      });
    }, 700);
  };

  const showTargets = phase === 'show' || phase === 'hiding';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {phase === 'show' || phase === 'hiding'
          ? 'İzle ve hatırla'
          : phase === 'recall'
            ? 'Hatırladıklarını seç'
            : `${correctCount}/${targetCount}`}
      </Text>

      <View style={[styles.grid, { gap, width: gridWidth }]}>
        {Array.from({ length: gridSize * gridSize }, (_, index) => {
          const isTarget = targets.has(index);
          const isSelected = selected.has(index);
          const missed = phase === 'result' && isSelected && !isTarget;
          const hit = phase === 'result' && isSelected && isTarget;

          return (
            <MemoryCell
              key={index}
              accent={accent}
              hit={hit}
              lit={showTargets && isTarget}
              missed={missed}
              onPress={() => toggleCell(index)}
              selected={isSelected && phase === 'recall'}
              size={cellSize}
            />
          );
        })}
      </View>

      {phase === 'recall' ? (
        <Pressable
          accessibilityLabel="Tamam"
          accessibilityRole="button"
          onPress={handleDone}
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.doneLabel}>Tamam</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function MemoryCell({
  size,
  lit,
  selected,
  hit,
  missed,
  accent,
  onPress,
}: {
  size: number;
  lit: boolean;
  selected: boolean;
  hit: boolean;
  missed: boolean;
  accent: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.94, { duration: 70 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 90 });
        }}
        style={[
          styles.cell,
          {
            width: Math.max(size, 28),
            height: Math.max(size, 28),
            minWidth: Math.min(size, touchTargetMin),
            minHeight: Math.min(size, touchTargetMin),
            borderRadius: Math.max(6, Math.round(size * 0.18)),
            backgroundColor: selected || hit ? `${accent}44` : colors.surface,
            borderColor: missed ? colors.error : selected || hit ? accent : colors.borderSubtle,
          },
        ]}
      >
        {lit ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(220)}
            style={[StyleSheet.absoluteFill, styles.lit, { backgroundColor: accent }]}
          />
        ) : null}
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
    overflow: 'hidden',
  },
  lit: {
    opacity: 1,
  },
  doneButton: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 160,
    minHeight: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
