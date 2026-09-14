import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';

import { estimateQuestions } from '@/content/estimate';
import type { GameComponentProps } from '@/types/game';
import { Button } from '@/components/ui/Button';
import { colors, gameAccents, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { pickFromSeed } from '@/utils/seeded-random';

type Phase = 'input' | 'result';

const THUMB_SIZE = 28;
const SUCCESS_PROXIMITY = 85;

function proximityScore(user: number, target: number): number {
  const denom = Math.abs(target) || 1;
  const relativeError = Math.abs(user - target) / denom;
  return Math.round(Math.max(0, (1 - relativeError) * 100));
}

export function EstimateGame({ onComplete, seed }: GameComponentProps) {
  const question = useMemo(() => pickFromSeed(estimateQuestions, seed), [seed]);
  const startAtRef = useRef(nowMs());
  const completingRef = useRef(false);

  const range = question.max - question.min;
  const initialValue = Math.round((question.min + question.max) / 2);

  const [phase, setPhase] = useState<Phase>('input');
  const [userValue, setUserValue] = useState(initialValue);
  const [thumbX, setThumbX] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbPressed, setThumbPressed] = useState(false);
  const accent = gameAccents.estimate;

  const valueFromX = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return initialValue;
      const clamped = Math.max(0, Math.min(trackWidth, x));
      const ratio = clamped / trackWidth;
      return Math.round(question.min + ratio * range);
    },
    [initialValue, question.min, range, trackWidth],
  );

  const applyX = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const clamped = Math.max(0, Math.min(trackWidth, x));
      setThumbX(clamped);
      setUserValue(valueFromX(clamped));
    },
    [trackWidth, valueFromX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => phase === 'input',
        onMoveShouldSetPanResponder: () => phase === 'input',
        onPanResponderGrant: (evt) => {
          if (phase !== 'input') return;
          haptics.selection();
          setThumbPressed(true);
          applyX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          if (phase !== 'input') return;
          applyX(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          setThumbPressed(false);
        },
        onPanResponderTerminate: () => {
          setThumbPressed(false);
        },
      }),
    [applyX, phase],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    if (phase === 'input' && thumbX === 0) {
      const ratio = (initialValue - question.min) / (range || 1);
      setThumbX(ratio * width);
    }
  };

  const handleSubmit = () => {
    if (completingRef.current) return;
    completingRef.current = true;

    const accuracy = proximityScore(userValue, question.target);
    const isSuccess = accuracy >= SUCCESS_PROXIMITY;

    setPhase('result');
    if (isSuccess) haptics.success();
    else haptics.warning();

    setTimeout(() => {
      onComplete({
        gameId: 'estimate',
        score: accuracy,
        isSuccess,
        correct: isSuccess,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: {
          userValue,
          target: question.target,
          accuracy,
          fact: question.fact,
        },
      });
    }, 900);
  };

  const fillWidth = Math.max(0, thumbX);
  const targetX =
    trackWidth > 0 ? ((question.target - question.min) / (range || 1)) * trackWidth : 0;
  const delta = Math.abs(userValue - question.target);
  const unit = question.unit ? ` ${question.unit}` : '';

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question.question}</Text>

      <Text style={[styles.liveValue, { color: accent }]}>
        {userValue}
        {unit}
      </Text>

      <View style={styles.sliderSection}>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>{question.min}</Text>
          <Text style={styles.rangeLabel}>{question.max}</Text>
        </View>
        <View
          {...(phase === 'input' ? panResponder.panHandlers : {})}
          onLayout={onTrackLayout}
          style={styles.trackContainer}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { backgroundColor: accent, width: fillWidth }]} />
          </View>
          <View
            style={[
              styles.thumb,
              {
                borderColor: accent,
                transform: [
                  { translateX: thumbX - THUMB_SIZE / 2 },
                  { scale: thumbPressed ? 1.12 : 1 },
                ],
              },
            ]}
          />
          {phase === 'result' ? (
            <View
              style={[
                styles.targetMarker,
                {
                  backgroundColor: colors.textPrimary,
                  transform: [{ translateX: targetX - 1 }],
                },
              ]}
            />
          ) : null}
        </View>
      </View>

      {phase === 'input' ? (
        <Button label="Tahmin Et" onPress={handleSubmit} style={styles.submit} />
      ) : (
        <View style={styles.resultBlock}>
          <Text style={styles.delta}>{delta} fark.</Text>
          <Text style={styles.fact} numberOfLines={2}>
            {question.fact}
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
    gap: spacing.lg,
  },
  question: {
    ...typography.heading,
    lineHeight: 30,
  },
  liveValue: {
    ...typography.metric,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  sliderSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    ...typography.bodySmall,
    fontVariant: ['tabular-nums'],
  },
  trackContainer: {
    height: 48,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    backgroundColor: colors.borderSubtle,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: radius.full,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
  },
  targetMarker: {
    position: 'absolute',
    top: 8,
    width: 2,
    height: 32,
    borderRadius: 1,
  },
  submit: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
  resultBlock: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  delta: {
    ...typography.heading,
    fontSize: 22,
  },
  fact: {
    ...typography.bodySmall,
  },
});
