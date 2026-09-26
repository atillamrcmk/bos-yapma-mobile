import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { Button } from '@/components/ui/Button';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { pickFromSeed } from '@/utils/seeded-random';

type Phase = 'ready' | 'running' | 'result';

const TARGETS_SEC = [2, 3, 4];
const WINDOW_SEC = 1.5;
const MARKER_SIZE = 12;

export function TimingGame({ onComplete, seed }: GameComponentProps) {
  const targetSec = pickFromSeed(TARGETS_SEC, seed);
  const startAtRef = useRef(nowMs());
  const runStartRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [detail, setDetail] = useState('');
  const accent = gameAccents.timing;
  const markerX = useSharedValue(0.5);

  const handleStart = () => {
    runStartRef.current = nowMs();
    setPhase('running');
    haptics.light();
  };

  const handleTap = () => {
    if (phase !== 'running') return;
    const elapsed = (nowMs() - runStartRef.current) / 1000;
    const diff = elapsed - targetSec;
    const absDiff = Math.abs(diff);
    const t = Math.min(1, Math.max(0, 0.5 + diff / (WINDOW_SEC * 2)));
    markerX.value = withTiming(t, { duration: 220 });
    setElapsedSec(elapsed);
    setPhase('result');

    const direction = diff < 0 ? 'erken' : 'geç';
    let line = `${absDiff.toFixed(2)} sn ${direction}`;
    let note = '';
    if (absDiff <= 0.08) {
      line = 'Tam isabet sayılır.';
      note = '';
      haptics.medium();
    } else if (absDiff <= 0.18) {
      note = 'Çok yakındın.';
      haptics.success();
    } else {
      haptics.warning();
    }
    setFeedback(line);
    setDetail(note);

    setTimeout(() => {
      onComplete({
        gameId: 'timing',
        score: Math.max(0, Math.round(100 - absDiff * 100)),
        isSuccess: absDiff <= 0.3,
        correct: absDiff <= 0.3,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { targetSec, elapsedSec: elapsed, absDiff, diff },
      });
    }, 700);
  };

  const markerStyle = useAnimatedStyle(() => ({
    left: `${markerX.value * 100}%`,
    transform: [{ translateX: -MARKER_SIZE / 2 }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>HEDEF</Text>
      <Text style={[styles.target, { color: accent }]}>{targetSec.toFixed(2)} sn</Text>
      <Text style={styles.hint}>İçinden say ve dokun.</Text>

      {phase === 'ready' ? (
        <Button label="Başlat" onPress={handleStart} style={styles.cta} />
      ) : phase === 'running' ? (
        <Pressable
          accessibilityLabel="Hedef sürede dokun"
          accessibilityRole="button"
          onPress={handleTap}
          style={({ pressed }) => [
            styles.tapZone,
            { borderColor: accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.tapLabel, { color: accent }]}>DOKUN</Text>
        </Pressable>
      ) : (
        <View style={styles.result}>
          <Text style={[styles.resultValue, { color: accent }]}>{elapsedSec.toFixed(2)} sn</Text>
          <Text style={styles.feedback}>{feedback}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}

          <View style={styles.axisBlock} accessibilityLabel="Erken, hedef, geç">
            <View style={styles.axisTrack}>
              <View style={[styles.targetTick, { backgroundColor: accent }]} />
              <Animated.View style={[styles.marker, { backgroundColor: accent }, markerStyle]} />
            </View>
            <View style={styles.axisLabels}>
              <Text style={styles.axisLabel}>erken</Text>
              <Text style={styles.axisLabel}>hedef</Text>
              <Text style={styles.axisLabel}>geç</Text>
            </View>
          </View>
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
    alignItems: 'center',
  },
  kicker: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 2,
  },
  target: {
    ...typography.metric,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.body,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  cta: {
    marginTop: spacing.xxl,
    width: '100%',
  },
  tapZone: {
    flex: 1,
    alignSelf: 'stretch',
    marginVertical: spacing.xl,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tapLabel: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  result: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.md,
  },
  resultValue: {
    ...typography.metric,
  },
  feedback: {
    ...typography.heading,
    fontSize: 20,
    textAlign: 'center',
  },
  detail: {
    ...typography.body,
  },
  axisBlock: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  axisTrack: {
    height: 2,
    backgroundColor: colors.borderSubtle,
    justifyContent: 'center',
  },
  targetTick: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 14,
    marginLeft: -1,
    top: -6,
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    top: -5,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.textMuted,
  },
});
