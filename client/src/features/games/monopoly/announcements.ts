import type { GameEvent } from '../../../types/game';
import type { MonopolySpace } from './types';

export function formatMonopolyAnnouncement(event: GameEvent, board: MonopolySpace[], playerName: (id: string) => string): string | null {
  const { type, playerId, payload } = event;
  const who = playerName(playerId ?? '');
  const property = board[payload.spaceIndex]?.name ?? 'a property';
  const side = (value: { cash?: number; properties?: number[] } = {}) => [
    ...(value.properties ?? []).map(index => board[index]?.name ?? 'a property'),
    ...(value.cash ? [`$${value.cash.toLocaleString()}`] : [])
  ].join(' + ') || 'no assets';
  switch (type) {
    case 'HOUSE_BUILT': return `${who} built ${payload.housesCount === 5 ? 'a hotel' : 'a house'} on ${property}.`;
    case 'HOUSE_SOLD': return `${who} sold a building on ${property}.`;
    case 'PROPERTY_BOUGHT': return `${who} bought ${property}.`;
    case 'TRADE_INITIATED':
    case 'TRADE_COUNTERED': return `${playerName(payload.proposerId ?? playerId ?? '')} ${type === 'TRADE_COUNTERED' ? 'countered' : 'offered'} ${side(payload.offer)} for ${side(payload.request)} with ${playerName(payload.receiverId ?? payload.targetPlayerId ?? '')}.`;
    case 'TRADE_ACCEPTED': return `${playerName(payload.proposerId)} traded with ${playerName(payload.receiverId)}: ${side(payload.offer)} ↔ ${side(payload.request)}.`;
    case 'TRADE_REJECTED': return `${who} declined the trade.`;
    default: return null;
  }
}
