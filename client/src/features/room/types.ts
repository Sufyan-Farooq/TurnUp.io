/**
 * Shared types for the room-shell feature components extracted from App.tsx.
 * Mirrors the (currently un-exported) `Player` / `Room` interfaces defined in
 * App.tsx and the room-related socket payload shapes documented in
 * server/src/server.ts. Kept local to this feature folder so App.tsx does not
 * need to be touched to export them; when App.tsx is refactored to import
 * these components, it can either keep its own interfaces (structurally
 * compatible) or switch to importing from here.
 */

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  color?: string;
}

export type { LobbySettings, LobbySettingsPatch, Room } from '../../types/game';

export interface ChatMessage {
  playerId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

/** Mirrors the server's `vote_kick_started` / `vote_kick_updated` payload, accumulated client-side. */
export interface VoteKickState {
  targetPlayerId: string;
  initiatorId: string;
  votes: Record<string, boolean>;
  requiredVotes: number;
  yesCount?: number;
  noCount?: number;
}
