import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { getEnabledGames } from '@/games/definitions';
import type { GameId } from '@/types/game';
import { colors, spacing, typography } from '@/theme';

const SHOWCASE: GameId[] = [
  'untangle',
  'stop-the-line',
  'fit-it',
  'spot-change',
  'perfect-circle',
];

export default function DevGamesLabScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const router = useRouter();
  const games = useMemo(() => {
    const all = getEnabledGames();
    const showcase = SHOWCASE.map((id) => all.find((g) => g.id === id)).filter(Boolean);
    const rest = all.filter((g) => !SHOWCASE.includes(g.id));
    return [...showcase, ...rest];
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.title}>GAME LAB</Text>
        <Text style={styles.sub}>DEV only · showcase önce</Text>
        {games.map((g) =>
          g ? (
            <Pressable
              key={g.id}
              onPress={() => router.push({ pathname: '/dev-play', params: { game: g.id } })}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>{g.title}</Text>
              <Text style={styles.rowMeta}>
                {g.id} · {g.category} · {g.interactionType}
                {!g.enabledInMainMix ? ' · mix OFF' : ''}
              </Text>
            </Pressable>
          ) : null,
        )}
        <View style={{ height: spacing.xl }} />
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
  },
  sub: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: 4,
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
