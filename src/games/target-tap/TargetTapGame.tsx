import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useOptionalCombo } from '@/session/combo-context';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';
import { playUiClick } from '@/utils/ui-click-sound';

const TARGET_COUNT = 5;
const PADDING = spacing.lg;

function targetSizeForDifficulty(difficulty: number): number {
  if (difficulty >= 3) return Math.max(28, touchTargetMin - 12);
  if (difficulty >= 2) return touchTargetMin - 4;
  return touchTargetMin + 8;
}

function timeoutMsForDifficulty(difficulty: number): number | null {
  if (difficulty >= 3) return 1100;
  if (difficulty >= 2) return 1600;
  return null;
}

/** Shrink targets further as combo climbs (Valorant-style pressure). */
function sizeWithCombo(baseSize: number, combo: number): number {
  if (combo < 3) return baseSize;
  const shrink = Math.min(0.35, (combo - 2) * 0.04);
  return Math.max(24, Math.round(baseSize * (1 - shrink)));
}

function randomPosition(
  random: () => number,
  areaWidth: number,
  areaHeight: number,
  targetSize: number,
): { x: number; y: number } {
  const maxX = Math.max(0, areaWidth - targetSize - PADDING);
  const maxY = Math.max(0, areaHeight - targetSize - PADDING);
  return {
    x: PADDING + random() * maxX,
    y: PADDING + random() * maxY,
  };
}

export function TargetTapGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const { width, height } = useWindowDimensions();
  const comboApi = useOptionalCombo();
  const startAtRef = useRef(nowMs());
  const tapTimesRef = useRef<number[]>([]);
  const lastTapRef = useRef(nowMs());
  const missCountRef = useRef(0);
  const tapIndexRef = useRef(0);
  const finishedRef = useRef(false);
  const random = useMemo(() => createSeededRandom(seed), [seed]);
  const spawnIdRef = useRef(0);

  const playAreaHeight = Math.min(height * 0.5, 400);
  const playAreaWidth = width - spacing.lg * 2;

  const baseSize = targetSizeForDifficulty(difficulty);
  const combo = comboApi?.currentCombo ?? 0;
  const targetSize = sizeWithCombo(baseSize, combo);
  const targetSizeRef = useRef(targetSize);
  targetSizeRef.current = targetSize;
  const targetTimeoutMs = timeoutMsForDifficulty(difficulty);

  const [tapIndex, setTapIndex] = useState(0);
  const [position, setPosition] = useState(() =>
    randomPosition(random, playAreaWidth, playAreaHeight, targetSize),
  );
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ avg: 0, best: 0 });
  const [spawnToken, setSpawnToken] = useState(0);

  const scale = useSharedValue(1);
  const accent = gameAccents['target-tap'];

  const animatedTargetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const spawnAtIndex = useCallback(
    (nextIndex: number) => {
      spawnIdRef.current += 1;
      tapIndexRef.current = nextIndex;
      setPosition(
        randomPosition(random, playAreaWidth, playAreaHeight, targetSizeRef.current),
      );
      setTapIndex(nextIndex);
      setSpawnToken((t) => t + 1);
      scale.value = 1;
    },
    [playAreaHeight, playAreaWidth, random, scale],
  );

  const finishGame = useCallback(
    (avg: number, best: number) => {
      finishedRef.current = true;
      setStats({ avg, best });
      setFinished(true);
      const isSuccess = missCountRef.current === 0;
      if (isSuccess) haptics.success();
      else haptics.warning();
      setTimeout(() => {
        onComplete({
          gameId: 'target-tap',
          score: Math.max(0, 1000 - avg - missCountRef.current * 40),
          isSuccess,
          correct: isSuccess,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: {
            avgMs: avg,
            bestMs: best,
            misses: missCountRef.current,
          },
        });
      }, 900);
    },
    [onComplete],
  );

  useEffect(() => {
    if (finished || targetTimeoutMs == null) return;
    const token = spawnIdRef.current;
    const timer = setTimeout(() => {
      if (finishedRef.current || spawnIdRef.current !== token) return;
      missCountRef.current += 1;
      haptics.warning();
      spawnAtIndex(tapIndexRef.current);
    }, targetTimeoutMs);
    return () => clearTimeout(timer);
    // Restart timer only when a new target spawns, not when combo/size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: spawnToken drives timeout window
  }, [finished, spawnToken, targetTimeoutMs]);

  const handleTap = () => {
    if (finishedRef.current) return;
    const now = nowMs();
    const delta = now - lastTapRef.current;
    tapTimesRef.current.push(delta);
    lastTapRef.current = now;

    haptics.light();
    playUiClick();

    scale.value = withSequence(
      withTiming(0.78, { duration: 70 }),
      withSpring(1, { damping: 14, stiffness: 280 }),
    );

    if (tapIndexRef.current + 1 >= TARGET_COUNT) {
      spawnIdRef.current += 1;
      const times = tapTimesRef.current.slice(1);
      const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      const best = times.length ? Math.min(...times) : 0;
      finishGame(avg, best);
    } else {
      setTimeout(() => spawnAtIndex(tapIndexRef.current + 1), 70);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hedefe dokun</Text>
      <Text style={styles.sub}>{finished ? 'Bitti' : `${tapIndex + 1} / ${TARGET_COUNT}`}</Text>

      <View style={[styles.playArea, { width: playAreaWidth, height: playAreaHeight }]}>
        {!finished ? (
          <Animated.View
            style={[
              styles.targetWrap,
              {
                left: position.x,
                top: position.y,
                width: targetSize,
                height: targetSize,
              },
              animatedTargetStyle,
            ]}
          >
            <Pressable
              onPress={handleTap}
              style={[
                styles.target,
                {
                  width: targetSize,
                  height: targetSize,
                  borderRadius: targetSize / 2,
                  backgroundColor: accent,
                },
              ]}
            />
          </Animated.View>
        ) : (
          <View style={styles.stats}>
            <Text style={[styles.statValue, { color: accent }]}>{stats.avg} ms</Text>
            <Text style={styles.statLabel}>Ortalama tap</Text>
            <Text style={styles.statSecondary}>En hızlı: {stats.best} ms</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
  },
  sub: {
    ...typography.label,
    fontSize: 11,
  },
  playArea: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    position: 'relative',
    overflow: 'hidden',
  },
  targetWrap: {
    position: 'absolute',
  },
  target: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  statValue: {
    ...typography.metric,
    fontSize: 40,
  },
  statLabel: {
    ...typography.label,
    fontSize: 11,
  },
  statSecondary: {
    ...typography.bodySmall,
  },
});
