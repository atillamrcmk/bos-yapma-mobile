import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { getEnabledGames } from '@/games/definitions';
import { colors, radius, spacing, typography } from '@/theme';

export default function DevGameScreen() {
  const router = useRouter();
  const games = useMemo(() => getEnabledGames(), []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.title}>DEV — Oyun testi</Text>
        {games.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => router.push({ pathname: '/dev-play', params: { game: g.id } })}
            style={styles.row}
          >
            <Text style={styles.rowLabel}>{g.id}</Text>
            <Text style={styles.rowMeta}>
              {g.category} · ~{Math.round(g.estimatedDurationMs / 1000)}s
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  row: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowMeta: {
    ...typography.bodySmall,
  },
});
