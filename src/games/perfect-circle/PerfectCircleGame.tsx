/* eslint-disable react-hooks/immutability */
import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  type SkPath,
} from '@shopify/react-native-skia';

import { GameHint } from '@/components/game/GameHint';
import { feel, motionMs } from '@/game-feel';
import {
  calculateCircleScore,
  type Point,
} from '@/games/perfect-circle/geometry';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { nowMs } from '@/utils/time';

export function PerfectCircleGame({ onComplete, seed }: GameComponentProps) {
  void seed;
  const accent = gameAccents['perfect-circle'];
  const startAtRef = useRef(nowMs());
  const doneRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [path, setPath] = useState<SkPath | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateCircleScore> | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const drawing = useSharedValue(false);

  const livePath = useMemo(() => Skia.Path.Make(), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const bumpPath = () => {
    setPath(livePath.copy());
  };

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const scored = calculateCircleScore(pointsRef.current);
    setResult(scored);
    if (scored.score >= 90) feel.perfect();
    else if (scored.score >= 70) feel.correct();
    else feel.warning();

    const label =
      scored.score >= 92 ? 'TEMİZ.' : scored.score >= 75 ? 'YAKINDI.' : 'AZ KALDI.';

    setTimeout(() => {
      onComplete({
        gameId: 'perfect-circle',
        score: Math.round(scored.score),
        isSuccess: scored.score >= 70,
        correct: scored.score >= 70,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: {
          circleScore: scored.score,
          label,
          meanRadius: scored.meanRadius,
          angularCoverage: scored.angularCoverage,
        },
      });
    }, motionMs.completion + 250);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      if (doneRef.current) return;
      drawing.value = true;
      pointsRef.current = [{ x: e.x, y: e.y }];
      livePath.reset();
      livePath.moveTo(e.x, e.y);
      setHintVisible(false);
      bumpPath();
    })
    .onUpdate((e) => {
      if (!drawing.value || doneRef.current) return;
      pointsRef.current.push({ x: e.x, y: e.y });
      livePath.lineTo(e.x, e.y);
      bumpPath();
    })
    .onEnd(() => {
      drawing.value = false;
      finish();
    });

  const feedback =
    result == null
      ? null
      : result.score >= 92
        ? 'TEMİZ.'
        : result.score >= 75
          ? 'YAKINDI.'
          : 'AZ KALDI.';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DAİRE ÇİZ</Text>
      <Text style={styles.sub}>Tek hareket.</Text>
      <GameHint gameId="perfect-circle" text="Tek hareketle daire çiz." visible={hintVisible} />

      <GestureDetector gesture={pan}>
        <View onLayout={onLayout} style={styles.stage}>
          {size.width > 0 ? (
            <Canvas style={StyleSheet.absoluteFill}>
              {path ? (
                <Path path={path} color={accent} style="stroke" strokeWidth={3} strokeJoin="round" strokeCap="round" />
              ) : null}
              {result ? (
                <Circle
                  cx={result.center.x}
                  cy={result.center.y}
                  r={result.meanRadius}
                  color={`${accent}55`}
                  style="stroke"
                  strokeWidth={1.5}
                />
              ) : null}
            </Canvas>
          ) : null}

          {result ? (
            <View style={styles.result} pointerEvents="none">
              <Text style={[styles.score, { color: accent }]}>{result.score.toFixed(1)}%</Text>
              <Text style={styles.feedback}>{feedback}</Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>
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
  sub: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  stage: {
    flex: 1,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    overflow: 'hidden',
  },
  result: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    ...typography.metric,
    fontSize: 52,
  },
  feedback: {
    ...typography.heading,
    marginTop: spacing.sm,
  },
});
