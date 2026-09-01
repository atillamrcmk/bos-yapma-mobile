import { gameDefinitionMap } from '@/games/definitions';
import type { GameId } from '@/types/game';

export { gameDefinitions, getEnabledGames, gameDefinitionMap } from '@/games/definitions';
export type { GameDefinition } from '@/games/definitions';

export function getGameComponent(gameId: GameId) {
  return gameDefinitionMap[gameId].component;
}

export function getGameDefinition(gameId: GameId) {
  return gameDefinitionMap[gameId];
}
