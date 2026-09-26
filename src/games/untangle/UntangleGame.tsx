/* eslint-disable react-hooks/immutability */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Canvas, Line, vec } from '@shopify/react-native-skia';

import { GameHint } from '@/components/game/GameHint';
import { feel, motionMs } from '@/game-feel';
import { countIntersections, type Point } from '@/games/untangle/geometry';
import { buildUntangleLevel } from '@/games/untangle/levels';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { nowMs } from '@/utils/time';

const NODE = 28;
const HIT = 48;

export function UntangleGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const level = useMemo(() => buildUntangleLevel(seed, difficulty), [seed, difficulty]);
  const startAtRef = useRef(nowMs());
  const doneRef = useRef(false);
  const lastCrossRef = useRef(-1);
  const accent = gameAccents.untangle;

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [nodes, setNodes] = useState<Point[]>(() => level.nodes.map((p) => ({ ...p })));
  const [crossings, setCrossings] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [assist, setAssist] = useState(false);

  const positionsSV = useSharedValue<Point[]>(level.nodes.map((p) => ({ ...p })));

  useEffect(() => {
    const count = countIntersections(level.nodes, level.edges);
    setCrossings(count);
    lastCrossRef.current = count;
  }, [level.edges, level.nodes]);

  useEffect(() => {
    if (solved) return;
    const t = setTimeout(() => setAssist(true), 28000);
    return () => clearTimeout(t);
  }, [solved]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const rafRef = useRef<number | null>(null);

  const syncFromShared = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const next = positionsSV.value.map((p) => ({ ...p }));
      setNodes(next);
      const count = countIntersections(next, level.edges);
      setCrossings(count);

      if (lastCrossRef.current >= 0 && count < lastCrossRef.current) {
        feel.selection();
      }
      lastCrossRef.current = count;

      if (count === 0 && !doneRef.current) {
        doneRef.current = true;
        const sec = (nowMs() - startAtRef.current) / 1000;
        setElapsedSec(sec);
        setSolved(true);
        feel.perfect();
        setTimeout(() => {
          onComplete({
            gameId: 'untangle',
            score: Math.max(0, Math.round(100 - sec * 2)),
            isSuccess: true,
            correct: true,
            durationMs: nowMs() - startAtRef.current,
            startedAt: startAtRef.current,
            completedAt: nowMs(),
            metadata: { elapsedSec: sec, nodes: next.length },
          });
        }, motionMs.completion + 200);
      }
    });
  }, [level.edges, onComplete, positionsSV]);

  const w = size.width;
  const h = size.height;
  const ready = w > 0 && h > 0;
  const lineColor = solved || crossings === 0 ? accent : assist ? colors.warning : colors.textMuted;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DÜĞÜMÜ ÇÖZ</Text>
      <GameHint gameId="untangle" text="Noktaları sürükle." visible={hintVisible && !solved} />

      <View onLayout={onLayout} style={styles.play}>
        {ready ? (
          <>
            <Canvas style={StyleSheet.absoluteFill}>
              {level.edges.map(([a, b], i) => {
                const pa = nodes[a]!;
                const pb = nodes[b]!;
                return (
                  <Line
                    key={i}
                    p1={vec(pa.x * w, pa.y * h)}
                    p2={vec(pb.x * w, pb.y * h)}
                    color={lineColor}
                    strokeWidth={solved ? 2.5 : 1.5}
                  />
                );
              })}
            </Canvas>

            {nodes.map((_, index) => (
              <DraggableNode
                key={index}
                accent={accent}
                height={h}
                index={index}
                onDragStart={() => setHintVisible(false)}
                onDragUpdate={syncFromShared}
                positions={positionsSV}
                solved={solved}
                width={w}
              />
            ))}
          </>
        ) : null}

        {solved ? (
          <View style={styles.result} pointerEvents="none">
            <Text style={[styles.resultLabel, { color: accent }]}>TEMİZ.</Text>
            <Text style={styles.resultMeta}>{elapsedSec.toFixed(1)} sn</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function DraggableNode({
  index,
  width,
  height,
  positions,
  accent,
  solved,
  onDragStart,
  onDragUpdate,
}: {
  index: number;
  width: number;
  height: number;
  positions: SharedValue<Point[]>;
  accent: string;
  solved: boolean;
  onDragStart: () => void;
  onDragUpdate: () => void;
}) {
  const x = useSharedValue(positions.value[index]!.x * width);
  const y = useSharedValue(positions.value[index]!.y * height);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    x.value = positions.value[index]!.x * width;
    y.value = positions.value[index]!.y * height;
  }, [height, index, positions, width, x, y]);

  const pan = Gesture.Pan()
    .enabled(!solved)
    .onBegin(() => {
      startX.value = x.value;
      startY.value = y.value;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      const nx = Math.min(width - HIT / 2, Math.max(HIT / 2, startX.value + e.translationX));
      const ny = Math.min(height - HIT / 2, Math.max(HIT / 2, startY.value + e.translationY));
      x.value = nx;
      y.value = ny;
      const next = positions.value.slice();
      next[index] = { x: nx / width, y: ny / height };
      positions.value = next;
      runOnJS(onDragUpdate)();
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - HIT / 2 },
      { translateY: y.value - HIT / 2 },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.nodeHit, style]}>
        <View style={[styles.node, { borderColor: accent, backgroundColor: colors.surfaceElevated }]} />
      </Animated.View>
    </GestureDetector>
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
    marginBottom: spacing.sm,
  },
  play: {
    flex: 1,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  nodeHit: {
    position: 'absolute',
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
  },
  result: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,14,19,0.35)',
  },
  resultLabel: {
    ...typography.heading,
    fontSize: 28,
    letterSpacing: 2,
  },
  resultMeta: {
    ...typography.body,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
});
