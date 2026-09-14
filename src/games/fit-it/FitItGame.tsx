/* eslint-disable react-hooks/immutability */
import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GameHint } from '@/components/game/GameHint';
import { feel, motionMs } from '@/game-feel';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { createSeededRandom } from '@/utils/seeded-random';
import { nowMs } from '@/utils/time';

type ShapeKind = 'L' | 'T' | 'bar' | 'square' | 'triangle' | 'plus' | 'U' | 'Z';

interface ShapeConfig {
  kind: ShapeKind;
  size: number;
}

const SHAPES: ShapeKind[] = ['L', 'T', 'bar', 'square', 'triangle', 'plus', 'U', 'Z'];

function ShapeVisual({
  kind,
  size,
  color,
  outline,
}: {
  kind: ShapeKind;
  size: number;
  color: string;
  outline?: boolean;
}) {
  const u = size / 3;
  const fill = outline ? 'transparent' : color;
  const border = outline ? color : 'transparent';
  const bw = outline ? 2 : 0;

  if (kind === 'square') {
    return (
      <View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          backgroundColor: fill,
          borderColor: border,
          borderWidth: bw,
        }}
      />
    );
  }
  if (kind === 'bar') {
    return (
      <View
        style={{
          width: size,
          height: u,
          backgroundColor: fill,
          borderColor: border,
          borderWidth: bw,
        }}
      />
    );
  }
  if (kind === 'triangle') {
    return (
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.4,
          borderRightWidth: size * 0.4,
          borderBottomWidth: size * 0.7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: outline ? 'transparent' : color,
          borderStyle: 'solid',
        }}
      />
    );
  }
  if (kind === 'plus') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            width: size,
            height: u,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: u,
            height: size,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
      </View>
    );
  }
  if (kind === 'L') {
    return (
      <View style={{ width: size * 0.7, height: size * 0.7 }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: u,
            height: size * 0.7,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: size * 0.7,
            height: u,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
      </View>
    );
  }
  if (kind === 'T') {
    return (
      <View style={{ width: size, height: size * 0.75 }}>
        <View
          style={{
            width: size,
            height: u,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
        <View
          style={{
            alignSelf: 'center',
            width: u,
            height: size * 0.55,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
      </View>
    );
  }
  if (kind === 'U') {
    return (
      <View style={{ width: size * 0.75, height: size * 0.7 }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            width: u,
            height: size * 0.7,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: u,
            height: size * 0.7,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: u,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: bw,
          }}
        />
      </View>
    );
  }
  // Z
  return (
    <View style={{ width: size, height: size * 0.7 }}>
      <View
        style={{
          width: size,
          height: u,
          backgroundColor: fill,
          borderColor: border,
          borderWidth: bw,
        }}
      />
      <View
        style={{
          alignSelf: 'center',
          width: u,
          height: size * 0.35,
          backgroundColor: fill,
          borderColor: border,
          borderWidth: bw,
        }}
      />
      <View
        style={{
          width: size,
          height: u,
          backgroundColor: fill,
          borderColor: border,
          borderWidth: bw,
        }}
      />
    </View>
  );
}

export function FitItGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const random = useMemo(() => createSeededRandom(seed), [seed]);
  const accent = gameAccents['fit-it'];
  const startAtRef = useRef(nowMs());
  const doneRef = useRef(false);

  const config: ShapeConfig = useMemo(() => {
    const kind = SHAPES[Math.floor(random() * SHAPES.length)]!;
    const size = difficulty >= 3 ? 78 : difficulty >= 2 ? 88 : 96;
    return { kind, size };
  }, [difficulty, random]);

  const distractor = useMemo(() => {
    let k = SHAPES[Math.floor(random() * SHAPES.length)]!;
    while (k === config.kind) k = SHAPES[Math.floor(random() * SHAPES.length)]!;
    return k;
  }, [config.kind, random]);

  const [area, setArea] = useState({ width: 0, height: 0 });
  const [fitted, setFitted] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [assist, setAssist] = useState(false);

  const targetX = useSharedValue(0);
  const targetY = useSharedValue(0);
  const pieceX = useSharedValue(0);
  const pieceY = useSharedValue(0);
  const homeX = useSharedValue(0);
  const homeY = useSharedValue(0);
  const startPX = useSharedValue(0);
  const startPY = useSharedValue(0);

  const onAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
    const tx = width * (0.35 + random() * 0.25);
    const ty = height * 0.22;
    const hx = width * 0.5 - config.size / 2;
    const hy = height * 0.68;
    targetX.value = tx;
    targetY.value = ty;
    homeX.value = hx;
    homeY.value = hy;
    pieceX.value = hx;
    pieceY.value = hy;

    setTimeout(() => setAssist(true), 28000);
  };

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFitted(true);
    feel.perfect();
    setTimeout(() => {
      onComplete({
        gameId: 'fit-it',
        score: 100,
        isSuccess: true,
        correct: true,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: { shape: config.kind },
      });
    }, motionMs.completion);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!fitted)
    .onBegin(() => {
      startPX.value = pieceX.value;
      startPY.value = pieceY.value;
      setHintVisible(false);
      feel.selection();
    })
    .onUpdate((e) => {
      pieceX.value = startPX.value + e.translationX;
      pieceY.value = startPY.value + e.translationY;
    })
    .onEnd(() => {
      const dx = pieceX.value + config.size / 2 - (targetX.value + config.size / 2);
      const dy = pieceY.value + config.size / 2 - (targetY.value + config.size / 2);
      const dist = Math.hypot(dx, dy);
      const threshold = config.size * 0.42;
      if (dist < threshold) {
        pieceX.value = withSpring(targetX.value, { damping: 16, stiffness: 220 });
        pieceY.value = withSpring(targetY.value, { damping: 16, stiffness: 220 });
        complete();
      } else {
        pieceX.value = withSpring(homeX.value, { damping: 14, stiffness: 180 });
        pieceY.value = withSpring(homeY.value, { damping: 14, stiffness: 180 });
        feel.warning();
      }
    });

  const targetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: targetX.value }, { translateY: targetY.value }],
    opacity: fitted ? 0 : assist ? 1 : 0.85,
  }));

  const pieceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pieceX.value }, { translateY: pieceY.value }],
  }));

  const distractorLeft = area.width > 0 ? area.width * 0.12 : 40;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YERİNE OTURT</Text>
      <GameHint gameId="fit-it" text="Parçayı yerine bırak." visible={hintVisible && !fitted} />

      <View onLayout={onAreaLayout} style={styles.area}>
        {area.width > 0 ? (
          <>
            <Animated.View style={[styles.slot, targetStyle]}>
              <ShapeVisual kind={config.kind} size={config.size} color={accent} outline />
            </Animated.View>

            {difficulty >= 2 ? (
              <View style={[styles.distractor, { left: distractorLeft, top: area.height * 0.62 }]}>
                <ShapeVisual
                  kind={distractor}
                  size={config.size * 0.85}
                  color={colors.borderSubtle}
                />
              </View>
            ) : null}

            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.piece, pieceStyle]}>
                <ShapeVisual kind={config.kind} size={config.size} color={accent} />
              </Animated.View>
            </GestureDetector>
          </>
        ) : null}

        {fitted ? (
          <View style={styles.result} pointerEvents="none">
            <Text style={[styles.resultLabel, { color: accent }]}>OTURDU.</Text>
          </View>
        ) : null}
      </View>
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
    marginHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  slot: {
    position: 'absolute',
  },
  piece: {
    position: 'absolute',
  },
  distractor: {
    position: 'absolute',
    opacity: 0.45,
  },
  result: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLabel: {
    ...typography.heading,
    fontSize: 28,
    letterSpacing: 2,
  },
});
