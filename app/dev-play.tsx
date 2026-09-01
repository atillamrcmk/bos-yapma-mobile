import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { getGameComponent } from '@/games/registry';
import type { GameId } from '@/types/game';
import { spacing } from '@/theme';

export default function DevPlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ game?: string }>();
  const gameId = params.game as GameId | undefined;

  const GameComponent = useMemo(() => (gameId ? getGameComponent(gameId) : null), [gameId]);

  if (!gameId || !GameComponent) {
    router.back();
    return null;
  }

  return (
    <Screen>
      <View style={styles.game}>
        <GameComponent difficulty={2} seed={Date.now()} onComplete={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  game: {
    flex: 1,
    paddingTop: spacing.md,
  },
});
