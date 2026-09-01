import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OptionButton } from '@/components/ui/OptionButton';
import type { GameComponentProps } from '@/types/game';
import { gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom, shuffleWithSeed } from '@/utils/seeded-random';

interface MathProblem {
  expression: string;
  answer: number;
  options: number[];
}

function generateProblem(seed: number, difficulty: number): MathProblem {
  const random = createSeededRandom(seed);
  const useSubtraction = random() > 0.5 && difficulty >= 2;

  let a = 10 + Math.floor(random() * 80);
  let b = 10 + Math.floor(random() * 80);

  if (useSubtraction && a < b) [a, b] = [b, a];

  const answer = useSubtraction ? a - b : a + b;
  const expression = useSubtraction ? `${a} − ${b}` : `${a} + ${b}`;

  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(random() * 10) - 5 || 2;
    const candidate = answer + offset;
    if (candidate >= 0) options.add(candidate);
  }

  return {
    expression,
    answer,
    options: shuffleWithSeed([...options], seed + 7),
  };
}

export function QuickMathGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const problem = useMemo(() => generateProblem(seed, difficulty), [seed, difficulty]);
  const startAtRef = useRef(nowMs());
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const accent = gameAccents['quick-math'];

  const handleSelect = (value: number) => {
    if (answered) return;
    setSelected(value);
    setAnswered(true);

    const correct = value === problem.answer;
    if (correct) haptics.success();
    else haptics.warning();

    setTimeout(
      () => {
        onComplete({
          gameId: 'quick-math',
          score: correct ? 100 : 0,
          correct,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: { answer: problem.answer, selected: value },
        });
      },
      correct ? 500 : 900,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hızlı hesap</Text>
      <Text style={[styles.expression, { color: accent }]}>{problem.expression}</Text>

      <View style={styles.options}>
        {problem.options.map((option) => (
          <OptionButton
            key={option}
            correct={answered && option === problem.answer}
            disabled={answered}
            label={String(option)}
            onPress={() => handleSelect(option)}
            selected={selected === option}
            wrong={answered && selected === option && option !== problem.answer}
            style={styles.option}
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
  expression: {
    ...typography.metric,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  options: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  option: {
    width: '100%',
  },
});
