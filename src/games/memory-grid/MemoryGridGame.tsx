import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';
import { playUiClick } from '@/utils/ui-click-sound';

const GRID_MIN = 4;
const GRID_MAX = 7;

type Phase = 'show' | 'recall' | 'result';

function randomGridSize(): number {
  return GRID_MIN + Math.floor(Math.random() * (GRID_MAX - GRID_MIN + 1));
}

/** Scale highlight count with grid: 4→4 … 6→6, 7→7 or 8. */
function targetCountForGrid(gridSize: number, random: () => number): number {
  if (gridSize >= 7) return random() < 0.5 ? 7 : 8;
  return gridSize;
}

export function MemoryGridGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const startAtRef = useRef(nowMs());
  const random = useMemo(() => createSeededRandom(seed), [seed]);

  const gridSize = useMemo(() => randomGridSize(), []);
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

  const startRecall = useCallback(() => {
    setPhase('recall');
  }, []);

  useEffect(() => {
    const timer = setTimeout(startRecall, showDuration);
    return () => clearTimeout(timer);
  }, [showDuration, startRecall]);

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
    haptics.success();

    setTimeout(() => {
      onComplete({
        gameId: 'memory-grid',
        score: Math.round((correct / targetCount) * 100),
        isSuccess: correct === targetCount && selected.size === targetCount,
        correct: correct === targetCount && selected.size === targetCount,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { correct, total: targetCount, gridSize },
      });
    }, 900);
  };

  const showTargets = phase === 'show';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {phase === 'show'
          ? 'İzle ve hatırla'
          : phase === 'recall'
            ? 'Hatırladıklarını seç'
            : `${correctCount} / ${targetCount}`}
      </Text>

      <View style={[styles.grid, { gap, width: gridWidth }]}>
        {Array.from({ length: gridSize * gridSize }, (_, index) => {
          const isTarget = targets.has(index);
          const isSelected = selected.has(index);
          const lit = showTargets && isTarget;

          return (
            <Pressable
              key={index}
              onPress={() => toggleCell(index)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderRadius: Math.max(6, Math.round(cellSize * 0.18)),
                  backgroundColor: lit ? accent : isSelected ? `${accent}44` : colors.surface,
                  borderColor: isSelected ? accent : colors.borderSubtle,
                },
              ]}
            >
              {lit ? (
                <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {phase === 'recall' ? (
        <Pressable onPress={handleDone} style={[styles.doneButton, { backgroundColor: accent }]}>
          <Text style={styles.doneLabel}>Tamam</Text>
        </Pressable>
      ) : null}
    </View>
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
  },
  doneButton: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  doneLabel: {
    ...typography.button,
    color: colors.backgroundPrimary,
  },
});
