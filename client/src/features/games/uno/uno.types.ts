/**
 * Shared types for the Uno feature slice.
 *
 * These mirror (structurally, not by import) the backend contract defined in
 * `server/src/engine/uno.ts` (UnoState / UnoCard) and `server/src/engine/interfaces.ts`
 * (IPlayer). They are declared locally rather than imported from `App.tsx` or the
 * server package so this feature slice has no compile-time dependency on either
 * (App.tsx keeps its own structurally-identical local interfaces).
 */

export type UnoColor = 'red' | 'green' | 'blue' | 'yellow';

export interface UnoCard {
  color: UnoColor | 'wild';
  value: string; // '0'-'9', 'skip', 'reverse', 'draw2', 'wild', 'wildDraw4'
}

/**
 * A room/lobby player as needed by the Uno UI. Structurally compatible with both
 * the client-local `Player` (id, name, connected, ready, color?) and the backend
 * `IPlayer` (id, name, avatarUrl?, isBot, color?) — every extra field is optional.
 */
export interface UnoPlayerLike {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot?: boolean;
  color?: string;
  connected?: boolean;
}

export interface UnoRoomLike {
  players: UnoPlayerLike[];
  lobbySettings?: Record<string, any>;
}

/**
 * Fog-of-war note: for every player except the current user, the server sends
 * `hands[playerId]` as a plain number (card count) instead of an array of cards.
 * Only the current user's own entry is a full `UnoCard[]`.
 */
export interface UnoGameSpecificState {
  hands: Record<string, UnoCard[] | number>;
  deck: UnoCard[] | number | undefined;
  discardPile: UnoCard[] | number;
  currentCard: UnoCard | null;
  currentColor: UnoColor | '';
  direction: 1 | -1;
  pendingDrawCount: number;
  unoDeclared: Record<string, boolean>;
  rankings?: string[];
  rules?: {
    cardStacking: boolean;
    cardDoubles: boolean;
  };
}

export interface UnoGameStateLike {
  activePlayerId: string;
  subState: string; // 'WAITING_FOR_PLAY' | 'PLAY_OR_PASS'
  gameSpecificState: UnoGameSpecificState;
}

export const isCardPlayable = (card: UnoCard, currentCard: UnoCard | null, currentColor: string): boolean => {
  if (!currentCard) return false;
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === currentCard.value) return true;
  return false;
};

export const getOwnHand = (gameState: UnoGameStateLike, playerId: string): UnoCard[] => {
  const hand = gameState.gameSpecificState?.hands?.[playerId];
  return Array.isArray(hand) ? hand : [];
};

export const getHandCount = (handOrCount: UnoCard[] | number | undefined): number => {
  if (typeof handOrCount === 'number') return handOrCount;
  return handOrCount?.length || 0;
};
