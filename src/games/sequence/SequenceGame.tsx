import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OptionButton } from '@/components/ui/OptionButton';
import type { GameComponentProps } from '@/types/game';
import { gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom, shuffleWithSeed } from '@/utils/seeded-random';

interface SequenceProblem {
  display: string;
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
  const display = `${seq.join(' — ')} — ?`;

  const options = new Set<number>([next]);
  while (options.size < 4) {
    const offset = Math.floor(random() * 8) - 4 || 2;
    options.add(next + offset);
  }

  return {
    display,
    answer: next,
    options: shuffleWithSeed([...options], seed + 3),
  };
}

export function SequenceGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const problem = useMemo(() => generateSequence(seed, difficulty), [seed, difficulty]);
  const startAtRef = useRef(nowMs());
  const [answered, setAnswered] = useState(false);
  const accent = gameAccents.sequence;

  const handleSelect = (value: number) => {
    if (answered) return;
    setAnswered(true);
    const correct = value === problem.answer;
    if (correct) haptics.success();
    else haptics.warning();

    setTimeout(
      () => {
        onComplete({
          gameId: 'sequence',
          score: correct ? 100 : 0,
          correct,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
        });
      },
      correct ? 500 : 900,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sıradaki sayı?</Text>
      <Text style={[styles.sequence, { color: accent }]}>{problem.display}</Text>
      <View style={styles.options}>
        {problem.options.map((opt) => (
          <OptionButton
            key={opt}
            correct={answered && opt === problem.answer}
            disabled={answered}
            label={String(opt)}
            onPress={() => handleSelect(opt)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
  },
  sequence: {
    ...typography.metricSmall,
    fontSize: 28,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 36,
  },
  options: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
});
