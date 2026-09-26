import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { hasSeenTutorial, markTutorialSeen } from '@/storage/tutorials';
import type { GameId } from '@/types/game';
import { colors, spacing, typography } from '@/theme';

interface GameHintProps {
  gameId: GameId;
  text: string;
  /** Hide after first interaction or timeout. */
  visible?: boolean;
}

export function GameHint({ gameId, text, visible = true }: GameHintProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let alive = true;
    hasSeenTutorial(gameId).then((seen) => {
      if (!alive) return;
      if (!seen) setShow(true);
    });
    return () => {
      alive = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setShow(false);
      markTutorialSeen(gameId);
    }, 3200);
    return () => clearTimeout(t);
  }, [gameId, show]);

  useEffect(() => {
    if (!visible && show) {
      setShow(false);
      markTutorialSeen(gameId);
    }
  }, [gameId, show, visible]);

  if (!show || !visible) return null;

  return (
    <Animated.View exiting={FadeOut.duration(180)} style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
