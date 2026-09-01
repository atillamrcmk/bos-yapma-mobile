import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ResultMetric } from '@/components/ui/ResultMetric';
import { Screen } from '@/components/ui/Screen';
import { getLastSession } from '@/session/session-store';
import { colors, spacing, typography } from '@/theme';
import { formatDuration } from '@/utils/time';

export default function ResultScreen() {
  const router = useRouter();
  const summary = useMemo(() => getLastSession(), []);

  useEffect(() => {
    if (!summary) router.replace('/');
  }, [summary, router]);

  if (!summary) return null;

  const handleFinish = () => {
    router.replace('/');
  };

  const handleAgain = () => {
    router.replace({
      pathname: '/session',
      params: { duration: String(summary.config.durationMinutes) },
    });
  };

  const secondaryMetrics: { value: string; label: string }[] = [];

  if (summary.estimateAccuracy != null) {
    secondaryMetrics.push({ value: `%${summary.estimateAccuracy}`, label: 'Tahmin' });
  }
  if (summary.memoryScore) {
    secondaryMetrics.push({ value: summary.memoryScore, label: 'Hafıza' });
  }
  if (summary.newFactsCount > 0) {
    secondaryMetrics.push({ value: String(summary.newFactsCount), label: 'Yeni bilgi' });
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BOŞ YAPMADIN.</Text>
          <Text style={styles.subtitle}>İyi bir mola.</Text>
          <Text style={styles.durationNote}>
            Tur tamamlandı · {formatDuration(summary.totalDurationMs)} · {summary.challengeCount}{' '}
            challenge
          </Text>
          <Text style={styles.targetNote}>
            {summary.config.durationMinutes} dakikalık tur hedefi
          </Text>
        </View>

        <View style={styles.metrics}>
          {summary.highlightReactionMs != null ? (
            <ResultMetric
              highlight
              label="Bugünün en iyisi"
              value={`${summary.highlightReactionMs} ms`}
            />
          ) : null}

          {secondaryMetrics.length > 0 ? (
            <View style={styles.secondaryRow}>
              {secondaryMetrics.map((m) => (
                <View key={m.label} style={styles.secondaryItem}>
                  <Text style={styles.secondaryValue}>{m.value}</Text>
                  <Text style={styles.secondaryLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button label="Bitir" onPress={handleFinish} style={styles.primaryCta} />
          <Button label="Bir tur daha" onPress={handleAgain} variant="ghost" />
          <Text style={styles.footerNote}>
            {summary.config.durationMinutes} dakikan doldu. Hadi devam.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.hero,
    fontSize: 32,
    letterSpacing: 3,
  },
  subtitle: {
    ...typography.body,
    fontSize: 18,
    color: colors.textSecondary,
  },
  durationNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  targetNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontSize: 12,
  },
  metrics: {
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  secondaryItem: {
    gap: spacing.xs,
  },
  secondaryValue: {
    ...typography.metricSmall,
    fontSize: 28,
  },
  secondaryLabel: {
    ...typography.label,
    fontSize: 11,
  },
  actions: {
    gap: spacing.md,
    alignItems: 'center',
  },
  primaryCta: {
    width: '100%',
  },
  footerNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
