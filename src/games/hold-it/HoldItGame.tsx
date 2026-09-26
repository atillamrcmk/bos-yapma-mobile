/* Reanimated shared values are mutated from press handlers. */
/* eslint-disable react-hooks/immutability */
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { pickFromSeed } from '@/utils/seeded-random';

type Phase = 'ready' | 'holding' | 'result';

const TARGETS_SEC = [2, 2.5, 3];

export function HoldItGame({ onComplete, seed }: GameComponentProps) {
  const targetSec = pickFromSeed(TARGETS_SEC, seed);
  const startAtRef = useRef(nowMs());
  const holdStartRef = useRef(0);
  const holdingRef = useRef(false);
  const finishedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [heldSec, setHeldSec] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [detail, setDetail] = useState('');
  const accent = gameAccents['hold-it'];

  const scale = useSharedValue(1);
  const fill = useSharedValue(0);

  const padStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + fill.value * 0.22,
  }));

  const beginHold = () => {
    if (finishedRef.current || holdingRef.current) return;
    holdingRef.current = true;
    holdStartRef.current = nowMs();
    setPhase('holding');
    haptics.selection();
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.98, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    fill.value = 0;
    fill.value = withTiming(1, { duration: 8000, easing: Easing.linear });
  };

  const endHold = () => {
    if (finishedRef.current || !holdingRef.current) return;
    holdingRef.current = false;
    finishedRef.current = true;
    cancelAnimation(scale);
    cancelAnimation(fill);
    scale.value = withTiming(1, { duration: 100 });
    fill.value = withTiming(0, { duration: 160 });

    const held = (nowMs() - holdStartRef.current) / 1000;
    const diff = held - targetSec;
    const absDiff = Math.abs(diff);
    const direction = diff < 0 ? 'erken' : 'geç';
    setHeldSec(held);

    let line = `${absDiff.toFixed(2)} sn ${direction}`;
    let note = '';
    if (absDiff <= 0.08) {
      line = 'Tam isabet sayılır.';
      haptics.medium();
    } else if (absDiff <= 0.18) {
      note = 'Çok yakındın.';
      haptics.success();
    } else {
      haptics.warning();
    }
    setFeedback(line);
    setDetail(note);
    setPhase('result');

    setTimeout(() => {
      onComplete({
        gameId: 'hold-it',
        score: Math.max(0, Math.round(100 - absDiff * 100)),
        isSuccess: absDiff <= 0.3,
        correct: absDiff <= 0.3,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { targetSec, heldSec: held, absDiff, diff },
      });
    }, 700);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>TUT</Text>
      <Text style={[styles.target, { color: accent }]}>{targetSec.toFixed(2)} sn</Text>
      <Text style={styles.hint}>Parmağını basılı tut. Süre görünmez.</Text>

      {phase === 'result' ? (
        <View style={styles.result}>
          <Text style={[styles.resultValue, { color: accent }]}>{heldSec.toFixed(2)} sn</Text>
          <Text style={styles.feedback}>{feedback}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
      ) : (
        <Animated.View style={[styles.padWrap, padStyle]}>
          <Pressable
            accessibilityLabel={`${targetSec.toFixed(2)} saniye basılı tut`}
            accessibilityRole="button"
            delayLongPress={10_000}
            onPressIn={beginHold}
            onPressOut={endHold}
            style={styles.pad}
          >
            <Animated.View style={[styles.fill, { backgroundColor: accent }, fillStyle]} />
            <Text style={[styles.padLabel, { color: accent }]}>
              {phase === 'holding' ? 'TUT' : 'BASILI TUT'}
            </Text>
          </Pressable>
        </Animated.View>
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
    textAlign: 'center',
  },
  padWrap: {
    flex: 1,
    alignSelf: 'stretch',
    marginVertical: spacing.lg,
    minHeight: 220,
  },
  pad: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: touchTargetMin * 4,
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  padLabel: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
  },
  result: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
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
});
