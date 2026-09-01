import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';

const GRID_SIZE = 4;

type Phase = 'show' | 'recall' | 'result';

export function MemoryGridGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const { width } = useWindowDimensions();
  const startAtRef = useRef(nowMs());
  const random = useMemo(() => createSeededRandom(seed), [seed]);

  const targetCount = difficulty >= 3 ? 5 : difficulty >= 2 ? 4 : 4;
  const targets = useMemo(() => {
    const indices = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    const selected: number[] = [];
    while (selected.length < targetCount) {
      const idx = Math.floor(random() * indices.length);
      selected.push(indices[idx]!);
      indices.splice(idx, 1);
    }
    return new Set(selected);
  }, [random, targetCount]);

  const [phase, setPhase] = useState<Phase>('show');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [correctCount, setCorrectCount] = useState(0);

  const gap = spacing.sm;
  const horizontalPadding = spacing.lg * 2;
  const cellSize = Math.floor((width - horizontalPadding - gap * (GRID_SIZE - 1)) / GRID_SIZE);
  const accent = gameAccents['memory-grid'];

  const showDuration = difficulty >= 3 ? 1000 : 900;

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
        correct: correct === targetCount,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { correct, total: targetCount },
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

      <View style={[styles.grid, { gap, maxWidth: cellSize * GRID_SIZE + gap * (GRID_SIZE - 1) }]}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
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
    borderRadius: 12,
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
