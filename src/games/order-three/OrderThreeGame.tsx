import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import {
  buildOrderThreeChallenge,
  evaluateOrderThree,
  type OrderThreeChallenge,
} from '@/content/knowledge';
import type { GameComponentProps } from '@/types/game';
import { colors, gameAccents, radius, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';
import { nowMs } from '@/utils/time';

type Phase = 'play' | 'result';

const FEEDBACK_MS = 1100;

const SUCCESS_MESSAGES = ['Doğru sıra', 'Nokta atışı', 'Güzel sıraladın'] as const;
const FAIL_MESSAGES = ['Doğru sıra şöyleydi', 'Yaklaştın', 'Bir sonraki gelsin'] as const;

function pickMessage(seed: number, pool: readonly string[]): string {
  return pool[Math.abs(seed) % pool.length]!;
}

export function OrderThreeGame({
  onComplete,
  seed,
  difficulty,
  excludeContentIds,
}: GameComponentProps) {
  const accent = gameAccents['order-three'];
  const startAtRef = useRef(nowMs());
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const challenge = useMemo(
    () => buildOrderThreeChallenge(seed, difficulty, excludeContentIds ?? []),
    [seed, difficulty, excludeContentIds],
  );

  const [phase, setPhase] = useState<Phase>('play');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSub, setFeedbackSub] = useState<string | undefined>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (challenge || completedRef.current) return;
    completedRef.current = true;
    onComplete({
      gameId: 'order-three',
      score: 0,
      isSuccess: false,
      durationMs: 0,
      startedAt: startAtRef.current,
      completedAt: nowMs(),
      metadata: { reason: 'insufficient-content' },
    });
  }, [challenge, onComplete]);

  const finish = (challengeData: OrderThreeChallenge, orderIds: string[]) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const evaluation = evaluateOrderThree(orderIds, challengeData.correctOrderIds);
    if (evaluation.isSuccess) haptics.success();
    else haptics.warning();

    const message = evaluation.isSuccess
      ? pickMessage(seed, SUCCESS_MESSAGES)
      : pickMessage(seed + 1, FAIL_MESSAGES);
    const orderLabels = challengeData.correctOrderIds
      .map((id) => challengeData.cards.find((c) => c.id === id)?.label ?? id)
      .join(' → ');
    const sub = `${orderLabels}\n${challengeData.fact}`;

    setFeedbackMessage(message);
    setFeedbackSub(sub);
    setPhase('result');

    AccessibilityInfo.announceForAccessibility?.(
      evaluation.isSuccess ? `${message}. ${challengeData.fact}` : `${message}. ${orderLabels}`,
    );

    timerRef.current = setTimeout(() => {
      onComplete({
        gameId: 'order-three',
        score: evaluation.score,
        isSuccess: evaluation.isSuccess,
        correct: evaluation.isSuccess,
        durationMs: nowMs() - startAtRef.current,
        startedAt: startAtRef.current,
        completedAt: nowMs(),
        metadata: {
          itemIds: challengeData.correctOrderIds,
          trioKey: challengeData.trioKey,
          metric: challengeData.metric,
          selectedOrderIds: orderIds,
        },
      });
    }, FEEDBACK_MS);
  };

  const handleCardPress = (id: string) => {
    if (phase !== 'play' || !challenge || completedRef.current) return;

    const index = selectedIds.indexOf(id);
    if (index >= 0) {
      // Undo: remove this and everything after it.
      if (index !== selectedIds.length - 1) return;
      setSelectedIds((prev) => prev.slice(0, -1));
      haptics.selection();
      return;
    }

    if (selectedIds.length >= 3) return;

    const next = [...selectedIds, id];
    setSelectedIds(next);
    haptics.light();

    if (next.length === 3) {
      finish(challenge, next);
    }
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>İçerik hazırlanamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Üçünü Sırala
      </Text>
      <Text style={styles.prompt}>{challenge.prompt}</Text>

      <View style={styles.slots} accessibilityLabel="Seçilen sıra">
        {[0, 1, 2].map((slot) => {
          const id = selectedIds[slot];
          const item = id ? challenge.cards.find((c) => c.id === id) : undefined;
          return (
            <View
              key={`slot-${slot}`}
              style={[styles.slot, item ? { borderColor: accent } : null]}
              accessibilityLabel={
                item ? `${slot + 1}. sıra: ${item.label}` : `${slot + 1}. sıra boş`
              }
            >
              <Text style={styles.slotIndex}>{slot + 1}</Text>
              <Text style={styles.slotLabel} numberOfLines={2}>
                {item?.label ?? '—'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.cards}>
        {challenge.cards.map((card) => {
          const selectedIndex = selectedIds.indexOf(card.id);
          const isSelected = selectedIndex >= 0;
          const isLastSelected = selectedIndex === selectedIds.length - 1;
          const locked = phase !== 'play' || (selectedIds.length === 3 && !isSelected);

          return (
            <Pressable
              key={card.id}
              disabled={locked}
              onPress={() => handleCardPress(card.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: locked }}
              accessibilityLabel={
                isSelected
                  ? `${card.label}, ${selectedIndex + 1}. sırada.${isLastSelected ? ' Geri almak için dokun.' : ''}`
                  : `${card.label}, seçilmedi`
              }
              style={({ pressed }) => [
                styles.card,
                { borderColor: isSelected ? accent : colors.borderSubtle },
                isSelected && styles.cardSelected,
                pressed && !locked && styles.cardPressed,
              ]}
            >
              <View style={styles.cardRow}>
                {isSelected ? (
                  <View style={[styles.badge, { backgroundColor: accent }]}>
                    <Text style={styles.badgeText}>{selectedIndex + 1}</Text>
                  </View>
                ) : (
                  <View style={styles.badgePlaceholder} />
                )}
                <Text style={styles.cardLabel} numberOfLines={2}>
                  {card.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        {selectedIds.length === 0
          ? 'Sırayla üç karta dokun'
          : selectedIds.length < 3
            ? 'Son seçimi geri almak için tekrar dokun'
            : ' '}
      </Text>

      <FeedbackOverlay
        visible={phase === 'result'}
        message={feedbackMessage}
        subMessage={feedbackSub}
        accentColor={accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
  },
  prompt: {
    ...typography.title,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  slots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slot: {
    flex: 1,
    minHeight: touchTargetMin + 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  slotIndex: {
    ...typography.label,
    color: colors.textMuted,
  },
  slotLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cards: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    minHeight: touchTargetMin + 20,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: colors.accentPrimaryMuted,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  badgeText: {
    ...typography.label,
    color: colors.backgroundPrimary,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'none',
  },
  cardLabel: {
    ...typography.title,
    flex: 1,
    fontSize: 18,
  },
  hint: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textMuted,
    minHeight: 20,
  },
});
