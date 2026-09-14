import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/constants/app';
import { getStats, type UserStats } from '@/storage/stats';
import { getPreferences, saveDurationPreference } from '@/storage/preferences';
import type { SessionDuration } from '@/types/session';
import { colors, spacing, touchTargetMin, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

const DURATIONS: SessionDuration[] = [1, 3, 5];

function taglineFor(duration: SessionDuration): string {
  if (duration === 1) return '1 dakikan varsa başlıyoruz.';
  if (duration === 5) return '5 dakikan varsa başlıyoruz.';
  return '3 dakikan varsa başlıyoruz.';
}

function ctaLabel(duration: SessionDuration): string {
  return `${duration} DAKİKA BAŞLAT`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [duration, setDuration] = useState<SessionDuration>(3);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      sub?.remove?.();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
      getPreferences().then((p) => setDuration(p.lastDurationMinutes));
    }, []),
  );

  const enter = useMemo(() => {
    if (reduceMotion) return undefined;
    return {
      hero: FadeInDown.duration(280).easing(Easing.out(Easing.cubic)),
      cta: FadeInUp.delay(80).duration(260).easing(Easing.out(Easing.cubic)),
      footer: FadeIn.delay(140).duration(240),
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
        <Animated.View entering={enter?.hero} style={styles.hero}>
          <Text
            accessibilityRole="header"
            accessibilityLabel={APP_NAME}
            style={styles.word}
          >
            BOŞ
          </Text>
          <Text accessibilityElementsHidden style={styles.word}>
            YAPMA.
          </Text>
          <Text style={styles.tagline}>{taglineFor(duration)}</Text>
        </Animated.View>

        <Animated.View entering={enter?.cta} style={styles.ctaSection}>
          <Button label={ctaLabel(duration)} onPress={handleStart} style={styles.cta} />

          <View style={styles.segment} accessibilityRole="tablist">
            {DURATIONS.map((d) => {
              const selected = duration === d;
              return (
                <Pressable
                  key={d}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${d} dakika`}
                  onPress={() => handleDurationChange(d)}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    selected && styles.segmentItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.segmentLabel, selected && styles.segmentLabelActive]}>
                    {d} dk
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={enter?.footer} style={styles.footer}>
          {showLastRound ? (
            <View style={styles.lastRound}>
              <Text style={styles.lastRoundKicker}>SON TUR</Text>
              {stats?.lastSessionReactionMs != null ? (
                <View style={styles.lastRoundBlock}>
                  <Text style={styles.lastRoundLabel}>Refleks</Text>
                  <Text style={styles.lastRoundValue}>{stats.lastSessionReactionMs} ms</Text>
                </View>
              ) : null}
              {stats?.lastSessionEstimateAccuracy != null ? (
                <View style={styles.lastRoundBlock}>
                  <Text style={styles.lastRoundLabel}>Tahmin</Text>
                  <Text style={styles.lastRoundValue}>%{stats.lastSessionEstimateAccuracy}</Text>
                </View>
              ) : null}
              {stats?.lastSessionMemoryCorrect != null && stats.lastSessionMemoryTotal != null ? (
                <View style={styles.lastRoundBlock}>
                  <Text style={styles.lastRoundLabel}>Hafıza</Text>
                  <Text style={styles.lastRoundValue}>
                    {stats.lastSessionMemoryCorrect}/{stats.lastSessionMemoryTotal}
                  </Text>
                </View>
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
    paddingTop: spacing.xxl,
  },
  word: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 58,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  ctaSection: {
    gap: spacing.md,
  },
  cta: {
    width: '100%',
    paddingVertical: spacing.lg,
  },
  segment: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
  },
  segmentItem: {
    minWidth: 56,
    minHeight: touchTargetMin,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textPrimary,
  },
  segmentLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
  footer: {
    paddingTop: spacing.xl,
    minHeight: 96,
    gap: spacing.lg,
  },
  lastRound: {
    gap: spacing.md,
  },
  lastRoundKicker: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  lastRoundBlock: {
    gap: 2,
  },
  lastRoundLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  lastRoundValue: {
    ...typography.heading,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  devLink: {
    paddingVertical: spacing.sm,
  },
  devText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
