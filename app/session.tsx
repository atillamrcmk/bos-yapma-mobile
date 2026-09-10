import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ComboBadge } from '@/components/ui/ComboBadge';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { gameDefinitionMap } from '@/games/definitions';
import { getGameComponent } from '@/games/registry';
import { ComboProvider, useCombo } from '@/session/combo-context';
import {
  createSessionConfig,
  getSessionProgress,
  shouldEndSessionAfterChallenge,
} from '@/session/engine';
import { getDifficultyForDuration, selectNextChallenge } from '@/session/generator';
import { setLastSession } from '@/session/session-store';
import { updateStatsAfterSession } from '@/storage/stats';
import type { GameCategory, GameId, GameResult } from '@/types/game';
import type {
  SessionChallenge,
  SessionConfig,
  SessionDuration,
  SessionSummary,
} from '@/types/session';
import { nowMs } from '@/utils/time';

function parseDuration(value: string | string[] | undefined): SessionDuration {
  const num = Number(Array.isArray(value) ? value[0] : value);
  if (num === 1 || num === 5) return num;
  return 3;
}

function buildSummary(
  config: SessionConfig,
  results: GameResult[],
  totalDurationMs: number,
): SessionSummary {
  const reactionResults = results
    .filter((r) => r.gameId === 'reaction' && r.metadata?.reactionMs != null)
    .map((r) => r.metadata!.reactionMs as number);
  const estimateResults = results
    .filter((r) => r.gameId === 'estimate' && r.metadata?.accuracy != null)
    .map((r) => r.metadata!.accuracy as number);
  const memoryResult = results.find((r) => r.gameId === 'memory-grid');

  const memoryCorrect = memoryResult?.metadata?.correct as number | undefined;
  const memoryTotal = memoryResult?.metadata?.total as number | undefined;

  const knowledgeGames = results.filter(
    (r) =>
      r.gameId === 'estimate' ||
      r.gameId === 'which-came-first' ||
      r.gameId === 'order-three',
  );

  return {
    config,
    results,
    totalDurationMs,
    targetDurationMs: config.targetDurationMs,
    challengeCount: results.length,
    completedAt: new Date().toISOString(),
    highlightReactionMs: reactionResults.length ? Math.min(...reactionResults) : null,
    estimateAccuracy: estimateResults.length
      ? Math.round(estimateResults.reduce((a, b) => a + b, 0) / estimateResults.length)
      : null,
    memoryScore:
      memoryCorrect != null && memoryTotal != null ? `${memoryCorrect} / ${memoryTotal}` : null,
    newFactsCount: knowledgeGames.length,
  };
}

function SessionScreenInner() {
  const router = useRouter();
  const params = useLocalSearchParams<{ duration?: string }>();
  const durationMinutes = parseDuration(params.duration);
  const { currentCombo, pulseKey, bumpCombo, resetCombo } = useCombo();

  const config = useMemo(() => createSessionConfig(durationMinutes), [durationMinutes]);
  const difficulty = getDifficultyForDuration(durationMinutes);

  const sessionStartedAtRef = useRef(nowMs());
  const challengeStartedAtRef = useRef(nowMs());
  const resultsRef = useRef<GameResult[]>([]);
  const playedIdsRef = useRef<GameId[]>([]);
  const playedCategoriesRef = useRef<GameCategory[]>([]);
  const usedKnowledgeIdsRef = useRef<string[]>([]);
  const [excludeContentIds, setExcludeContentIds] = useState<string[]>([]);
  const seedCounterRef = useRef(0);
  const finishingRef = useRef(false);

  const [currentChallenge, setCurrentChallenge] = useState<SessionChallenge | null>(() => {
    seedCounterRef.current += 1;
    return selectNextChallenge({
      targetDurationMs: config.targetDurationMs,
      elapsedMs: 0,
      durationMinutes,
      playedGameIds: [],
      playedCategories: [],
      difficulty,
      seed: Date.now(),
    });
  });
  const [challengeNumber, setChallengeNumber] = useState(1);
  const [sessionProgress, setSessionProgress] = useState(0);

  const GameComponent = currentChallenge ? getGameComponent(currentChallenge.gameId) : null;

  const finishSession = useCallback(
    async (finalResults: GameResult[]) => {
      if (finishingRef.current) return;
      finishingRef.current = true;

      const totalDurationMs = nowMs() - sessionStartedAtRef.current;
      const summary = buildSummary(config, finalResults, totalDurationMs);

      const memoryMeta = finalResults.find((r) => r.gameId === 'memory-grid')?.metadata;

      await updateStatsAfterSession({
        reactionMs: summary.highlightReactionMs,
        estimateAccuracy: summary.estimateAccuracy,
        memoryCorrect: memoryMeta?.correct as number | undefined,
        memoryTotal: memoryMeta?.total as number | undefined,
      });

      setLastSession(summary);
      router.replace('/result');
    },
    [config, router],
  );

  const pickNextChallenge = useCallback(
    (elapsedMs: number): SessionChallenge => {
      seedCounterRef.current += 1;
      return selectNextChallenge({
        targetDurationMs: config.targetDurationMs,
        elapsedMs,
        durationMinutes,
        playedGameIds: [...playedIdsRef.current],
        playedCategories: [...playedCategoriesRef.current],
        difficulty,
        seed: Date.now() + seedCounterRef.current * 997,
      });
    },
    [config.targetDurationMs, difficulty, durationMinutes],
  );

  const handleComplete = useCallback(
    (result: GameResult) => {
      const completedAt = nowMs();
      const enriched: GameResult = {
        ...result,
        startedAt: result.startedAt ?? challengeStartedAtRef.current,
        completedAt,
        durationMs: completedAt - (result.startedAt ?? challengeStartedAtRef.current),
      };

      if (enriched.isSuccess) {
        bumpCombo();
      } else {
        resetCombo();
      }

      resultsRef.current = [...resultsRef.current, enriched];
      playedIdsRef.current = [...playedIdsRef.current, enriched.gameId];
      playedCategoriesRef.current = [
        ...playedCategoriesRef.current,
        gameDefinitionMap[enriched.gameId].category,
      ];

      const itemIds = enriched.metadata?.itemIds;
      if (Array.isArray(itemIds)) {
        const nextExcluded = [
          ...usedKnowledgeIdsRef.current,
          ...itemIds.filter((id): id is string => typeof id === 'string'),
        ];
        usedKnowledgeIdsRef.current = nextExcluded;
        setExcludeContentIds(nextExcluded);
      }

      const elapsed = completedAt - sessionStartedAtRef.current;
      setSessionProgress(getSessionProgress(elapsed, config.targetDurationMs));

      if (shouldEndSessionAfterChallenge(elapsed, config.targetDurationMs)) {
        finishSession(resultsRef.current);
        return;
      }

      const next = pickNextChallenge(elapsed);
      challengeStartedAtRef.current = nowMs();
      setCurrentChallenge(next);
      setChallengeNumber((n) => n + 1);
    },
    [bumpCombo, config.targetDurationMs, finishSession, pickNextChallenge, resetCombo],
  );

  const handleExit = () => {
    Alert.alert('Turu bırakmak istiyor musun?', undefined, [
      { text: 'Devam et', style: 'cancel' },
      { text: 'Turu bitir', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (!currentChallenge || !GameComponent) {
    return null;
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <GameHeader current={challengeNumber} onExit={handleExit} sessionProgress={sessionProgress} />
      <View style={styles.gameArea}>
        <Animated.View
          key={`${currentChallenge.gameId}-${challengeNumber}-${currentChallenge.seed}`}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.game}
        >
          <GameComponent
            difficulty={currentChallenge.difficulty}
            excludeContentIds={excludeContentIds}
            onComplete={handleComplete}
            seed={currentChallenge.seed}
          />
        </Animated.View>
        <ComboBadge combo={currentCombo} pulseKey={pulseKey} />
      </View>
    </Screen>
  );
}

export default function SessionScreen() {
  return (
    <ComboProvider>
      <SessionScreenInner />
    </ComboProvider>
  );
}

const styles = StyleSheet.create({
  gameArea: {
    flex: 1,
  },
  game: {
    flex: 1,
  },
});
