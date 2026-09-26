import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';
import { createSeededRandom } from '@/utils/seeded-random';

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'early';

const MIN_DELAY = 800;
const MAX_DELAY = 2500;
const RESULT_DISPLAY_MS = 700;

export function ReactionGame({ onComplete, seed }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reactionMs, setReactionMs] = useState(0);
  const [feedback, setFeedback] = useState('');
  const goAtRef = useRef(0);
  const startAtRef = useRef(nowMs());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef(false);

  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const accent = gameAccents.reaction;

  const startRound = useCallback(() => {
    completeRef.current = false;
    setPhase('waiting');
    setFeedback('');
    bgOpacity.value = 0;
    scale.value = 1;

    const random = createSeededRandom(seed);
    const delay = MIN_DELAY + random() * (MAX_DELAY - MIN_DELAY);

    timeoutRef.current = setTimeout(() => {
      goAtRef.current = nowMs();
      setPhase('go');
      bgOpacity.value = withTiming(1, { duration: 120 });
      scale.value = withSpring(1.02, { damping: 14, stiffness: 200 });
      haptics.medium();
    }, delay);
  }, [bgOpacity, scale, seed]);

  useEffect(() => {
    startAtRef.current = nowMs();
    startRound();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startRound]);

  const finish = useCallback(
    (ms: number, message: string, correct: boolean) => {
      if (completeRef.current) return;
      completeRef.current = true;

      // Drop the green action flash immediately so the result screen is readable.
      bgOpacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(1, { duration: 100 });

      setReactionMs(ms);
      setFeedback(message);
      setPhase('result');

      setTimeout(() => {
        onComplete({
          gameId: 'reaction',
          score: correct ? Math.max(0, 1000 - ms) : 0,
          isSuccess: correct,
          correct,
          durationMs: nowMs() - startAtRef.current,
          startedAt: startAtRef.current,
          completedAt: nowMs(),
          metadata: { reactionMs: ms },
        });
      }, RESULT_DISPLAY_MS);
    },
    [bgOpacity, onComplete, scale],
  );

  const handlePress = () => {
    if (phase === 'result' || completeRef.current) return;

    if (phase === 'waiting' || phase === 'ready') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('early');
      setFeedback('Biraz erken.');
      haptics.warning();
      setTimeout(() => startRound(), 700);
      return;
    }

    if (phase === 'go') {
      const ms = Math.round(nowMs() - goAtRef.current);
      haptics.success();
      const message = ms < 220 ? 'İyi.' : '';
      finish(ms, message, true);
    }
  };

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isGo = phase === 'go';

  return (
    <Pressable
      disabled={phase === 'result'}
      onPress={handlePress}
      style={styles.container}
    >
      <Animated.View
        style={[styles.flash, { backgroundColor: accent }, bgStyle]}
        pointerEvents="none"
      />
      <Animated.View entering={FadeIn.duration(200)} style={[styles.content, centerStyle]}>
        {phase === 'early' ? (
          <>
            <Text style={styles.earlyTitle}>Biraz erken.</Text>
            <Text style={styles.subtitle}>Yeşili bekle.</Text>
          </>
        ) : phase === 'result' ? (
          <>
            <Text style={[styles.resultValue, { color: accent }]}>{reactionMs} ms</Text>
            {feedback ? <Text style={styles.resultFeedback}>{feedback}</Text> : null}
          </>
        ) : isGo ? (
          <Text style={[styles.goText, { color: accent }]}>ŞİMDİ</Text>
        ) : (
          <>
            <Text style={styles.title}>Hazır ol.</Text>
            <Text style={styles.subtitle}>Yeşili gördüğünde dokun.</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  flash: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  goText: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 4,
  },
  resultValue: {
    ...typography.metric,
    fontSize: 56,
    lineHeight: 64,
    textAlign: 'center',
  },
  resultFeedback: {
    ...typography.heading,
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  earlyTitle: {
    ...typography.heading,
    color: colors.warning,
    textAlign: 'center',
  },
});
