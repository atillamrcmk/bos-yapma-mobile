import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';

interface MathProblem {
  expression: string;
  answer: number;
  wrong: number;
  leftCorrect: boolean;
}

function generateProblem(seed: number, difficulty: number): MathProblem {
  const random = createSeededRandom(seed);
  const useSubtraction = random() > 0.5 && difficulty >= 2;

  let a = 10 + Math.floor(random() * 80);
  let b = 10 + Math.floor(random() * 80);

  if (useSubtraction && a < b) [a, b] = [b, a];

  const answer = useSubtraction ? a - b : a + b;
  const expression = useSubtraction ? `${a} − ${b}` : `${a} + ${b}`;
  let wrong = answer + (random() > 0.5 ? 6 : -6);
  if (wrong === answer || wrong < 0) wrong = answer + 8;
  const leftCorrect = random() > 0.5;

  return { expression, answer, wrong, leftCorrect };
}

export function QuickMathGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const problem = useMemo(() => generateProblem(seed, difficulty), [seed, difficulty]);
  const startAtRef = useRef(nowMs());
  const [answered, setAnswered] = useState<'left' | 'right' | null>(null);
  const accent = gameAccents['quick-math'];

  const leftValue = problem.leftCorrect ? problem.answer : problem.wrong;
  const rightValue = problem.leftCorrect ? problem.wrong : problem.answer;

  const handleSelect = (side: 'left' | 'right') => {
    if (answered) return;
    setAnswered(side);
    const correct = (side === 'left') === problem.leftCorrect;
    if (correct) haptics.success();
    else haptics.warning();

    setTimeout(
      () => {
        onComplete({
          gameId: 'quick-math',
          score: correct ? 100 : 0,
          isSuccess: correct,
          correct,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: { answer: problem.answer, selected: side },
        });
      },
      correct ? 400 : 550,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hangisi doğru?</Text>
      <View style={styles.cards}>
        <EquationCard
          accent={accent}
          disabled={answered != null}
          expression={problem.expression}
          result={leftValue}
          state={
            answered == null
              ? 'idle'
              : problem.leftCorrect
                ? 'correct'
                : answered === 'left'
                  ? 'wrong'
                  : 'idle'
          }
          onPress={() => handleSelect('left')}
        />
        <EquationCard
          accent={accent}
          disabled={answered != null}
          expression={problem.expression}
          result={rightValue}
          state={
            answered == null
              ? 'idle'
              : !problem.leftCorrect
                ? 'correct'
                : answered === 'right'
                  ? 'wrong'
                  : 'idle'
          }
          onPress={() => handleSelect('right')}
        />
      </View>
    </View>
  );
}

function EquationCard({
  expression,
  result,
  onPress,
  state,
  accent,
  disabled,
}: {
  expression: string;
  result: number;
  onPress: () => void;
  state: 'idle' | 'correct' | 'wrong';
  accent: string;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`${expression} eşittir ${result}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        state === 'correct' && { borderColor: accent },
        state === 'wrong' && styles.cardWrong,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.equation}>
        {expression} = {result}
      </Text>
    </Pressable>
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
  cards: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  card: {
    minHeight: Math.max(88, touchTargetMin * 2),
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
  },
  cardWrong: {
    borderColor: colors.error,
  },
  equation: {
    ...typography.heading,
    fontSize: 26,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
