import type { MonopolyGameState, MonopolySpace } from './types';

export function groupPortfolio(board: MonopolySpace[], state: MonopolyGameState, playerId: string) {
  const properties = state.gameSpecificState.properties;
  const groups = new Map<string, { key: string; label: string; indices: number[]; owned: number[]; missing: number[] }>();
  board.forEach((space, index) => {
    if (!['property', 'railroad', 'utility'].includes(space.type)) return;
    const key = space.group ?? space.type;
    if (!groups.has(key)) groups.set(key, { key,
      label: key === 'railroad' ? 'Airports' : key === 'utility' ? 'Utilities' : key.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
      indices: [], owned: [], missing: [] });
    const group = groups.get(key)!;
    group.indices.push(index);
    (properties[index]?.ownerId === playerId ? group.owned : group.missing).push(index);
  });
  return [...groups.values()].filter(group => group.owned.length > 0);
}

export function buildingBlockReason(board: MonopolySpace[], state: MonopolyGameState, playerId: string, index: number): string | undefined {
  const data = state.gameSpecificState;
  const space = board[index];
  const prop = data.properties[index];
  const group = board.flatMap((item, i) => item.group === space.group && item.type === 'property' ? [i] : []);
  if (state.activePlayerId !== playerId || !['WAITING_FOR_ROLL', 'WAITING_FOR_TURN_END'].includes(state.subState)) return 'Build during your turn after resolving your landing.';
  if (group.some(i => data.properties[i]?.ownerId !== playerId)) return 'Complete this set to build.';
  if (group.some(i => data.properties[i]?.mortgaged)) return 'Unmortgage the full set to build.';
  if (data.config.evenBuild !== false && group.some(i => data.properties[i].houses < prop.houses)) return 'Build evenly across this set.';
  if ((data.cash[playerId] ?? 0) < (space.houseCost ?? 0)) return `You need $${space.houseCost} to build.`;
  return undefined;
}
