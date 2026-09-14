/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GameHint } from '@/components/game/GameHint';
import { feel, motionMs } from '@/game-feel';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { createSeededRandom } from '@/utils/seeded-random';
import { nowMs } from '@/utils/time';

const ROUNDS = 3;
const TRACK_PAD = 16;

export function StopTheLineGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const random = useMemo(() => createSeededRandom(seed), [seed]);
  const accent = gameAccents['stop-the-line'];
  const startAtRef = useRef(nowMs());
  const doneRef = useRef(false);

  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<'run' | 'result' | 'done'>('run');
  const [lastScore, setLastScore] = useState(0);
  const [trackW, setTrackW] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [zonePulse, setZonePulse] = useState(false);

  const marker = useSharedValue(0);
  const direction = useSharedValue(1);
  const markerX = useSharedValue(0);

  const zoneWidthRatio = difficulty >= 3 ? 0.12 : difficulty >= 2 ? 0.16 : 0.2;
  const zoneCenter = useMemo(() => {
    void round;
    return 0.28 + random() * 0.44;
  }, [random, round]);

  const duration = 2200 - Math.min(600, difficulty * 150) - round * 120;

  useEffect(() => {
    if (phase !== 'run' || trackW <= 0) return;
    marker.value = 0;
    direction.value = 1;
    markerX.value = 0;
    cancelAnimation(marker);
    marker.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [direction, duration, marker, markerX, phase, trackW]);

  useAnimatedReaction(
    () => marker.value,
    (v) => {
      markerX.value = v;
    },
  );

  const finishAll = (finalScores: number[]) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const avg = Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length);
    setPhase('done');
    setTimeout(() => {
      onComplete({
        gameId: 'stop-the-line',
        score: avg,
        isSuccess: avg >= 70,
        correct: avg >= 70,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { accuracy: avg, rounds: finalScores },
      });
    }, motionMs.completion);
  };

  const handleTap = () => {
    if (phase !== 'run' || trackW <= 0) return;
    setHintVisible(false);
    cancelAnimation(marker);
    const pos = marker.value;
    const half = zoneWidthRatio / 2;
    const dist = Math.abs(pos - zoneCenter);
    const maxDist = Math.max(half, 0.5);
    const accuracy = Math.max(0, Math.round((1 - dist / maxDist) * 100));
    const inZone = dist <= half;
    setLastScore(accuracy);
    setPhase('result');
    if (accuracy >= 95) {
      setZonePulse(true);
      feel.perfect();
    } else if (inZone) feel.correct();
    else feel.warning();

    const nextScores = [...scores, accuracy];
    setScores(nextScores);

    setTimeout(() => {
      setZonePulse(false);
      if (round + 1 >= ROUNDS) {
        finishAll(nextScores);
      } else {
        setRound((r) => r + 1);
        setPhase('run');
      }
    }, 550);
  };

  const markerStyle = useAnimatedStyle(() => ({
    left: TRACK_PAD + markerX.value * Math.max(0, trackW - TRACK_PAD * 2),
  }));

  const avg =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : lastScore;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DURDUR</Text>
      <GameHint gameId="stop-the-line" text="Hedefte dokun." visible={hintVisible} />

      <Pressable onPress={handleTap} style={styles.area} accessibilityLabel="Durdur">
        <View
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          style={styles.track}
        >
          <View style={styles.line} />
          {trackW > 0 ? (
            <View
              style={[
                styles.zone,
                zonePulse && styles.zonePulse,
                {
                  left:
                    TRACK_PAD +
                    (zoneCenter - zoneWidthRatio / 2) * (trackW - TRACK_PAD * 2),
                  width: zoneWidthRatio * (trackW - TRACK_PAD * 2),
                  borderColor: accent,
                  backgroundColor: `${accent}33`,
                },
              ]}
            />
          ) : null}
          <Animated.View style={[styles.marker, { backgroundColor: accent }, markerStyle]} />
        </View>

        {phase === 'result' || phase === 'done' ? (
          <Text style={[styles.score, { color: accent }]}>%{lastScore || avg}</Text>
        ) : (
          <Text style={styles.roundHint}>{round + 1}/{ROUNDS}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
  area: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  track: {
    height: 64,
    justifyContent: 'center',
  },
  line: {
    height: 2,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: TRACK_PAD,
  },
  zone: {
    position: 'absolute',
    top: 18,
    height: 28,
    borderWidth: 1,
    borderRadius: 4,
  },
  zonePulse: {
    transform: [{ scaleY: 1.15 }],
  },
  marker: {
    position: 'absolute',
    top: 14,
    width: 4,
    height: 36,
    marginLeft: -2,
    borderRadius: 2,
  },
  score: {
    ...typography.metric,
    fontSize: 48,
    textAlign: 'center',
  },
  roundHint: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
