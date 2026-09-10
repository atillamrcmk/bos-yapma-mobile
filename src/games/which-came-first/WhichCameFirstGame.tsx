import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { buildWhichCameFirstChallenge } from '@/content/knowledge';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, radius, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';

type Phase = 'pick' | 'result';

const FEEDBACK_MS = 1200;

export function WhichCameFirstGame({
  onComplete,
  seed,
  difficulty,
  excludeContentIds,
}: GameComponentProps) {
  const challenge = useMemo(
    () => buildWhichCameFirstChallenge(seed, difficulty, excludeContentIds ?? []),
    [seed, difficulty, excludeContentIds],
  );
  const startAtRef = useRef(nowMs());
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const accent = gameAccents['which-came-first'];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (challenge || completedRef.current) return;
    completedRef.current = true;
    onComplete({
      gameId: 'which-came-first',
      score: 0,
      isSuccess: false,
      durationMs: 0,
      startedAt: startAtRef.current,
      completedAt: nowMs(),
      metadata: { reason: 'insufficient-content' },
    });
  }, [challenge, onComplete]);

  const handlePick = (choiceId: string) => {
    if (phase !== 'pick' || !challenge || completedRef.current) return;
    completedRef.current = true;
    setSelectedId(choiceId);
    setPhase('result');

    const correct = choiceId === challenge.earlierId;
    if (correct) haptics.success();
    else haptics.warning();

    timerRef.current = setTimeout(() => {
      onComplete({
        gameId: 'which-came-first',
        score: correct ? 100 : 0,
        isSuccess: correct,
        correct,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: {
          yearDiff: challenge.yearDiff,
          itemIds: [challenge.left.id, challenge.right.id],
          pairKey: challenge.pairKey,
        },
      });
    }, FEEDBACK_MS);
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>İçerik hazırlanamadı</Text>
      </View>
    );
  }

  const earlier = challenge.earlierId === challenge.left.id ? challenge.left : challenge.right;
  const later = challenge.earlierId === challenge.left.id ? challenge.right : challenge.left;
  const isCorrect = selectedId === challenge.earlierId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hangisi daha önce çıktı?</Text>

      {phase === 'pick' ? (
        <View style={styles.options}>
          <OptionCard
            accent={accent}
            label={challenge.left.label}
            onPress={() => handlePick(challenge.left.id)}
          />
          <OptionCard
            accent={accent}
            label={challenge.right.label}
            onPress={() => handlePick(challenge.right.id)}
          />
        </View>
      ) : null}

      <FeedbackOverlay
        visible={phase === 'result'}
        message={isCorrect ? 'Doğru' : 'Doğru sıra şöyleydi'}
        subMessage={`${earlier.label} — ${earlier.displayValue}\n${later.label} — ${later.displayValue}\n${challenge.yearDiff} yıl fark. ${challenge.fact}`}
        accentColor={isCorrect ? accent : colors.textSecondary}
      />
    </View>
  );
}

function OptionCard({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        { borderColor: accent },
      ]}
    >
      <Text style={styles.initial}>{label.charAt(0)}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
  },
  options: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: Math.max(120, touchTargetMin * 2),
    justifyContent: 'center',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  initial: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textMuted,
  },
  cardLabel: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
  },
});
