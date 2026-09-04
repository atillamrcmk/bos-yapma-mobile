import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { stroopColorKeys, stroopColors, type StroopColorKey } from '@/content/color-match';
import { OptionButton } from '@/components/ui/OptionButton';
import type { GameComponentProps } from '@/types/game';
import { gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom, shuffleWithSeed } from '@/utils/seeded-random';

const ROUNDS = 3;

interface Round {
  wordKey: StroopColorKey;
  inkKey: StroopColorKey;
}

function buildRounds(seed: number): Round[] {
  const random = createSeededRandom(seed);
  const rounds: Round[] = [];
  for (let i = 0; i < ROUNDS; i += 1) {
    const wordKey = stroopColorKeys[Math.floor(random() * stroopColorKeys.length)]!;
    let inkKey = stroopColorKeys[Math.floor(random() * stroopColorKeys.length)]!;
    while (inkKey === wordKey) {
      inkKey = stroopColorKeys[Math.floor(random() * stroopColorKeys.length)]!;
    }
    rounds.push({ wordKey, inkKey });
  }
  return rounds;
}

export function ColorMatchGame({ onComplete, seed }: GameComponentProps) {
  const rounds = useMemo(() => buildRounds(seed), [seed]);
  const startAtRef = useRef(nowMs());
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const accent = gameAccents['color-match'];

  const round = rounds[roundIndex]!;
  const options = useMemo(
    () => shuffleWithSeed([...stroopColorKeys], seed + roundIndex + 11),
    [roundIndex, seed],
  );

  const handleSelect = (key: StroopColorKey) => {
    if (answered) return;
    setAnswered(true);
    const correct = key === round.inkKey;
    const nextCorrect = correct ? correctCount + 1 : correctCount;
    if (correct) haptics.success();
    else haptics.warning();

    setTimeout(
      () => {
        if (roundIndex >= ROUNDS - 1) {
          onComplete({
            gameId: 'color-match',
            score: Math.round((nextCorrect / ROUNDS) * 100),
            isSuccess: nextCorrect === ROUNDS,
            correct: nextCorrect === ROUNDS,
            durationMs: nowMs() - startAtRef.current,
            startedAt: startAtRef.current,
            completedAt: nowMs(),
            metadata: { correct: nextCorrect, total: ROUNDS },
          });
        } else {
          setCorrectCount(nextCorrect);
          setRoundIndex((i) => i + 1);
          setAnswered(false);
        }
      },
      correct ? 400 : 700,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Yazının RENGİ ne?</Text>
      <Text style={styles.sub}>Kelimenin anlamına değil, rengine bak.</Text>
      <Text style={[styles.word, { color: stroopColors[round.inkKey].hex }]}>
        {stroopColors[round.wordKey].label}
      </Text>
      <Text style={styles.round}>
        {roundIndex + 1} / {ROUNDS}
      </Text>
      <View style={styles.options}>
        {options.map((key) => (
          <OptionButton
            key={key}
            correct={answered && key === round.inkKey}
            disabled={answered}
            label={stroopColors[key].label}
            onPress={() => handleSelect(key)}
            style={{ borderColor: answered && key === round.inkKey ? accent : undefined }}
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
    gap: spacing.md,
  },
  prompt: {
    ...typography.heading,
    textAlign: 'center',
  },
  sub: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  word: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: spacing.xl,
    letterSpacing: 2,
  },
  round: {
    ...typography.label,
    textAlign: 'center',
    fontSize: 11,
  },
  options: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
});
