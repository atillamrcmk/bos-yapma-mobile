import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { KNOWLEDGE_CATEGORY_LABEL, buildWhichCameFirstChallenge } from '@/content/knowledge';
import type { KnowledgeItem } from '@/content/knowledge';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';

type Phase = 'pick' | 'result';

const FEEDBACK_MS = 900;

function yearLabel(item: KnowledgeItem): string {
  if (item.metric === 'year') return String(Math.round(item.value));
  return item.displayValue;
}

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
        <Text style={styles.prompt}>İçerik hazırlanamadı</Text>
      </View>
    );
  }

  const earlier = challenge.earlierId === challenge.left.id ? challenge.left : challenge.right;
  const later = challenge.earlierId === challenge.left.id ? challenge.right : challenge.left;
  const isCorrect = selectedId === challenge.earlierId;
  const feedback = `${earlier.label} ${challenge.yearDiff} yıl önce.`;

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Hangisi daha önce çıktı?</Text>

      {phase === 'pick' ? (
        <View style={styles.options}>
          <ChoiceRow
            item={challenge.left}
            onPress={() => handlePick(challenge.left.id)}
          />
          <View style={styles.divider} />
          <ChoiceRow
            item={challenge.right}
            onPress={() => handlePick(challenge.right.id)}
          />
        </View>
      ) : (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.timelineBlock}>
          <View style={styles.timeline}>
            <View style={styles.marker}>
              <Text style={styles.markerLabel}>{earlier.label}</Text>
              <Text style={[styles.markerYear, { color: accent }]}>{yearLabel(earlier)}</Text>
            </View>
            <View style={styles.axisWrap}>
              <View style={[styles.axis, { backgroundColor: accent }]} />
            </View>
            <View style={[styles.marker, styles.markerEnd]}>
              <Text style={styles.markerLabel}>{later.label}</Text>
              <Text style={styles.markerYearMuted}>{yearLabel(later)}</Text>
            </View>
          </View>
          <Animated.View entering={FadeIn.delay(80).duration(180)}>
            <Text style={styles.feedback}>{feedback}</Text>
            {!isCorrect ? <Text style={styles.missed}>Kaçırdın.</Text> : null}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

function ChoiceRow({
  item,
  onPress,
}: {
  item: KnowledgeItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${item.label}, ${KNOWLEDGE_CATEGORY_LABEL[item.category]}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
    >
      <Text style={styles.choiceLabel}>{item.label}</Text>
      <Text style={styles.choiceMeta}>{KNOWLEDGE_CATEGORY_LABEL[item.category]}</Text>
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
  prompt: {
    ...typography.bodySmall,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  options: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  choice: {
    minHeight: touchTargetMin * 2,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  choicePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  choiceLabel: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  choiceMeta: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
  },
  timelineBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  marker: {
    flex: 1,
    gap: spacing.xs,
  },
  markerEnd: {
    alignItems: 'flex-end',
  },
  markerLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  markerYear: {
    ...typography.heading,
    fontVariant: ['tabular-nums'],
  },
  markerYearMuted: {
    ...typography.heading,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  axisWrap: {
    flex: 1.2,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  axis: {
    height: 1,
    width: '100%',
    opacity: 0.8,
  },
  feedback: {
    ...typography.heading,
    fontSize: 20,
  },
  missed: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
});
