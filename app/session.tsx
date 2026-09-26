import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';

import { ComboBadge } from '@/components/ui/ComboBadge';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { gameDefinitionMap } from '@/games/definitions';
import type { InteractionType } from '@/games/metadata';
import { getGameComponent } from '@/games/registry';
import { ComboProvider, useCombo } from '@/session/combo-context';
import { createSessionConfig, shouldEndSessionAfterChallenge } from '@/session/engine';
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
  const timingDiffs = results
    .filter(
      (r) =>
        (r.gameId === 'timing' || r.gameId === 'hold-it') &&
        typeof r.metadata?.absDiff === 'number',
    )
    .map((r) => r.metadata!.absDiff as number);
  const circleScores = results
    .filter((r) => r.gameId === 'perfect-circle' && typeof r.metadata?.circleScore === 'number')
    .map((r) => r.metadata!.circleScore as number);
  const stopLineScores = results
    .filter((r) => r.gameId === 'stop-the-line' && typeof r.metadata?.accuracy === 'number')
    .map((r) => r.metadata!.accuracy as number);
  const puzzleSolved = results.filter(
    (r) =>
      r.isSuccess &&
      (r.gameId === 'untangle' || r.gameId === 'fit-it' || r.gameId === 'perfect-circle'),
  ).length;

  const memoryCorrect = memoryResult?.metadata?.correct as number | undefined;
  const memoryTotal = memoryResult?.metadata?.total as number | undefined;

  return {
    config,
    results,
    totalDurationMs,
    targetDurationMs: config.targetDurationMs,
    challengeCount: results.length,
    completedAt: new Date().toISOString(),
    highlightReactionMs: reactionResults.length ? Math.min(...reactionResults) : null,
    highlightTimingAbsSec: timingDiffs.length ? Math.min(...timingDiffs) : null,
    highlightCircleScore: circleScores.length ? Math.max(...circleScores) : null,
    highlightStopLineAccuracy: stopLineScores.length ? Math.max(...stopLineScores) : null,
    puzzleSolvedCount: puzzleSolved,
    estimateAccuracy: estimateResults.length
      ? Math.round(estimateResults.reduce((a, b) => a + b, 0) / estimateResults.length)
      : null,
    memoryScore:
      memoryCorrect != null && memoryTotal != null ? `${memoryCorrect} / ${memoryTotal}` : null,
    newFactsCount: 0,
  };
}

function SessionScreenInner() {
  const router = useRouter();
  const params = useLocalSearchParams<{ duration?: string }>();
  const durationMinutes = parseDuration(params.duration);
  const { currentCombo, pulseKey, bumpCombo, resetCombo } = useCombo();

  const config = useMemo(() => createSessionConfig(durationMinutes), [durationMinutes]);
  const difficulty = getDifficultyForDuration(durationMinutes);
  const [sessionStartedAt] = useState(() => nowMs());

  const challengeStartedAtRef = useRef(nowMs());
  const resultsRef = useRef<GameResult[]>([]);
  const playedIdsRef = useRef<GameId[]>([]);
  const playedCategoriesRef = useRef<GameCategory[]>([]);
  const playedInteractionTypesRef = useRef<InteractionType[]>([]);
  const playedQuizPatternRef = useRef<boolean[]>([]);
  const usedKnowledgeIdsRef = useRef<string[]>([]);
  const [excludeContentIds, setExcludeContentIds] = useState<string[]>([]);
  const seedCounterRef = useRef(0);
  const finishingRef = useRef(false);
  const challengeKeyRef = useRef(0);
  const [challengeKey, setChallengeKey] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [currentChallenge, setCurrentChallenge] = useState<SessionChallenge | null>(() =>
    selectNextChallenge({
      targetDurationMs: config.targetDurationMs,
      elapsedMs: 0,
      durationMinutes,
      playedGameIds: [],
      playedCategories: [],
      playedInteractionTypes: [],
      playedQuizPattern: [],
      difficulty,
      seed: Date.now(),
    }),
  );

  const GameComponent = currentChallenge ? getGameComponent(currentChallenge.gameId) : null;

  const finishSession = useCallback(
    async (finalResults: GameResult[]) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setSessionComplete(true);

      const totalDurationMs = nowMs() - sessionStartedAt;
      const summary = buildSummary(config, finalResults, totalDurationMs);

      const memoryMeta = finalResults.find((r) => r.gameId === 'memory-grid')?.metadata;

      await updateStatsAfterSession({
        reactionMs: summary.highlightReactionMs,
        estimateAccuracy: summary.estimateAccuracy,
        memoryCorrect: memoryMeta?.correct as number | undefined,
        memoryTotal: memoryMeta?.total as number | undefined,
      });

      setLastSession(summary);
      await new Promise((resolve) => setTimeout(resolve, 180));
      router.replace('/result');
    },
    [config, router, sessionStartedAt],
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
        playedInteractionTypes: [...playedInteractionTypesRef.current],
        playedQuizPattern: [...playedQuizPatternRef.current],
        difficulty,
        seed: Date.now() + seedCounterRef.current * 997,
      });
    },
    [config.targetDurationMs, difficulty, durationMinutes],
  );

  const handleComplete = useCallback(
    (result: GameResult) => {
      if (finishingRef.current) return;

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

      const definition = gameDefinitionMap[enriched.gameId];
      resultsRef.current = [...resultsRef.current, enriched];
      playedIdsRef.current = [...playedIdsRef.current, enriched.gameId];
      playedCategoriesRef.current = [...playedCategoriesRef.current, definition.category];
      playedInteractionTypesRef.current = [
        ...playedInteractionTypesRef.current,
        definition.interactionType,
      ];
      playedQuizPatternRef.current = [
        ...playedQuizPatternRef.current,
        Boolean(definition.quizPattern),
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

      const elapsed = completedAt - sessionStartedAt;

      if (shouldEndSessionAfterChallenge(elapsed, config.targetDurationMs)) {
        finishSession(resultsRef.current);
        return;
      }

      const next = pickNextChallenge(elapsed);
      challengeStartedAtRef.current = nowMs();
      challengeKeyRef.current += 1;
      setChallengeKey(challengeKeyRef.current);
      setCurrentChallenge(next);
    },
    [bumpCombo, config.targetDurationMs, finishSession, pickNextChallenge, resetCombo, sessionStartedAt],
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
      <GameHeader
        complete={sessionComplete}
        onExit={handleExit}
        sessionStartedAt={sessionStartedAt}
        targetDurationMs={config.targetDurationMs}
      />
      <View style={styles.gameArea}>
        <Animated.View
          key={`${currentChallenge.gameId}-${challengeKey}-${currentChallenge.seed}`}
          entering={FadeInDown.duration(200).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(140)}
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
