import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { OptionButton } from '@/components/ui/OptionButton';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom, shuffleWithSeed } from '@/utils/seeded-random';

const DOT_SIZE = 14;
const ROUNDS = 2;

interface Dot {
  x: number;
  y: number;
}

function generateDots(count: number, seed: number, areaW: number, areaH: number): Dot[] {
  const random = createSeededRandom(seed);
  const dots: Dot[] = [];
  let attempts = 0;
  while (dots.length < count && attempts < 200) {
    attempts += 1;
    const x = DOT_SIZE + random() * (areaW - DOT_SIZE * 2);
    const y = DOT_SIZE + random() * (areaH - DOT_SIZE * 2);
    const overlaps = dots.some((d) => Math.hypot(d.x - x, d.y - y) < DOT_SIZE * 2.2);
    if (!overlaps) dots.push({ x, y });
  }
  return dots;
}

function buildOptions(correct: number, seed: number): number[] {
  const random = createSeededRandom(seed);
  const opts = new Set<number>([correct]);
  while (opts.size < 4) {
    const delta = Math.floor(random() * 5) - 2 || 1;
    const candidate = correct + delta;
    if (candidate >= 2 && candidate <= 12) opts.add(candidate);
  }
  return shuffleWithSeed([...opts], seed);
}

export function FlashCountGame({ onComplete, seed }: GameComponentProps) {
  const { width } = useWindowDimensions();
  const startAtRef = useRef(nowMs());
  const areaW = width - spacing.lg * 2;
  const areaH = 220;

  const rounds = useMemo(() => {
    const random = createSeededRandom(seed);
    return Array.from({ length: ROUNDS }, (_, i) => {
      const count = 4 + Math.floor(random() * 7);
      return {
        count,
        dots: generateDots(count, seed + i * 31, areaW, areaH),
        options: buildOptions(count, seed + i * 17),
      };
    });
  }, [areaH, areaW, seed]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<'flash' | 'guess' | 'feedback'>('flash');
  const [correctTotal, setCorrectTotal] = useState(0);
  const [answered, setAnswered] = useState(false);
  const accent = gameAccents['flash-count'];

  const round = rounds[roundIndex]!;

  useEffect(() => {
    if (phase !== 'flash') return;
    const t = setTimeout(() => setPhase('guess'), 750);
    return () => clearTimeout(t);
  }, [phase, roundIndex]);

  const handleSelect = (value: number) => {
    if (answered || phase !== 'guess') return;
    setAnswered(true);
    setPhase('feedback');
    const correct = value === round.count;
    const nextCorrect = correct ? correctTotal + 1 : correctTotal;
    if (correct) haptics.success();
    else haptics.warning();

    setTimeout(() => {
      if (roundIndex >= ROUNDS - 1) {
        onComplete({
          gameId: 'flash-count',
          score: Math.round((nextCorrect / ROUNDS) * 100),
          isSuccess: nextCorrect === ROUNDS,
          correct: nextCorrect === ROUNDS,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: { correct: nextCorrect, total: ROUNDS },
        });
      } else {
        setCorrectTotal(nextCorrect);
        setRoundIndex((i) => i + 1);
        setPhase('flash');
        setAnswered(false);
      }
    }, 700);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {phase === 'guess' || phase === 'feedback' ? 'Kaç taneydi?' : 'İzle…'}
      </Text>

      <View style={[styles.area, { width: areaW, height: areaH }]}>
        {phase === 'flash' &&
          round.dots.map((dot, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: dot.x,
                  top: dot.y,
                  backgroundColor: accent,
                },
              ]}
            />
          ))}
        {phase === 'feedback' ? (
          <Text style={[styles.reveal, { color: accent }]}>{round.count}</Text>
        ) : null}
      </View>

      {(phase === 'guess' || phase === 'feedback') && (
        <View style={styles.options}>
          {round.options.map((opt) => (
            <OptionButton
              key={opt}
              correct={phase === 'feedback' && opt === round.count}
              disabled={answered}
              label={String(opt)}
              onPress={() => handleSelect(opt)}
              style={styles.option}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
  },
  area: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  reveal: {
    ...typography.metric,
    alignSelf: 'center',
    marginTop: '40%',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  option: {
    width: '48%',
    flexGrow: 1,
  },
});
