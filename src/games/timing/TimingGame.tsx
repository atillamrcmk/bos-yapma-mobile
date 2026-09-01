import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameComponentProps } from '@/types/game';
import { Button } from '@/components/ui/Button';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { pickFromSeed } from '@/utils/seeded-random';

type Phase = 'ready' | 'running' | 'result';

const TARGETS_SEC = [2, 3, 4];

export function TimingGame({ onComplete, seed }: GameComponentProps) {
  const targetSec = pickFromSeed(TARGETS_SEC, seed);
  const startAtRef = useRef(nowMs());
  const runStartRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [elapsedSec, setElapsedSec] = useState(0);
  const accent = gameAccents.timing;

  const handleStart = () => {
    runStartRef.current = nowMs();
    setPhase('running');
    haptics.light();
  };

  const handleTap = () => {
    if (phase !== 'running') return;
    const elapsed = (nowMs() - runStartRef.current) / 1000;
    const diff = elapsed - targetSec;
    setElapsedSec(elapsed);
    setPhase('result');
    haptics.success();

    const absDiff = Math.abs(diff);
    const message =
      absDiff <= 0.1 ? 'Çok yakındın.' : absDiff <= 0.25 ? 'İyi zamanlama.' : 'Bir dahaki sefere.';

    setTimeout(() => {
      onComplete({
        gameId: 'timing',
        score: Math.max(0, Math.round(100 - absDiff * 100)),
        correct: absDiff <= 0.3,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { targetSec, elapsedSec: elapsed, diff, message },
      });
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>İçinden say</Text>
      <Text style={styles.sub}>Hedef: {targetSec.toFixed(2)} sn</Text>

      {phase === 'ready' ? (
        <Button label="Başlat" onPress={handleStart} style={styles.cta} />
      ) : phase === 'running' ? (
        <Pressable onPress={handleTap} style={[styles.tapZone, { borderColor: accent }]}>
          <Text style={[styles.tapLabel, { color: accent }]}>DOKUN</Text>
          <Text style={styles.tapHint}>Hedef sürede bas</Text>
        </Pressable>
      ) : (
        <View style={styles.result}>
          <Text style={[styles.resultValue, { color: accent }]}>{elapsedSec.toFixed(2)} sn</Text>
          <Text style={styles.diff}>
            {elapsedSec - targetSec >= 0 ? '+' : ''}
            {(elapsedSec - targetSec).toFixed(2)}
          </Text>
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
    gap: spacing.lg,
  },
  title: {
    ...typography.heading,
  },
  sub: {
    ...typography.body,
  },
  cta: {
    marginTop: spacing.xxl,
    width: '100%',
  },
  tapZone: {
    flex: 1,
    alignSelf: 'stretch',
    marginVertical: spacing.xl,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 200,
  },
  tapLabel: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  tapHint: {
    ...typography.bodySmall,
  },
  result: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  resultValue: {
    ...typography.metric,
  },
  diff: {
    ...typography.heading,
    color: colors.textMuted,
  },
});
