import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';

const TARGET_COUNT = 5;
const TARGET_SIZE = touchTargetMin + 8;
const PADDING = spacing.lg;

function randomPosition(
  random: () => number,
  areaWidth: number,
  areaHeight: number,
): { x: number; y: number } {
  const maxX = Math.max(0, areaWidth - TARGET_SIZE - PADDING);
  const maxY = Math.max(0, areaHeight - TARGET_SIZE - PADDING);
  return {
    x: PADDING + random() * maxX,
    y: PADDING + random() * maxY,
  };
}

export function TargetTapGame({ onComplete, seed }: GameComponentProps) {
  const { width, height } = useWindowDimensions();
  const startAtRef = useRef(nowMs());
  const tapTimesRef = useRef<number[]>([]);
  const lastTapRef = useRef(nowMs());
  const random = useMemo(() => createSeededRandom(seed), [seed]);

  const playAreaHeight = Math.min(height * 0.5, 400);
  const playAreaWidth = width - spacing.lg * 2;

  const [tapIndex, setTapIndex] = useState(0);
  const [position, setPosition] = useState(() =>
    randomPosition(random, playAreaWidth, playAreaHeight),
  );
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ avg: 0, best: 0 });

  const accent = gameAccents['target-tap'];

  const spawnNext = useCallback(
    (nextIndex: number) => {
      setPosition(randomPosition(random, playAreaWidth, playAreaHeight));
      setTapIndex(nextIndex);
    },
    [playAreaHeight, playAreaWidth, random],
  );

  const handleTap = () => {
    if (finished) return;
    const now = nowMs();
    const delta = now - lastTapRef.current;
    tapTimesRef.current.push(delta);
    lastTapRef.current = now;
    haptics.light();

    if (tapIndex + 1 >= TARGET_COUNT) {
      const times = tapTimesRef.current.slice(1);
      const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      const best = times.length ? Math.min(...times) : 0;
      setStats({ avg, best });
      setFinished(true);
      haptics.success();
      setTimeout(() => {
        onComplete({
          gameId: 'target-tap',
          score: Math.max(0, 1000 - avg),
          correct: true,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: { avgMs: avg, bestMs: best },
        });
      }, 900);
    } else {
      spawnNext(tapIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hedefe dokun</Text>
      <Text style={styles.sub}>{finished ? 'Bitti' : `${tapIndex + 1} / ${TARGET_COUNT}`}</Text>

      <View style={[styles.playArea, { width: playAreaWidth, height: playAreaHeight }]}>
        {!finished ? (
          <Pressable
            onPress={handleTap}
            style={[
              styles.target,
              {
                left: position.x,
                top: position.y,
                width: TARGET_SIZE,
                height: TARGET_SIZE,
                borderRadius: TARGET_SIZE / 2,
                backgroundColor: accent,
              },
            ]}
          />
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
  target: {
    position: 'absolute',
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
