import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom, shuffleWithSeed } from '@/utils/seeded-random';

interface SequenceProblem {
  seq: number[];
  answer: number;
  options: number[];
}

function generateSequence(seed: number, difficulty: number): SequenceProblem {
  const random = createSeededRandom(seed);
  const patterns: (() => { seq: number[]; next: number })[] = [
    () => {
      const start = 2 + Math.floor(random() * 6);
      const step = 2;
      return {
        seq: [start, start + step, start + step * 2, start + step * 3],
        next: start + step * 4,
      };
    },
    () => {
      const start = 3 + Math.floor(random() * 5);
      const step = 3;
      return {
        seq: [start, start + step, start + step * 2, start + step * 3],
        next: start + step * 4,
      };
    },
    () => {
      const start = 5 + Math.floor(random() * 4);
      const step = 5;
      return {
        seq: [start, start + step, start + step * 2, start + step * 3],
        next: start + step * 4,
      };
    },
    () => {
      const start = 20 + Math.floor(random() * 10);
      return { seq: [start, start - 2, start - 4, start - 6], next: start - 8 };
    },
    () => {
      const start = 2 + Math.floor(random() * 4);
      return { seq: [start, start * 2, start * 4, start * 8], next: start * 16 };
    },
  ];

  const pick =
    patterns[Math.floor(random() * (difficulty >= 2 ? patterns.length : patterns.length - 1))]!;
  const { seq, next } = pick();

  const options = new Set<number>([next]);
  while (options.size < 4) {
    const offset = Math.floor(random() * 8) - 4 || 2;
    options.add(next + offset);
  }

  return {
    seq,
    answer: next,
    options: shuffleWithSeed([...options], seed + 3),
  };
}

export function SequenceGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const problem = useMemo(() => generateSequence(seed, difficulty), [seed, difficulty]);
  const startAtRef = useRef(nowMs());
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);
  const accent = gameAccents.sequence;

  const handleSelect = (value: number) => {
    if (selected != null) return;
    setSelected(value);
    const correct = value === problem.answer;
    setRevealed(value);
    if (correct) haptics.success();
    else haptics.warning();

    if (!correct) {
      setTimeout(() => setRevealed(problem.answer), 280);
    }

    setTimeout(
      () => {
        onComplete({
          gameId: 'sequence',
          score: correct ? 100 : 0,
          isSuccess: correct,
          correct,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
        });
      },
      correct ? 450 : 700,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sıradaki sayı?</Text>
      <View style={styles.rhythm} accessibilityLabel={problem.seq.join(', ')}>
        {problem.seq.map((n, i) => (
          <Text key={`${n}-${i}`} style={[styles.beat, { color: accent }]}>
            {n}
          </Text>
        ))}
        <Text style={[styles.beat, styles.unknown, revealed != null && { color: accent }]}>
          {revealed ?? '?'}
        </Text>
      </View>

      <View style={styles.options}>
        {problem.options.map((opt) => {
          const isSelected = selected === opt;
          const isAnswer = selected != null && opt === problem.answer;
          return (
            <Pressable
              key={opt}
              accessibilityLabel={String(opt)}
              accessibilityRole="button"
              disabled={selected != null}
              onPress={() => handleSelect(opt)}
              style={({ pressed }) => [
                styles.option,
                isAnswer && styles.optionCorrect,
                isSelected && !isAnswer && styles.optionWrong,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.optionLabel}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.bodySmall,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  rhythm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  beat: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  unknown: {
    color: colors.textMuted,
  },
  options: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    width: '48%',
    flexGrow: 1,
    minHeight: touchTargetMin + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
  },
  optionCorrect: {
    borderColor: colors.success,
  },
  optionWrong: {
    borderColor: colors.error,
  },
  optionLabel: {
    ...typography.heading,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
