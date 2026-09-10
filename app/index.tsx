import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/constants/app';
import { getStats, type UserStats } from '@/storage/stats';
import { getPreferences, saveDurationPreference } from '@/storage/preferences';
import type { SessionDuration } from '@/types/session';
import { colors, radius, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

const DURATIONS: SessionDuration[] = [1, 3, 5];

function taglineFor(duration: SessionDuration): string {
  if (duration === 1) return '1 dakikanı daha iyi harca.';
  if (duration === 5) return '5 dakikanı daha iyi harca.';
  return '3 dakikanı daha iyi harca.';
}

export default function HomeScreen() {
  const router = useRouter();
  const [duration, setDuration] = useState<SessionDuration>(3);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const glow = useSharedValue(0.35);
  const markScale = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      glow.value = 0.4;
      markScale.value = 1;
      return;
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    markScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [glow, markScale, reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.92 + glow.value * 0.2 }],
  }));

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
      getPreferences().then((p) => setDuration(p.lastDurationMinutes));
    }, []),
  );

  const enter = useMemo(() => {
    if (reduceMotion) return undefined;
    return {
      hero: FadeInDown.duration(420).easing(Easing.out(Easing.cubic)),
      cta: FadeInUp.delay(120).duration(420).easing(Easing.out(Easing.cubic)),
      footer: FadeIn.delay(220).duration(380),
    };
  }, [reduceMotion]);

  const handleDurationChange = (d: SessionDuration) => {
    if (d === duration) return;
    setDuration(d);
    saveDurationPreference(d);
    haptics.selection();
  };

  const handleStart = () => {
    haptics.medium();
    router.push({ pathname: '/session', params: { duration: String(duration) } });
  };

  const showLastRound =
    stats?.lastSessionReactionMs != null || stats?.lastSessionEstimateAccuracy != null;

  return (
    <Screen>
      <View style={styles.container}>
        <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />

        <Animated.View entering={enter?.hero} style={styles.hero}>
          <Animated.View style={[styles.brandMark, markStyle]}>
            <View style={styles.brandMarkInner} />
          </Animated.View>
          <Text style={styles.title} accessibilityRole="header">
            {APP_NAME}
          </Text>
          <Text style={styles.tagline}>{taglineFor(duration)}</Text>
          <View style={styles.accentLine} />
        </Animated.View>

        <Animated.View entering={enter?.cta} style={styles.ctaSection}>
          <Button label={`${duration} Dakika Başlat`} onPress={handleStart} style={styles.cta} />

          <View style={styles.durationRow} accessibilityRole="tablist">
            {DURATIONS.map((d) => {
              const selected = duration === d;
              return (
                <DurationChip
                  key={d}
                  duration={d}
                  selected={selected}
                  onPress={() => handleDurationChange(d)}
                  reduceMotion={reduceMotion}
                />
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={enter?.footer} style={styles.footer}>
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
            <Pressable
              onPress={() => router.push('/dev')}
              style={styles.devLink}
              accessibilityRole="button"
              accessibilityLabel="Geliştirici oyun testi"
            >
              <Text style={styles.devText}>DEV: Oyun testi</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Screen>
  );
}

function DurationChip({
  duration,
  selected,
  onPress,
}: {
  duration: SessionDuration;
  selected: boolean;
  onPress: () => void;
  reduceMotion: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.durationChip,
        selected && styles.durationChipActive,
        pressed && styles.durationChipPressed,
      ]}
    >
      <Text style={[styles.durationLabel, selected && styles.durationLabelActive]}>{duration} dk</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  glow: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accentPrimaryMuted,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accentPrimary,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandMarkInner: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  title: {
    ...typography.hero,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
    color: colors.textSecondary,
  },
  accentLine: {
    marginTop: spacing.md,
    width: 40,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accentPrimary,
    opacity: 0.85,
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
    minHeight: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  durationChipActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryMuted,
  },
  durationChipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
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
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
