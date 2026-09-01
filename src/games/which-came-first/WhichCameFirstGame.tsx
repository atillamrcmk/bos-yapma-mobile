import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { whichCameFirstPairs } from '@/content/which-came-first';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { pickFromSeed } from '@/utils/seeded-random';

type Phase = 'pick' | 'result';

export function WhichCameFirstGame({ onComplete, seed }: GameComponentProps) {
  const pair = useMemo(() => pickFromSeed(whichCameFirstPairs, seed), [seed]);
  const startAtRef = useRef(nowMs());
  const [phase, setPhase] = useState<Phase>('pick');
  const [selected, setSelected] = useState<'a' | 'b' | null>(null);
  const accent = gameAccents['which-came-first'];

  const handlePick = (choice: 'a' | 'b') => {
    if (phase !== 'pick') return;
    setSelected(choice);
    setPhase('result');
    const correct = choice === pair.firstId;
    if (correct) haptics.success();
    else haptics.warning();

    const yearDiff = Math.abs(pair.yearA - pair.yearB);
    setTimeout(() => {
      onComplete({
        gameId: 'which-came-first',
        score: correct ? 100 : 0,
        correct,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { yearDiff },
      });
    }, 1400);
  };

  const first = pair.firstId === 'a' ? pair.optionA : pair.optionB;
  const firstYear = pair.firstId === 'a' ? pair.yearA : pair.yearB;
  const second = pair.firstId === 'a' ? pair.optionB : pair.optionA;
  const secondYear = pair.firstId === 'a' ? pair.yearB : pair.yearA;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hangisi daha önce çıktı?</Text>

      {phase === 'pick' ? (
        <View style={styles.options}>
          <OptionCard accent={accent} label={pair.optionA} onPress={() => handlePick('a')} />
          <OptionCard accent={accent} label={pair.optionB} onPress={() => handlePick('b')} />
        </View>
      ) : (
        <View style={styles.result}>
          <Text style={styles.resultLine}>
            {first} — {firstYear}
          </Text>
          <Text style={styles.resultLine}>
            {second} — {secondYear}
          </Text>
          <Text
            style={[
              styles.feedback,
              { color: selected === pair.firstId ? accent : colors.textSecondary },
            ]}
          >
            {Math.abs(pair.yearA - pair.yearB)} yıl fark.
          </Text>
        </View>
      )}
    </View>
  );
}

function OptionCard({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, { borderColor: accent }]}
    >
      <Text style={styles.initial}>{label.charAt(0)}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
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
  options: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 120,
    justifyContent: 'center',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  initial: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textMuted,
  },
  cardLabel: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
  },
  result: {
    gap: spacing.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  resultLine: {
    ...typography.heading,
    textAlign: 'center',
  },
  feedback: {
    ...typography.body,
    marginTop: spacing.md,
  },
});
