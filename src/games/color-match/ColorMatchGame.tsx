import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { stroopColorKeys, stroopColors, type StroopColorKey } from '@/content/color-match';
import type { GameComponentProps } from '@/types/game';
import { colors, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';

const ROUNDS = 3;
const TILE_ORDER: StroopColorKey[] = ['red', 'blue', 'green', 'yellow'];

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
  const [answered, setAnswered] = useState<StroopColorKey | null>(null);
  const wordScale = useSharedValue(1);
  const wordShake = useSharedValue(0);

  const round = rounds[roundIndex]!;

  useEffect(() => {
    wordScale.value = 0.96;
    wordScale.value = withTiming(1, { duration: 120 });
    wordShake.value = 0;
  }, [roundIndex, wordScale, wordShake]);

  const wordStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wordScale.value }, { translateX: wordShake.value }],
  }));

  const handleSelect = (key: StroopColorKey) => {
    if (answered) return;
    setAnswered(key);
    const correct = key === round.inkKey;
    const nextCorrect = correct ? correctCount + 1 : correctCount;
    if (correct) {
      wordScale.value = withSequence(
        withTiming(1.06, { duration: 90 }),
        withTiming(1, { duration: 110 }),
      );
      haptics.success();
    } else {
      wordShake.value = withSequence(
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-5, { duration: 40 }),
        withTiming(0, { duration: 50 }),
      );
      haptics.warning();
    }

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
          setAnswered(null);
        }
      },
      correct ? 220 : 280,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>YAZININ RENGİ?</Text>
      <Animated.Text
        style={[styles.word, { color: stroopColors[round.inkKey].hex }, wordStyle]}
      >
        {stroopColors[round.wordKey].label}
      </Animated.Text>

      <View style={styles.grid}>
        {TILE_ORDER.map((key) => (
          <ColorTile
            key={`${roundIndex}-${key}`}
            colorKey={key}
            disabled={answered != null}
            onPress={() => handleSelect(key)}
            state={
              answered == null
                ? 'idle'
                : key === round.inkKey
                  ? 'correct'
                  : answered === key
                    ? 'wrong'
                    : 'idle'
            }
          />
        ))}
      </View>
    </View>
  );
}

function ColorTile({
  colorKey,
  onPress,
  disabled,
  state,
}: {
  colorKey: StroopColorKey;
  onPress: () => void;
  disabled: boolean;
  state: 'idle' | 'correct' | 'wrong';
}) {
  const scale = useSharedValue(1);
  const color = stroopColors[colorKey];

  useEffect(() => {
    if (state === 'correct') {
      scale.value = withSequence(
        withTiming(1.04, { duration: 90 }),
        withTiming(1, { duration: 110 }),
      );
    }
  }, [scale, state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrap, animatedStyle]}>
      <Pressable
        accessibilityLabel={color.label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: 80 });
        }}
        onPressOut={() => {
          if (state === 'idle') scale.value = withTiming(1, { duration: 100 });
        }}
        style={[
          styles.tile,
          {
            borderColor: state === 'wrong' ? colors.error : color.hex,
            backgroundColor: `${color.hex}22`,
          },
        ]}
      >
        <Text style={[styles.tileLabel, { color: color.hex }]}>{color.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  prompt: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  word: {
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    letterSpacing: 1,
  },
  grid: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tileWrap: {
    width: '48%',
    flexGrow: 1,
  },
  tile: {
    minHeight: Math.max(72, touchTargetMin),
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  tileLabel: {
    ...typography.button,
    fontSize: 14,
    letterSpacing: 1,
  },
});
