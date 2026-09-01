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

function scoreEstimate(user: number, target: number, min: number, max: number): number {
  const range = max - min || 1;
  const error = Math.abs(user - target) / range;
  return Math.round(Math.max(0, (1 - error) * 100));
}

export function EstimateGame({ onComplete, seed }: GameComponentProps) {
  const question = useMemo(() => pickFromSeed(estimateQuestions, seed), [seed]);
  const startAtRef = useRef(nowMs());
  const trackWidthRef = useRef(0);
  const completingRef = useRef(false);

  const range = question.max - question.min;
  const initialValue = Math.round((question.min + question.max) / 2);

  const [phase, setPhase] = useState<Phase>('input');
  const [userValue, setUserValue] = useState(initialValue);
  const [thumbX, setThumbX] = useState(0);
  const [feedback, setFeedback] = useState('');

  const accent = gameAccents.estimate;

  const valueFromX = useCallback(
    (x: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) return initialValue;
      const clamped = Math.max(0, Math.min(width, x));
      const ratio = clamped / width;
      return Math.round(question.min + ratio * range);
    },
    [initialValue, question.min, range],
  );

  const applyX = useCallback(
    (x: number) => {
      const width = trackWidthRef.current;
      const clamped = Math.max(0, Math.min(width, x));
      setThumbX(clamped);
      setUserValue(valueFromX(clamped));
    },
    [valueFromX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          haptics.selection();
          applyX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          applyX(evt.nativeEvent.locationX);
        },
      }),
    [applyX],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    const ratio = (initialValue - question.min) / (range || 1);
    setThumbX(ratio * width);
  };

  const handleSubmit = () => {
    if (completingRef.current) return;
    completingRef.current = true;

    const accuracy = scoreEstimate(userValue, question.target, question.min, question.max);
    const diff = Math.abs(userValue - question.target);
    const message =
      diff <= range * 0.05
        ? 'Neredeyse tam isabet.'
        : diff <= range * 0.15
          ? 'Oldukça yakındın.'
          : diff <= range * 0.3
            ? 'Fena değil.'
            : 'Bir dahaki sefere.';

    setFeedback(message);
    setPhase('result');
    haptics.success();

    setTimeout(() => {
      onComplete({
        gameId: 'estimate',
        score: accuracy,
        correct: accuracy >= 70,
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
    }, 1800);
  };

  const fillWidth = Math.max(0, thumbX);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question.question}</Text>

      {phase === 'input' ? (
        <>
          <Text style={[styles.liveValue, { color: accent }]}>
            {userValue}
            {question.unit ? ` ${question.unit}` : ''}
          </Text>

          <View style={styles.sliderSection}>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabel}>{question.min}</Text>
              <Text style={styles.rangeLabel}>{question.max}</Text>
            </View>
            <View
              {...panResponder.panHandlers}
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
                    transform: [{ translateX: thumbX - THUMB_SIZE / 2 }],
                  },
                ]}
              />
            </View>
          </View>

          <Button label="Tahmin Et" onPress={handleSubmit} style={styles.submit} />
        </>
      ) : (
        <View style={styles.resultBlock}>
          <Text style={[styles.resultValue, { color: accent }]}>
            {userValue}
            {question.unit ? ` ${question.unit}` : ''}
          </Text>
          <Text style={styles.feedback}>{feedback}</Text>
          <Text style={styles.targetLabel}>
            Gerçek cevap: {question.target}
            {question.unit ? ` ${question.unit}` : ''}
          </Text>
          <Text style={styles.fact}>{question.fact}</Text>
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
    height: 44,
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
    top: 8,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
  },
  submit: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
  resultBlock: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  resultValue: {
    ...typography.metric,
  },
  feedback: {
    ...typography.heading,
    fontSize: 20,
  },
  targetLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  fact: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
  },
});
