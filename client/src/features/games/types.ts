/**
 * Minimal shared shapes used by the extracted game-board feature components.
 * These intentionally mirror (a subset of) the shapes already declared
 * locally in App.tsx (`Player`, `Room`, `GameState`) rather than importing
 * from App.tsx directly, so these feature files have zero dependency on
 * App.tsx and can be wired in without touching it.
 */

/** Lobby/room player record (client-side), as used in App.tsx's `Player` type. */
export interface GamePlayer {
  id: string;
  name: string;
  connected?: boolean;
  ready?: boolean;
  color?: string;
}

/** Subset of App.tsx's `Room` type needed by these board components. */
export interface GameRoom {
  id: string;
  name?: string;
  hostId?: string;
  status?: string;
  gameType: string;
  players: GamePlayer[];
  lobbySettings?: Record<string, any>;
}

/**
 * Generic client-side GameState shape, matching server `GameState` fields
 * (server/src/engine/interfaces.ts) that the client cares about. Each game's
 * `gameSpecificState` is typed more precisely at the point of use.
 */
export interface BaseGameState<TSpecific = Record<string, any>> {
  gameId: string;
  gameType: string;
  status: string;
  activePlayerId: string;
  turnOrder: string[];
  turnIndex?: number;
  subState: string;
  winnerId: string | null;
  players?: GamePlayer[];
  gameSpecificState: TSpecific;
}
