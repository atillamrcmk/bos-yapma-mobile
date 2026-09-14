import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { getLastSession } from '@/session/session-store';
import { colors, spacing, typography } from '@/theme';
import { formatDuration } from '@/utils/time';

interface Highlight {
  value: string;
  label: string;
  key: string;
}

function pickHighlight(summary: NonNullable<ReturnType<typeof getLastSession>>): Highlight {
  if (summary.highlightCircleScore != null) {
    return {
      value: `${summary.highlightCircleScore.toFixed(1)}%`,
      label: 'DAİRE',
      key: 'circle',
    };
  }
  if (summary.highlightStopLineAccuracy != null) {
    return {
      value: `%${summary.highlightStopLineAccuracy}`,
      label: 'DURDUR',
      key: 'stop',
    };
  }
  if (summary.highlightReactionMs != null) {
    return {
      value: `${summary.highlightReactionMs} ms`,
      label: 'EN İYİ REFLEKS',
      key: 'reaction',
    };
  }
  if (summary.highlightTimingAbsSec != null) {
    return {
      value: `±${summary.highlightTimingAbsSec.toFixed(2)} sn`,
      label: 'ZAMANLAMA',
      key: 'timing',
    };
  }
  if (summary.puzzleSolvedCount > 0) {
    return {
      value: String(summary.puzzleSolvedCount),
      label: 'PUZZLE',
      key: 'puzzle',
    };
  }
  return {
    value: formatDuration(summary.totalDurationMs),
    label: 'TUR',
    key: 'duration',
  };
}

export default function ResultScreen() {
  const router = useRouter();
  const summary = useMemo(() => getLastSession(), []);

  useEffect(() => {
    if (!summary) router.replace('/');
  }, [summary, router]);

  if (!summary) return null;

  const highlight = pickHighlight(summary);
  const lines: string[] = [];

  if (summary.highlightStopLineAccuracy != null && highlight.key !== 'stop') {
    lines.push(`Stop Line %${summary.highlightStopLineAccuracy}`);
  }
  if (summary.highlightCircleScore != null && highlight.key !== 'circle') {
    lines.push(`Daire %${summary.highlightCircleScore.toFixed(1)}`);
  }
  if (summary.puzzleSolvedCount > 0 && highlight.key !== 'puzzle') {
    lines.push(`${summary.puzzleSolvedCount} puzzle çözüldü`);
  }
  if (summary.highlightReactionMs != null && highlight.key !== 'reaction') {
    lines.push(`Refleks ${summary.highlightReactionMs} ms`);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BOŞ YAPMADIN.</Text>
          <Text style={styles.subtitle}>Tur tamamlandı.</Text>
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightValue}>{highlight.value}</Text>
          <Text style={styles.highlightLabel}>{highlight.label}</Text>
          {lines.slice(0, 2).map((line) => (
            <Text key={line} style={styles.metricLine}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          <Text style={styles.durationNote}>
            {summary.config.durationMinutes} dakikalık tur • {formatDuration(summary.totalDurationMs)}
          </Text>
          <Button label="BİTİR" onPress={() => router.replace('/')} style={styles.primaryCta} />
          <Button
            label="Bir tur daha"
            onPress={() =>
              router.replace({
                pathname: '/session',
                params: { duration: String(summary.config.durationMinutes) },
              })
            }
            variant="ghost"
          />
          <Text style={styles.footerNote}>Bitti. Hadi devam.</Text>
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
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  highlight: {
    gap: spacing.sm,
  },
  highlightValue: {
    ...typography.metric,
    fontSize: 56,
    lineHeight: 62,
    color: colors.accentPrimary,
  },
  highlightLabel: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.8,
    marginBottom: spacing.md,
  },
  metricLine: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 18,
  },
  durationNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
