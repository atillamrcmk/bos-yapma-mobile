import type { ComponentType } from 'react';

import { ColorMatchGame } from '@/games/color-match/ColorMatchGame';
import { EstimateGame } from '@/games/estimate/EstimateGame';
import { FlashCountGame } from '@/games/flash-count/FlashCountGame';
import { MemoryGridGame } from '@/games/memory-grid/MemoryGridGame';
import { OddOneOutGame } from '@/games/odd-one-out/OddOneOutGame';
import { OrderThreeGame } from '@/games/order-three/OrderThreeGame';
import { QuickMathGame } from '@/games/quick-math/QuickMathGame';
import { ReactionGame } from '@/games/reaction/ReactionGame';
import { SequenceGame } from '@/games/sequence/SequenceGame';
import { TargetTapGame } from '@/games/target-tap/TargetTapGame';
import { TimingGame } from '@/games/timing/TimingGame';
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
