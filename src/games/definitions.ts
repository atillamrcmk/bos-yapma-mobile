import type { ComponentType } from 'react';

import { ColorMatchGame } from '@/games/color-match/ColorMatchGame';
import { EstimateGame } from '@/games/estimate/EstimateGame';
import { FitItGame } from '@/games/fit-it/FitItGame';
import { FlashCountGame } from '@/games/flash-count/FlashCountGame';
import { HoldItGame } from '@/games/hold-it/HoldItGame';
import { MemoryGridGame } from '@/games/memory-grid/MemoryGridGame';
import { OddOneOutGame } from '@/games/odd-one-out/OddOneOutGame';
import { OrderThreeGame } from '@/games/order-three/OrderThreeGame';
import { PerfectCircleGame } from '@/games/perfect-circle/PerfectCircleGame';
import { QuickMathGame } from '@/games/quick-math/QuickMathGame';
import { ReactionGame } from '@/games/reaction/ReactionGame';
import { SequenceGame } from '@/games/sequence/SequenceGame';
import { SpotChangeGame } from '@/games/spot-change/SpotChangeGame';
import { StopTheLineGame } from '@/games/stop-the-line/StopTheLineGame';
import { TargetTapGame } from '@/games/target-tap/TargetTapGame';
import { TimingGame } from '@/games/timing/TimingGame';
import { UntangleGame } from '@/games/untangle/UntangleGame';
import { WhichCameFirstGame } from '@/games/which-came-first/WhichCameFirstGame';
import { gameMetadata, type GameMetadata } from '@/games/metadata';
import type { GameComponentProps, GameId } from '@/types/game';

const components: Record<GameId, ComponentType<GameComponentProps>> = {
  reaction: ReactionGame,
  'odd-one-out': OddOneOutGame,
  estimate: EstimateGame,
  'memory-grid': MemoryGridGame,
  'quick-math': QuickMathGame,
  'which-came-first': WhichCameFirstGame,
  'order-three': OrderThreeGame,
  'color-match': ColorMatchGame,
  sequence: SequenceGame,
  'target-tap': TargetTapGame,
  'flash-count': FlashCountGame,
  timing: TimingGame,
  'hold-it': HoldItGame,
  untangle: UntangleGame,
  'stop-the-line': StopTheLineGame,
  'fit-it': FitItGame,
  'spot-change': SpotChangeGame,
  'perfect-circle': PerfectCircleGame,
};

export interface GameDefinition extends GameMetadata {
  component: ComponentType<GameComponentProps>;
}

export const gameDefinitions: GameDefinition[] = gameMetadata.map((meta) => ({
  ...meta,
  component: components[meta.id],
}));

export const gameDefinitionMap = Object.fromEntries(
  gameDefinitions.map((d) => [d.id, d]),
) as Record<GameId, GameDefinition>;

export function getEnabledGames(): GameDefinition[] {
  return gameDefinitions.filter((g) => g.enabled);
}

export function getMainMixGames(): GameDefinition[] {
  return gameDefinitions.filter((g) => g.enabled && g.enabledInMainMix);
}
