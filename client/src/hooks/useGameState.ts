import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import type { GameEvent, GameState } from '../types/game';

export interface GameStateBatch {
  gameState: GameState;
  events: GameEvent[];
  /** Date.now() when this batch was received — always a fresh value even if
   *  two batches happen to carry identical events, so consumers can key a
   *  useEffect off it reliably. */
  receivedAt: number;
}

export interface UseGameStateResult {
  gameState: GameState | null;
  /**
   * The events delivered with the most recently applied `game_state_update`
   * (replaced, not accumulated — matches the original code, which processed
   * each batch immediately as it arrived rather than keeping history).
   * Null until the first update. Drive game-log text, sound effects, and
   * dice-roll animations off this in whatever component/hook owns them.
   */
  lastUpdate: GameStateBatch | null;
  /** Directly set gameState — escape hatch used to apply the `gameState`
   *  returned by useRoom's `onReconnectedToGame` callback (session resume
   *  finds an in-progress game) since that response doesn't come through
   *  a `game_state_update` event. */
  setGameState: (gameState: GameState | null) => void;
  /** `socket.emit('game_action', { type, payload })` wrapper. */
  sendGameAction: (type: string, payload?: Record<string, any>) => void;
}

/**
 * Owns the in-progress `GameState` and the event batches broadcast
 * alongside it. Listens to `game_state_update`, `game_started`, `game_ended`,
 * `room_reset_to_lobby`, and `player_kicked` (self-kick clears state) —
 * each independently from `useRoom`'s listeners for the same events, since
 * this hook only cares about the *game* slice of those broadcasts.
 *
 * Deliberately does NOT build game-log strings, play sounds, or drive the
 * dice-rolling animation — the original inline switch over ~30 event
 * sub-types was UI formatting/presentation logic. Consume `lastUpdate.events`
 * in whichever component renders the log/dice/sounds to reproduce that.
 */
export function useGameState(socket: Socket | null, currentUserId: string | undefined): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<GameStateBatch | null>(null);

  useEffect(() => {
    if (!socket) return;

    // NOTE: handlers are named + off'd by reference (not `socket.off(event)`)
    // because `useRoom` also listens for these same event names on the same
    // socket for its own slice of the payload — an unqualified `.off(event)`
    // would remove BOTH hooks' listeners, not just this one's.
    const onGameStarted = (data: { gameState: GameState }) => {
      setGameState(data.gameState);
      setLastUpdate(null);
    };

    const onGameStateUpdate = (data: { gameState: GameState; events: GameEvent[] }) => {
      setGameState(data.gameState);
      setLastUpdate({ gameState: data.gameState, events: data.events, receivedAt: Date.now() });
    };

    const onGameEnded = (data: { winnerId: string }) => {
      setGameState(prev => (prev ? { ...prev, status: 'GAME_OVER', winnerId: data.winnerId } : prev));
    };

    const onRoomResetToLobby = () => {
      setGameState(null);
      setLastUpdate(null);
    };

    const onPlayerKicked = (data: { targetPlayerId: string }) => {
      if (data.targetPlayerId === currentUserId) {
        setGameState(null);
        setLastUpdate(null);
      }
    };

    socket.on('game_started', onGameStarted);
    socket.on('game_state_update', onGameStateUpdate);
    socket.on('game_ended', onGameEnded);
    socket.on('room_reset_to_lobby', onRoomResetToLobby);
    socket.on('player_kicked', onPlayerKicked);

    return () => {
      socket.off('game_started', onGameStarted);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('game_ended', onGameEnded);
      socket.off('room_reset_to_lobby', onRoomResetToLobby);
      socket.off('player_kicked', onPlayerKicked);
    };
  }, [socket, currentUserId]);

  const sendGameAction = useCallback(
    (type: string, payload: Record<string, any> = {}) => {
      socket?.emit('game_action', { type, payload });
    },
    [socket]
  );

  return { gameState, lastUpdate, setGameState, sendGameAction };
}
