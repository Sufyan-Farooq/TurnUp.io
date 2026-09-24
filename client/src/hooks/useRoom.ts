import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { SocketService } from '../services/socket';
import type { AuthUser, ChatMessage, LobbySettingsPatch, Player, Room, RoomActionResult, VoteKickState } from '../types/game';

export type SettingsSyncState = 'idle' | 'saving' | 'saved' | 'error';

export interface UseRoomOptions {
  /** Passive event: server just broadcast `game_started`. useGameState owns
   *  the actual GameState; this only tells the caller to flip navigation
   *  flags (e.g. `setInLobby(false); setInGame(true)`) and seed a game log. */
  onGameStarted?: () => void;
  /** Passive event: the `auth` reconnection handshake found an active game.
   *  `gameState` is the raw payload — pass it to useGameState's setter. */
  onReconnectedToGame?: (gameState: any, isSpectator: boolean) => void;
  /** The reconnect handshake restored a waiting-room session. */
  onReconnectedToLobby?: () => void;
  /** Passive event: `room_reset_to_lobby` — tells the caller to clear
   *  gameState (owned by useGameState) and flip inGame/inLobby flags. */
  onReturnedToLobby?: () => void;
  /** Passive event: this client itself was vote-kicked. Caller should reset
   *  inGame/inLobby and route back to the entry screen. */
  onSelfKicked?: () => void;
  /** Toast-equivalent one-off messages (vote kick started/failed, someone
   *  else was kicked, a spectator joined). Caller decides how to display. */
  onNotify?: (message: string) => void;
}

export interface UseRoomResult {
  room: Room | null;
  players: Player[];
  isSpectator: boolean;
  hasJoinedLobby: boolean;
  chatMessages: ChatMessage[];
  voteKickState: VoteKickState | null;
  settingsSyncState: SettingsSyncState;
  settingsSyncMessage: string | null;

  /** Wire this to `useSocket`'s `onSocketConnect` to replicate the original
   *  "attempt silent reconnection on every transport connect" behavior. */
  handleTransportConnect: (socket: Socket) => void;

  createRoom: (gameType: string, name?: string) => Promise<RoomActionResult>;
  joinRoom: (roomId: string, tokenOverride?: string) => Promise<RoomActionResult>;
  toggleReady: () => Promise<{ success: boolean; ready?: boolean }>;
  updateLobbySettings: (settings: LobbySettingsPatch) => boolean;
  selectAppearance: (color: string) => Promise<{ success: boolean }>;
  sendChat: (text: string) => void;
  initiateVoteKick: (targetPlayerId: string) => void;
  castVote: (vote: boolean) => void;
  rematch: () => Promise<{ success: boolean; message?: string }>;
  changeGameType: (gameType: 'SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY') => Promise<{ success: boolean; message?: string }>;
  /** Clears the persisted {roomId, token} session and local room state.
   *  Does not reload the page — caller (App.tsx) still owns that. */
  leaveRoomSession: () => void;
}

/**
 * Owns room/lobby state: the `Room` object, chat, vote-kick lifecycle, and
 * membership flags (`isSpectator`, `hasJoinedLobby`), plus every action that
 * mutates them. Registers listeners for all `player_*`, `host_changed`,
 * `lobby_settings_updated`, `spectator_joined`, `room_reset_to_lobby`,
 * `player_left_permanent`, `vote_kick_*`, `player_kicked`, and
 * `chat_message`. Also listens to `game_started` / `game_ended` for the
 * *room-shaped* slice of those events (updating `room`), while
 * `useGameState` independently listens to the same two events for the
 * *game* slice (`gameState`) — both hooks reacting to one broadcast is
 * intentional and keeps the two concerns decoupled.
 */
export function useRoom(
  socket: Socket | null,
  socketService: SocketService | null,
  currentUser: AuthUser | null,
  token: string,
  options: UseRoomOptions = {}
): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [voteKickState, setVoteKickState] = useState<VoteKickState | null>(null);
  const [settingsSyncState, setSettingsSyncState] = useState<SettingsSyncState>('idle');
  const [settingsSyncMessage, setSettingsSyncMessage] = useState<string | null>(null);
  const settingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmedSettingsRef = useRef<LobbySettingsPatch>({});

  // Kept in a ref so listeners registered once per `socket` can still read
  // fresh values (player names, current user id) without re-subscribing.
  const roomRef = useRef<Room | null>(null);
  roomRef.current = room;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getPlayerName = useCallback((id: string) => {
    const p = roomRef.current?.players?.find(x => x.id === id);
    return p ? p.name : 'Unknown';
  }, []);

  const handleTransportConnect = useCallback(
    (s: Socket) => {
      if (!socketService || !currentUserRef.current) return;
      const { roomId, token: sessionToken } = socketService.getSession();
      if (!roomId || !sessionToken) return;

      s.emit('auth', { token: sessionToken, roomId }, (res: RoomActionResult & { isSpectator?: boolean }) => {
        if (!res.success) {
          socketService.clearSession();
          return;
        }
        setRoom(res.room ?? null);
        setIsSpectator(!!res.isSpectator);
        confirmedSettingsRef.current = res.room?.lobbySettings ?? {};
        const meInLobby = res.room?.players?.find(p => p.id === currentUserRef.current?.id);
        setHasJoinedLobby(!!res.isSpectator || !!meInLobby?.color);

        if (res.room?.status === 'PLAYING') {
          optionsRef.current.onReconnectedToGame?.(res.gameState, !!res.isSpectator);
        } else if (res.room?.status === 'LOBBY') {
          optionsRef.current.onReconnectedToLobby?.();
        }
      });
    },
    [socketService]
  );

  // Socket event wiring.
  // NOTE: `useGameState` also listens for `game_started`, `game_ended`,
  // `room_reset_to_lobby`, and `player_kicked` on the same socket (for its
  // own slice of those payloads), so every handler here is named and
  // removed with `socket.off(event, handler)` rather than the unqualified
  // `socket.off(event)` — the latter would tear down BOTH hooks' listeners.
  useEffect(() => {
    if (!socket) return;

    const onPlayerJoined = (data: { player: Player }) => {
      setRoom(prev => (prev ? { ...prev, players: [...prev.players, data.player] } : null));
    };

    const onPlayerDisconnected = (data: { playerId: string }) => {
      setRoom(prev =>
        prev ? { ...prev, players: prev.players.map(p => (p.id === data.playerId ? { ...p, connected: false } : p)) } : null
      );
    };

    const onPlayerReconnected = (data: { playerId: string }) => {
      setRoom(prev =>
        prev ? { ...prev, players: prev.players.map(p => (p.id === data.playerId ? { ...p, connected: true } : p)) } : null
      );
    };

    const onPlayerReadyChanged = (data: { playerId: string; ready: boolean }) => {
      setRoom(prev =>
        prev ? { ...prev, players: prev.players.map(p => (p.id === data.playerId ? { ...p, ready: data.ready } : p)) } : null
      );
    };

    const onHostChanged = (data: { hostId: string }) => {
      setRoom(prev => (prev ? { ...prev, hostId: data.hostId } : null));
    };

    const onPlayerAppearanceChanged = (data: { playerId: string; color: string }) => {
      setRoom(prev =>
        prev ? { ...prev, players: prev.players.map(p => (p.id === data.playerId ? { ...p, color: data.color } : p)) } : null
      );
    };

    const onLobbySettingsUpdated = (data: { settings: LobbySettingsPatch }) => {
      confirmedSettingsRef.current = data.settings;
      setRoom(prev => (prev ? { ...prev, lobbySettings: data.settings } : null));
      if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
      settingsTimerRef.current = null;
      setSettingsSyncState('saved');
      setSettingsSyncMessage('Settings saved');
    };

    const onSpectatorJoined = (data: { player: { id: string; name: string } }) => {
      optionsRef.current.onNotify?.(`👓 Spectator ${data.player.name} joined the game.`);
    };

    const onGameStarted = (data: { room?: Room }) => {
      if (data.room) setRoom(data.room);
      optionsRef.current.onGameStarted?.();
    };

    const onRoomResetToLobby = (data: { room: Room }) => {
      setRoom(data.room);
      optionsRef.current.onReturnedToLobby?.();
    };

    const onGameEnded = () => {
      setRoom(prev => (prev ? { ...prev, status: 'ENDED' } : null));
    };

    const onPlayerLeftPermanent = (data: { playerId: string }) => {
      setRoom(prev => (prev ? { ...prev, players: prev.players.filter(p => p.id !== data.playerId) } : null));
    };

    const onVoteKickStarted = (data: VoteKickState) => {
      setVoteKickState(data);
      const targetName = getPlayerName(data.targetPlayerId);
      const initiatorName = getPlayerName(data.initiatorId);
      optionsRef.current.onNotify?.(`🚫 Vote kick started against ${targetName} by ${initiatorName}!`);
    };

    const onVoteKickUpdated = (data: Partial<VoteKickState>) => {
      setVoteKickState(prev => (prev ? { ...prev, ...data } : null));
    };

    const onVoteKickFailed = (data: { targetPlayerId: string; reason?: string }) => {
      const targetName = getPlayerName(data.targetPlayerId);
      const reason = data.reason === 'timeout' ? 'timed out' : 'failed';
      optionsRef.current.onNotify?.(`🤝 Vote kick against ${targetName} ${reason}.`);
      setVoteKickState(null);
    };

    const onPlayerKicked = (data: { targetPlayerId: string; targetName?: string; players?: Player[] }) => {
      setVoteKickState(null);
      if (data.targetPlayerId === currentUserRef.current?.id) {
        setRoom(null);
        optionsRef.current.onNotify?.('🚫 You have been vote kicked from the room!');
        optionsRef.current.onSelfKicked?.();
      } else {
        optionsRef.current.onNotify?.(`🚫 ${data.targetName} was vote kicked.`);
        if (data.players) {
          setRoom(prev => (prev ? { ...prev, players: data.players! } : null));
        }
      }
    };

    const onChatMessage = (data: ChatMessage) => {
      setChatMessages(prev => [...prev, data]);
    };

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_disconnected', onPlayerDisconnected);
    socket.on('player_reconnected', onPlayerReconnected);
    socket.on('player_ready_changed', onPlayerReadyChanged);
    socket.on('host_changed', onHostChanged);
    socket.on('player_appearance_changed', onPlayerAppearanceChanged);
    socket.on('lobby_settings_updated', onLobbySettingsUpdated);
    socket.on('spectator_joined', onSpectatorJoined);
    socket.on('game_started', onGameStarted);
    socket.on('room_reset_to_lobby', onRoomResetToLobby);
    socket.on('game_ended', onGameEnded);
    socket.on('player_left_permanent', onPlayerLeftPermanent);
    socket.on('vote_kick_started', onVoteKickStarted);
    socket.on('vote_kick_updated', onVoteKickUpdated);
    socket.on('vote_kick_failed', onVoteKickFailed);
    socket.on('player_kicked', onPlayerKicked);
    socket.on('chat_message', onChatMessage);

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_disconnected', onPlayerDisconnected);
      socket.off('player_reconnected', onPlayerReconnected);
      socket.off('player_ready_changed', onPlayerReadyChanged);
      socket.off('host_changed', onHostChanged);
      socket.off('player_appearance_changed', onPlayerAppearanceChanged);
      socket.off('lobby_settings_updated', onLobbySettingsUpdated);
      socket.off('spectator_joined', onSpectatorJoined);
      socket.off('game_started', onGameStarted);
      socket.off('room_reset_to_lobby', onRoomResetToLobby);
      socket.off('game_ended', onGameEnded);
      socket.off('player_left_permanent', onPlayerLeftPermanent);
      socket.off('vote_kick_started', onVoteKickStarted);
      socket.off('vote_kick_updated', onVoteKickUpdated);
      socket.off('vote_kick_failed', onVoteKickFailed);
      socket.off('player_kicked', onPlayerKicked);
      socket.off('chat_message', onChatMessage);
    };
  }, [socket, getPlayerName]);

  useEffect(() => () => {
    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
  }, []);

  const createRoom = useCallback(
    (gameType: string, name?: string) =>
      new Promise<RoomActionResult>(resolve => {
        if (!socket) return resolve({ success: false, message: 'Not connected.' });
        socket.emit(
          'create_room',
          { name: name || `${currentUserRef.current?.username || 'Guest'}'s Arena`, token: token || undefined, gameType },
          (res: RoomActionResult) => {
            if (res.success) {
              setRoom(res.room ?? null);
              setIsSpectator(false);
              setHasJoinedLobby(false);
              confirmedSettingsRef.current = res.room?.lobbySettings ?? {};
              if (res.roomId && token) socketService?.saveSession(res.roomId, token);
            }
            resolve(res);
          }
        );
      }),
    [socket, socketService, token]
  );

  const joinRoom = useCallback(
    (roomId: string, tokenOverride?: string) =>
      new Promise<RoomActionResult>(resolve => {
        if (!socket) return resolve({ success: false, message: 'Not connected.' });
        const authToken = tokenOverride ?? token;
        socket.emit('join_room', { roomId: roomId.toUpperCase(), token: authToken || undefined }, (res: RoomActionResult) => {
          if (res.success) {
            setRoom(res.room ?? null);
            setIsSpectator(!!res.isSpectator);
            const me = res.room?.players?.find(p => p.id === currentUserRef.current?.id);
            setHasJoinedLobby(!!res.isSpectator || !!me?.color);
            confirmedSettingsRef.current = res.room?.lobbySettings ?? {};
            if (authToken) socketService?.saveSession(res.roomId || roomId.toUpperCase(), authToken);
          }
          resolve(res);
        });
      }),
    [socket, socketService, token]
  );

  const toggleReady = useCallback(
    () =>
      new Promise<{ success: boolean; ready?: boolean }>(resolve => {
        if (!socket) return resolve({ success: false });
        socket.emit('toggle_ready', (res: { success: boolean; ready?: boolean }) => resolve(res));
      }),
    [socket]
  );

  const updateLobbySettings = useCallback(
    (settings: LobbySettingsPatch) => {
      if (!socket?.connected || roomRef.current?.hostId !== currentUserRef.current?.id) {
        setSettingsSyncState('error');
        setSettingsSyncMessage(socket?.connected ? 'Only the host can edit settings.' : 'Reconnect before changing settings.');
        return false;
      }
      const currentSettings = roomRef.current?.lobbySettings || {};
      const nextSettings = { ...currentSettings, ...settings };
      setRoom(prev => (prev ? { ...prev, lobbySettings: nextSettings } : null));
      setSettingsSyncState('saving');
      setSettingsSyncMessage('Saving changes…');
      if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
      settingsTimerRef.current = setTimeout(() => {
        setRoom(prev => (prev ? { ...prev, lobbySettings: confirmedSettingsRef.current } : null));
        setSettingsSyncState('error');
        setSettingsSyncMessage('Changes were not confirmed. Try again.');
      }, 5000);
      socket.emit('update_lobby_settings', { settings: nextSettings }, (result: { success: boolean; message?: string; settings?: LobbySettingsPatch }) => {
        if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
        settingsTimerRef.current = null;
        if (!result?.success) {
          setRoom(prev => (prev ? { ...prev, lobbySettings: confirmedSettingsRef.current } : null));
          setSettingsSyncState('error');
          setSettingsSyncMessage(result?.message || 'Could not save settings.');
          return;
        }
        if (result.settings) {
          confirmedSettingsRef.current = result.settings;
          setRoom(prev => (prev ? { ...prev, lobbySettings: result.settings } : null));
        }
        setSettingsSyncState('saved');
        setSettingsSyncMessage('Settings saved');
      });
      return true;
    },
    [socket]
  );

  const selectAppearance = useCallback(
    (color: string) =>
      new Promise<{ success: boolean }>(resolve => {
        if (!socket) return resolve({ success: false });
        socket.emit('select_appearance', { color }, (res: { success: boolean }) => {
          if (res.success) setHasJoinedLobby(true);
          resolve(res);
        });
      }),
    [socket]
  );

  const sendChat = useCallback(
    (text: string) => {
      if (!socket || !text.trim()) return;
      socket.emit('send_chat_message', { text: text.trim() });
    },
    [socket]
  );

  const initiateVoteKick = useCallback(
    (targetPlayerId: string) => {
      socket?.emit('initiate_vote_kick', { targetPlayerId });
    },
    [socket]
  );

  const castVote = useCallback(
    (vote: boolean) => {
      socket?.emit('cast_kick_vote', { vote });
    },
    [socket]
  );

  const rematch = useCallback(
    () =>
      new Promise<{ success: boolean; message?: string }>(resolve => {
        if (!socket) return resolve({ success: false, message: 'Not connected.' });
        socket.emit('rematch', (res: { success: boolean; message?: string }) => resolve(res ?? { success: true }));
      }),
    [socket]
  );

  const changeGameType = useCallback(
    (gameType: 'SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY') =>
      new Promise<{ success: boolean; message?: string }>(resolve => {
        if (!socket) return resolve({ success: false, message: 'Not connected.' });
        socket.emit('change_game_type', { gameType }, (res: { success: boolean; message?: string }) => resolve(res ?? { success: true }));
      }),
    [socket]
  );

  const leaveRoomSession = useCallback(() => {
    socketService?.clearSession();
    setRoom(null);
    setIsSpectator(false);
    setHasJoinedLobby(false);
    setChatMessages([]);
    setVoteKickState(null);
  }, [socketService]);

  return {
    room,
    players: room?.players ?? [],
    isSpectator,
    hasJoinedLobby,
    chatMessages,
    voteKickState,
    settingsSyncState,
    settingsSyncMessage,
    handleTransportConnect,
    createRoom,
    joinRoom,
    toggleReady,
    updateLobbySettings,
    selectAppearance,
    sendChat,
    initiateVoteKick,
    castVote,
    rematch,
    changeGameType,
    leaveRoomSession
  };
}
