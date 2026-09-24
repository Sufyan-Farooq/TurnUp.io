/**
 * Shared client-side types for room/game/socket state.
 *
 * These mirror (but intentionally do not import) the server's authoritative
 * shapes declared in `server/src/engine/interfaces.ts` (IPlayer, GameState,
 * GameEvent, etc.) and the ad-hoc payloads emitted from `server/src/server.ts`.
 * The client only ever sees the "public" fields the server chooses to send
 * (e.g. no hidden hands, no rngState), so these interfaces are deliberately
 * a looser, client-facing subset rather than a 1:1 copy.
 */

/** A player as seen in the lobby/room player list. */
export interface Player {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  /** Chosen appearance/token color, set via `select_appearance`. */
  color?: string;
}

export type GameType = 'SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY';

/** Host-controlled rules shared by the lobby UI and socket contract. */
export interface LobbySettings {
  maxPlayers: number;
  privateRoom: boolean;
  allowBots: boolean;
  startingCash: number;
  doubleRentRule: boolean;
  vacationCash: boolean;
  auction: boolean;
  prisonRent: boolean;
  mortgage: boolean;
  evenBuild: boolean;
  randomizeOrder: boolean;
  cardStacking: boolean;
  cardDoubles: boolean;
}

export type LobbySettingsPatch = Partial<LobbySettings>;

/** Lobby/room-level state (pre-game and post-game "container"). */
export interface Room {
  id: string;
  name: string;
  hostId: string;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  gameType: GameType;
  players: Player[];
  /** Host-configured game options (maxPlayers, startingCash, etc.). */
  lobbySettings?: LobbySettingsPatch;
}

/** In-progress game state, as broadcast by the server's engine manager. */
export interface GameState {
  gameId: string;
  gameType: string;
  status: string;
  activePlayerId: string;
  turnOrder: string[];
  subState: string;
  winnerId: string | null;
  players?: Player[];
  /** Game-specific payload (board, hands, cash, etc.) — opaque to the client. */
  gameSpecificState: any;
}

/** A single animation/UI cue emitted alongside a `game_state_update`. */
export interface GameEvent {
  type: string;
  playerId?: string;
  payload: Record<string, any>;
}

/** One batch of events delivered together with a `game_state_update`. */
export interface GameStateUpdate {
  gameState: GameState;
  events: GameEvent[];
  /** Local timestamp (Date.now()) this batch was received — lets consumers
   *  key off a fresh value even if two batches ever contained identical data. */
  receivedAt: number;
}

export interface ChatMessage {
  playerId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

/** Shape of the `vote_kick_started` / `_updated` payloads. Server sends
 *  additional ad-hoc fields depending on event, hence the index signature. */
export interface VoteKickState {
  targetPlayerId: string;
  initiatorId: string;
  votes?: Record<string, boolean>;
  timeoutSeconds?: number;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

/** Result of a `create_room` / `join_room` socket ack callback. */
export interface RoomActionResult {
  success: boolean;
  message?: string;
  room?: Room;
  roomId?: string;
  gameState?: GameState;
  isSpectator?: boolean;
}
