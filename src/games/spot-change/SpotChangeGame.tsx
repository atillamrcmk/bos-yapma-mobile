import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameHint } from '@/components/game/GameHint';
import { feel, motionMs } from '@/game-feel';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { createSeededRandom } from '@/utils/seeded-random';
import { nowMs } from '@/utils/time';

type Shape = 'circle' | 'square' | 'triangle' | 'diamond' | 'bar';

interface SceneObject {
  id: number;
  shape: Shape;
  x: number;
  y: number;
  size: number;
  filled: boolean;
  rotation: number;
}

type Phase = 'observe' | 'mask' | 'guess' | 'result';

function countForDifficulty(difficulty: number): number {
  if (difficulty >= 3) return 8;
  if (difficulty >= 2) return 6;
  return 4;
}

function mutateObject(obj: SceneObject, random: () => number): SceneObject {
  const mode = Math.floor(random() * 4);
  const next = { ...obj };
  if (mode === 0) {
    next.x = Math.min(0.88, Math.max(0.12, obj.x + (random() > 0.5 ? 0.14 : -0.14)));
    next.y = Math.min(0.88, Math.max(0.12, obj.y + (random() > 0.5 ? 0.12 : -0.12)));
  } else if (mode === 1) {
    const shapes: Shape[] = ['circle', 'square', 'triangle', 'diamond', 'bar'];
    let s = shapes[Math.floor(random() * shapes.length)]!;
    while (s === obj.shape) s = shapes[Math.floor(random() * shapes.length)]!;
    next.shape = s;
  } else if (mode === 2) {
    next.filled = !obj.filled;
  } else {
    next.rotation = (obj.rotation + 45 + Math.floor(random() * 3) * 45) % 180;
  }
  return next;
}

function ShapeBody({ obj, color }: { obj: SceneObject; color: string }) {
  const size = obj.size;
  const fill = obj.filled ? color : 'transparent';
  if (obj.shape === 'circle') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fill,
          borderWidth: 2,
          borderColor: color,
        }}
      />
    );
  }
  if (obj.shape === 'square') {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: fill,
          borderWidth: 2,
          borderColor: color,
        }}
      />
    );
  }
  if (obj.shape === 'diamond') {
    return (
      <View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          backgroundColor: fill,
          borderWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    );
  }
  if (obj.shape === 'bar') {
    return (
      <View
        style={{
          width: size,
          height: size * 0.28,
          backgroundColor: fill,
          borderWidth: 2,
          borderColor: color,
        }}
      />
    );
  }
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
        borderBottomColor: obj.filled ? color : colors.borderSubtle,
      }}
    />
  );
}

export function SpotChangeGame({ onComplete, seed, difficulty }: GameComponentProps) {
  const random = useMemo(() => createSeededRandom(seed), [seed]);
  const accent = gameAccents['spot-change'];
  const startAtRef = useRef(nowMs());
  const [round, setRound] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [phase, setPhase] = useState<Phase>('observe');
  const [picked, setPicked] = useState<number | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const ROUNDS = 2;

  const scene = useMemo(() => {
    void round;
    const n = countForDifficulty(difficulty);
    const shapes: Shape[] = ['circle', 'square', 'triangle', 'diamond', 'bar'];
    const objs: SceneObject[] = [];
    for (let i = 0; i < n; i += 1) {
      objs.push({
        id: i,
        shape: shapes[Math.floor(random() * shapes.length)]!,
        x: 0.18 + (i % 3) * 0.32 + (random() - 0.5) * 0.06,
        y: 0.22 + Math.floor(i / 3) * 0.32 + (random() - 0.5) * 0.05,
        size: 34 + Math.floor(random() * 16),
        filled: random() > 0.45,
        rotation: Math.floor(random() * 4) * 15,
      });
    }
    const changeId = Math.floor(random() * n);
    const after = objs.map((o) => (o.id === changeId ? mutateObject(o, random) : o));
    return { before: objs, after, changeId };
  }, [difficulty, random, round]);

  const observeMs = 900 + Math.floor(random() * 500);

  useEffect(() => {
    setPhase('observe');
    setPicked(null);
    const t1 = setTimeout(() => setPhase('mask'), observeMs);
    const t2 = setTimeout(() => setPhase('guess'), observeMs + 280);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [observeMs, round]);

  const finishRound = (correct: boolean) => {
    const nextCorrect = correctTotal + (correct ? 1 : 0);
    setCorrectTotal(nextCorrect);
    setPhase('result');
    if (correct) feel.correct();
    else feel.warning();

    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        onComplete({
          gameId: 'spot-change',
          score: Math.round((nextCorrect / ROUNDS) * 100),
          isSuccess: nextCorrect === ROUNDS,
          correct: nextCorrect === ROUNDS,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: { correct: nextCorrect, total: ROUNDS },
        });
      } else {
        setRound((r) => r + 1);
      }
    }, correct ? motionMs.correct + 120 : 700);
  };

  const handlePick = (id: number) => {
    if (phase !== 'guess') return;
    setHintVisible(false);
    setPicked(id);
    finishRound(id === scene.changeId);
  };

  const visible = phase === 'observe' ? scene.before : scene.after;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NE DEĞİŞTİ?</Text>
      <GameHint
        gameId="spot-change"
        text="Değişeni bul."
        visible={hintVisible && phase === 'guess'}
      />

      <View style={styles.stage}>
        {phase === 'mask' ? (
          <View style={styles.mask} />
        ) : (
          visible.map((obj) => {
            const highlight =
              phase === 'result'
                ? obj.id === scene.changeId
                  ? 'correct'
                  : picked === obj.id
                    ? 'wrong'
                    : null
                : null;
            return (
              <Pressable
                key={obj.id}
                accessibilityLabel="Şekil"
                disabled={phase !== 'guess'}
                onPress={() => handlePick(obj.id)}
                style={[
                  styles.obj,
                  {
                    left: `${obj.x * 100}%`,
                    top: `${obj.y * 100}%`,
                    width: obj.size + 16,
                    height: obj.size + 16,
                    marginLeft: -(obj.size + 16) / 2,
                    marginTop: -(obj.size + 16) / 2,
                    borderColor:
                      highlight === 'correct'
                        ? colors.success
                        : highlight === 'wrong'
                          ? colors.error
                          : 'transparent',
                    borderWidth: highlight ? 2 : 0,
                    transform: [{ rotate: `${obj.rotation}deg` }],
                  },
                ]}
              >
                <ShapeBody obj={obj} color={accent} />
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.status}>
        {phase === 'observe' ? 'İzle…' : phase === 'guess' ? 'Dokun' : ''}
      </Text>
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
  stage: {
    flex: 1,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mask: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  obj: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  status: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
});
