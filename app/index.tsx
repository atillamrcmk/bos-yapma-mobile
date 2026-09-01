import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { APP_NAME, TAGLINE } from '@/constants/app';
import { getStats, type UserStats } from '@/storage/stats';
import { getPreferences, saveDurationPreference } from '@/storage/preferences';
import type { SessionDuration } from '@/types/session';
import { colors, radius, spacing, typography } from '@/theme';

const DURATIONS: SessionDuration[] = [1, 3, 5];

export default function HomeScreen() {
  const router = useRouter();
  const [duration, setDuration] = useState<SessionDuration>(3);
  const [stats, setStats] = useState<UserStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
      getPreferences().then((p) => setDuration(p.lastDurationMinutes));
    }, []),
  );

  const handleDurationChange = (d: SessionDuration) => {
    setDuration(d);
    saveDurationPreference(d);
  };

  const handleStart = () => {
    router.push({ pathname: '/session', params: { duration: String(duration) } });
  };

  const showLastRound =
    stats?.lastSessionReactionMs != null || stats?.lastSessionEstimateAccuracy != null;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{TAGLINE}</Text>
        </View>

        <View style={styles.ctaSection}>
          <Button label={`${duration} Dakika Başlat`} onPress={handleStart} style={styles.cta} />

          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected: duration === d }}
                onPress={() => handleDurationChange(d)}
                style={[styles.durationChip, duration === d && styles.durationChipActive]}
              >
                <Text style={[styles.durationLabel, duration === d && styles.durationLabelActive]}>
                  {d} dk
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.moodLabel}>Bugün ne lazım?</Text>
          <View style={styles.moodRow}>
            <View style={[styles.moodChip, styles.moodChipActive]}>
              <Text style={styles.moodChipActiveText}>Karışık</Text>
            </View>
          </View>

          {showLastRound ? (
            <View style={styles.lastRound}>
              <Text style={styles.lastRoundTitle}>Son tur</Text>
              {stats?.lastSessionReactionMs != null ? (
                <Text style={styles.lastRoundLine}>Refleks: {stats.lastSessionReactionMs} ms</Text>
              ) : null}
              {stats?.lastSessionEstimateAccuracy != null ? (
                <Text style={styles.lastRoundLine}>
                  Tahmin: %{stats.lastSessionEstimateAccuracy}
                </Text>
              ) : null}
              {stats?.lastSessionMemoryCorrect != null && stats.lastSessionMemoryTotal != null ? (
                <Text style={styles.lastRoundLine}>
                  Hafıza: {stats.lastSessionMemoryCorrect}/{stats.lastSessionMemoryTotal}
                </Text>
              ) : null}
            </View>
          ) : null}

          {__DEV__ ? (
            <Pressable onPress={() => router.push('/dev')} style={styles.devLink}>
              <Text style={styles.devText}>DEV: Oyun testi</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.hero,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  ctaSection: {
    gap: spacing.md,
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    paddingVertical: spacing.lg,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minWidth: 56,
    alignItems: 'center',
  },
  durationChipActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryMuted,
  },
  durationLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  durationLabelActive: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  footer: {
    paddingTop: spacing.xl,
    gap: spacing.md,
    minHeight: 120,
  },
  moodLabel: {
    ...typography.label,
    fontSize: 11,
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  moodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  moodChipActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryMuted,
  },
  moodChipActiveText: {
    ...typography.bodySmall,
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  lastRound: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  lastRoundTitle: {
    ...typography.label,
    fontSize: 11,
  },
  lastRoundLine: {
    ...typography.bodySmall,
    fontVariant: ['tabular-nums'],
  },
  devLink: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  devText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
