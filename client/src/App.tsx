import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { MessageCircle, PanelRightOpen, WifiOff, X } from 'lucide-react';

import { BoardWrapper } from './components/BoardWrapper';
import { Button, useToast } from './components/ui';

import { useAuth } from './hooks/useAuth';
import { useSocket, SERVER_URL } from './hooks/useSocket';
import { useRoom } from './hooks/useRoom';
import { useGameState } from './hooks/useGameState';
import type { GameState, Player, RoomActionResult } from './types/game';

import { AuthPage, type AuthTab } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { GameTypeModal, RoomsModal, type RoomListItem, type SelectableGameType } from './pages/LobbyBrowserPage';

import { AppearancePicker } from './features/room/AppearancePicker';
import { WaitingRoomSidebar } from './features/room/WaitingRoomSidebar';
import { LeftSidebar } from './features/room/LeftSidebar';
import { MobileLogDrawer } from './features/room/MobileLogDrawer';
import { VoteKickPanel } from './features/room/VoteKickPanel';
import { GameOverScreen } from './features/room/GameOverScreen';
import { ActivePlayersPanel } from './features/room/ActivePlayersPanel';
import { GameLogPanel } from './features/room/GameLogPanel';
import type { VoteKickState as PanelVoteKickState } from './features/room/types';
import {
  SOUNDS,
  formatGameEvent,
  getEventSound,
  getGameStartMessage,
  getLogStyles,
  playSound,
} from './features/room/gameLog';

import { getValidAppearanceColors } from './theme/playerColors';

import { SnakesLaddersBoard, type SnakesLaddersGameState } from './features/games/snakes-ladders/SnakesLaddersBoard';
import { SnakesLaddersActionBar } from './features/games/snakes-ladders/SnakesLaddersActionBar';
import { LudoBoard, type LudoGameState } from './features/games/ludo/LudoBoard';
import { LudoActionBar } from './features/games/ludo/LudoActionBar';
import { UnoBoard } from './features/games/uno/UnoBoard';
import { UnoHand } from './features/games/uno/UnoHand';
import { UnoActionBar } from './features/games/uno/UnoActionBar';
import { UnoColorPicker } from './features/games/uno/UnoColorPicker';
import type { UnoCard, UnoColor, UnoGameStateLike, UnoRoomLike } from './features/games/uno/uno.types';
import { MonopolyBoard } from './features/games/monopoly/MonopolyBoard';
import { MonopolySidebar } from './features/games/monopoly/MonopolySidebar';
import { TradeModal } from './features/games/monopoly/TradeModal';
import type { MonopolyGameState, MonopolyRoom, TradeSide } from './features/games/monopoly/types';
import type { GameRoom } from './features/games/types';

const DICE_ROLL_MIN_MS = 720;

/** Placeholder state used to render a (blurred) board while still in the lobby. */
const makeLobbyPlaceholderState = (roomId: string, gameType: string, players: Player[]): GameState =>
  ({
    gameId: roomId,
    gameType,
    status: 'LOBBY',
    players: players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
    activePlayerId: '',
    turnOrder: players.map(p => p.id),
    turnIndex: 0,
    subState: '',
    winnerId: null,
    historyLength: 0,
    gameSpecificState: {
      positions: {},
      cash: {},
      inJail: {},
      jailTurns: {},
      bankrupt: {},
      properties: {},
      doubleRollCount: 0,
      lastRoll: [0, 0],
      tokens: {},
      hands: {},
      deck: 0,
      currentCard: null,
      currentColor: '',
      unoDeclared: {},
      pendingDrawCount: 0,
      ladders: {},
      snakes: {},
    },
  }) as unknown as GameState;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // ── Identity ────────────────────────────────────────────────────────────
  const auth = useAuth();
  const currentUser = auth.currentUser;
  const playerId = currentUser?.id ?? '';

  // ── Socket / room / game state (all owned by hooks) ──────────────────────
  // `useRoom` needs the live socket, and `useSocket` needs `useRoom`'s
  // transport-connect handler; the ref breaks that cycle without changing the
  // "silently resume session on every connect" behavior.
  const transportConnectRef = useRef<((s: Socket) => void) | null>(null);
  const onSocketConnect = useCallback((s: Socket) => transportConnectRef.current?.(s), []);

  const { socket, socketService, isConnected, actionError, clearActionError } = useSocket(
    auth.token,
    currentUser?.id,
    { onSocketConnect }
  );

  const game = useGameState(socket, currentUser?.id);

  // ── Presentation state that the hooks deliberately do not own ────────────
  const [authTab, setAuthTab] = useState<AuthTab>('guest');
  const [joinCode, setJoinCode] = useState('');
  const [inLobby, setInLobby] = useState(false);
  const [, setInGame] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentDiceValue, setCurrentDiceValue] = useState(1);
  const [heldState, setHeldState] = useState<GameState | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSendError, setChatSendError] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [roomRailTab, setRoomRailTab] = useState<'chat' | 'activity'>('chat');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [showGameTypeModal, setShowGameTypeModal] = useState(false);
  const [selectedLobbyColor, setSelectedLobbyColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCardIndices, setPendingWildCardIndices] = useState<number[] | null>(null);
  const [tradeModalTargetId, setTradeModalTargetId] = useState<string | null>(null);
  const [voteKickCountdown, setVoteKickCountdown] = useState(60);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mobileChatEndRef = useRef<HTMLDivElement>(null);
  const lastActivePlayerIdRef = useRef<string | null>(null);
  const prevGameStateRef = useRef<GameState | null>(null);
  const rollTimersRef = useRef<{ timeout?: ReturnType<typeof setTimeout> }>({});
  const rollStartedAtRef = useRef(0);
  const rollInFlightRef = useRef(false);
  const seededGameIdRef = useRef<string | null>(null);
  const pendingLogSeedRef = useRef<string | null>(null);
  const joinAttemptedRef = useRef<string | null>(null);
  const rightSidebarTriggerRef = useRef<HTMLButtonElement>(null);
  const rightSidebarCloseRef = useRef<HTMLButtonElement>(null);
  const chatToggleRef = useRef<HTMLButtonElement>(null);

  const appendLog = useCallback((line: string) => setGameLog(prev => [...prev, line]), []);

  const closeRightSidebar = useCallback((restoreFocus = true) => {
    setIsRightSidebarOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => rightSidebarTriggerRef.current?.focus());
    }
  }, []);

  const closeChatDrawer = useCallback(() => {
    setIsLeftSidebarOpen(false);
    window.requestAnimationFrame(() => chatToggleRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isRightSidebarOpen) return;

    window.requestAnimationFrame(() => rightSidebarCloseRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRightSidebar();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = document.getElementById('desktop-sidebar');
      const focusable = Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(element => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeRightSidebar, isRightSidebarOpen]);

  const roomApi = useRoom(socket, socketService, currentUser, auth.token, {
    onGameStarted: () => {
      setInLobby(false);
      setInGame(true);
    },
    onReconnectedToGame: (gameState, isSpectating) => {
      pendingLogSeedRef.current = isSpectating ? 'Spectating active game.' : 'Reconnected to active session.';
      game.setGameState(gameState);
      setInLobby(false);
      setInGame(true);
    },
    onReconnectedToLobby: () => {
      setInGame(false);
      setInLobby(true);
    },
    onReturnedToLobby: () => {
      seededGameIdRef.current = null;
      setInGame(false);
      setInLobby(true);
      setGameLog(['Returned to lobby.']);
    },
    onSelfKicked: () => {
      seededGameIdRef.current = null;
      setInGame(false);
      setInLobby(false);
      setGameLog([]);
      navigate('/', { replace: true });
    },
    onNotify: message => showToast(message, 'warning'),
  });
  transportConnectRef.current = roomApi.handleTransportConnect;

  const room = roomApi.room;

  // Refs so socket listeners / async callbacks always read fresh values.
  const roomRef = useRef(room);
  roomRef.current = room;
  const gameStateRef = useRef(game.gameState);
  gameStateRef.current = game.gameState;

  const getPlayerName = useCallback((id: string) => {
    const p =
      roomRef.current?.players?.find(x => x.id === id) ||
      gameStateRef.current?.players?.find(x => x.id === id);
    return p ? p.name : 'Unknown';
  }, []);

  // ── Routing ─────────────────────────────────────────────────────────────
  const routeRoomId = useMemo(() => {
    const match = location.pathname.match(/^\/(?:room|join)\/([^/]+)/);
    return match ? decodeURIComponent(match[1]).toUpperCase() : null;
  }, [location.pathname]);

  // Keep the URL in sync with the room we're actually in.
  useEffect(() => {
    if (room && routeRoomId !== room.id) {
      navigate(`/room/${room.id}`, { replace: true });
    }
  }, [room, routeRoomId, navigate]);

  const applyJoinResult = useCallback(
    (res: RoomActionResult) => {
      if (res.room?.status === 'PLAYING') {
        pendingLogSeedRef.current = res.isSpectator ? 'Joined as spectator.' : 'Joined active game.';
        game.setGameState(res.gameState ?? null);
        setInLobby(false);
        setInGame(true);
      } else {
        setInGame(false);
        setInLobby(true);
      }
    },
    [game]
  );

  // Deep link / refresh on /room/:id — the transport-connect session resume
  // gets first shot; if it did not put us in a room, join explicitly.
  useEffect(() => {
    if (!routeRoomId || !isConnected || !currentUser || room) return;
    if (joinAttemptedRef.current === routeRoomId) return;
    joinAttemptedRef.current = routeRoomId;

    const timer = setTimeout(() => {
      if (roomRef.current) return;
      void roomApi.joinRoom(routeRoomId).then(res => {
        if (res.success) {
          applyJoinResult(res);
        } else {
          showToast(res.message || 'Could not join that room.', 'error');
          navigate('/', { replace: true });
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [routeRoomId, isConnected, currentUser, room, roomApi, applyJoinResult, showToast, navigate]);

  // ── Server-rejected actions surface as toasts (never alert()) ────────────
  useEffect(() => {
    if (!actionError) return;
    showToast(actionError, 'error');
    clearActionError();
  }, [actionError, showToast, clearActionError]);

  // ── Log lines for room-level events the hooks only expose as state ───────
  useEffect(() => {
    if (!socket) return;

    const onPlayerJoined = (data: { player: Player }) => appendLog(`${data.player.name} joined the lobby.`);
    const onPlayerDisconnected = () => appendLog('Player disconnected. Waiting 30s for recovery...');
    const onPlayerReconnected = (data: { playerId: string }) => appendLog(`${getPlayerName(data.playerId)} returned online.`);
    const onHostChanged = () => appendLog('Host privileges migrated.');
    const onSpectatorJoined = (data: { player: { name: string } }) => appendLog(`Spectator ${data.player.name} joined the game.`);
    const onGameEnded = (data: { winnerId: string }) => appendLog(`Game Over! ${getPlayerName(data.winnerId)} has won the game!`);
    const onChatMessage = (data: { playerId: string }) => {
      if (data.playerId !== playerId) {
        playSound(SOUNDS.chatIn);
        const compact = window.matchMedia('(max-width: 1100px)').matches;
        if ((compact && !isLeftSidebarOpen) || (!compact && roomRailTab !== 'chat')) {
          setUnreadChatCount(count => count + 1);
        }
      }
    };

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_disconnected', onPlayerDisconnected);
    socket.on('player_reconnected', onPlayerReconnected);
    socket.on('host_changed', onHostChanged);
    socket.on('spectator_joined', onSpectatorJoined);
    socket.on('game_ended', onGameEnded);
    socket.on('chat_message', onChatMessage);

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_disconnected', onPlayerDisconnected);
      socket.off('player_reconnected', onPlayerReconnected);
      socket.off('host_changed', onHostChanged);
      socket.off('spectator_joined', onSpectatorJoined);
      socket.off('game_ended', onGameEnded);
      socket.off('chat_message', onChatMessage);
    };
  }, [socket, appendLog, getPlayerName, playerId, isLeftSidebarOpen, roomRailTab]);

  // ── Seed the log whenever a *new* game begins (start / rematch / resume) ──
  const activeGameId = game.gameState?.gameId;
  const activeGameType = game.gameState?.gameType;
  useEffect(() => {
    if (!activeGameId || activeGameId === seededGameIdRef.current) return;
    seededGameIdRef.current = activeGameId;
    const override = pendingLogSeedRef.current;
    pendingLogSeedRef.current = null;
    if (override) {
      setGameLog([override]);
    } else {
      setGameLog([getGameStartMessage(activeGameType)]);
      playSound(SOUNDS.gameStart);
    }
  }, [activeGameId, activeGameType]);

  // ── Event batch -> dice animation, sounds, log lines ─────────────────────
  // NOTE: declared *before* the prev-state tracker below so that, within one
  // commit, `prevGameStateRef` still holds the previous game state (used to
  // freeze the board for the duration of a remote player's dice animation).
  useEffect(() => {
    const update = game.lastUpdate;
    if (!update) return;

    const applyBatch = () => {
      setHeldState(null);

      const roll = update.events.find(e => e.type === 'DICE_ROLLED');
      if (roll) {
        if (roll.payload?.value !== undefined) setCurrentDiceValue(roll.payload.value);
        else if (roll.payload?.total !== undefined) setCurrentDiceValue(roll.payload.total);
      }

      const activeId = update.gameState.activePlayerId;
      if (activeId && activeId !== lastActivePlayerIdRef.current) {
        lastActivePlayerIdRef.current = activeId;
        if (activeId === playerId) playSound(SOUNDS.yourTurn);
      }

      const lines: string[] = [];
      update.events.forEach(evt => {
        const sound = getEventSound(evt.type);
        if (sound) playSound(sound);
        const line = formatGameEvent(evt, { getPlayerName, gameType: roomRef.current?.gameType });
        if (line) lines.push(line);
      });
      if (lines.length > 0) setGameLog(prev => [...prev, ...lines]);
    };

    const rollEvent = update.events.find(e => e.type === 'DICE_ROLLED');
    if (rollEvent && (update.gameState.gameType === 'LUDO' || update.gameState.gameType === 'SNAKES_LADDERS')) {
      if (rollTimersRef.current.timeout) clearTimeout(rollTimersRef.current.timeout);
      const isLocalRoll = rollEvent.playerId === playerId;
      const elapsed = isLocalRoll ? Date.now() - rollStartedAtRef.current : 0;
      const remaining = Math.max(0, DICE_ROLL_MIN_MS - elapsed);
      // Preserve the previous board until the authoritative roll is ready to
      // land, so a move prompt cannot appear ahead of the die's result.
      setHeldState(prevGameStateRef.current);
      setIsRolling(true);
      rollTimersRef.current.timeout = setTimeout(() => {
        rollInFlightRef.current = false;
        setIsRolling(false);
        applyBatch();
      }, remaining);
      return;
    }

    applyBatch();
  }, [game.lastUpdate, getPlayerName, playerId]);

  useEffect(() => {
    prevGameStateRef.current = game.gameState;
  }, [game.gameState]);

  useEffect(
    () => () => {
      if (rollTimersRef.current.timeout) clearTimeout(rollTimersRef.current.timeout);
    },
    []
  );

  // ── Vote-kick countdown (server sends timeoutSeconds, default 60) ─────────
  const voteKickState = roomApi.voteKickState;
  const voteKickKey = voteKickState ? `${voteKickState.targetPlayerId}:${voteKickState.initiatorId}` : null;
  useEffect(() => {
    setVoteKickCountdown(voteKickState?.timeoutSeconds ?? 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteKickKey]);

  useEffect(() => {
    if (!voteKickKey) return;
    const interval = setInterval(() => setVoteKickCountdown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [voteKickKey]);

  // ── Chat auto-scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    for (const anchor of [chatEndRef.current, mobileChatEndRef.current]) {
      if (anchor?.offsetParent) anchor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [roomApi.chatMessages]);

  useEffect(() => {
    if (isLeftSidebarOpen || roomRailTab === 'chat' && !window.matchMedia('(max-width: 1100px)').matches) {
      setUnreadChatCount(0);
    }
  }, [isLeftSidebarOpen, roomRailTab]);

  // ── Lobby appearance: keep the pre-selected swatch valid & available ─────
  const maxPlayersSetting: number = room?.lobbySettings?.maxPlayers || 4;
  const availableColors = useMemo(
    () => getValidAppearanceColors(room?.gameType, maxPlayersSetting),
    [room?.gameType, maxPlayersSetting]
  );

  useEffect(() => {
    if (!inLobby || roomApi.hasJoinedLobby) return;
    if (selectedLobbyColor && availableColors.includes(selectedLobbyColor)) return;
    const taken = (room?.players ?? []).filter(p => p.id !== playerId && p.color).map(p => p.color);
    const free = availableColors.filter(c => !taken.includes(c));
    setSelectedLobbyColor(free[0] || availableColors[0] || '');
  }, [inLobby, roomApi.hasJoinedLobby, selectedLobbyColor, availableColors, room?.players, playerId]);

  // Ludo only supports 4- or 6-seat boards; normalize any stale setting.
  useEffect(() => {
    if (room?.gameType !== 'LUDO' || room?.hostId !== playerId) return;
    const current = room?.lobbySettings?.maxPlayers || 4;
    if (current !== 4 && current !== 6) roomApi.updateLobbySettings({ maxPlayers: 4 });
  }, [room?.gameType, room?.hostId, room?.lobbySettings?.maxPlayers, playerId, roomApi]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleSendChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    setIsSendingChat(true);
    setChatSendError(null);
    const result = await roomApi.sendChat(chatInput);
    setIsSendingChat(false);
    if (result.success) {
      playSound(SOUNDS.chatOut);
      setChatInput('');
    } else {
      const message = result.message || 'Message could not be sent.';
      setChatSendError(message);
      showToast(message, 'warning');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${room?.id || ''}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCreateRoom = async (gameType: SelectableGameType) => {
    setShowGameTypeModal(false);
    const res = await roomApi.createRoom(gameType);
    if (res.success) {
      setInGame(false);
      setInLobby(true);
    } else {
      showToast(res.message || 'Could not create the room.', 'error');
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    const res = await roomApi.joinRoom(joinCode);
    if (res.success) applyJoinResult(res);
    else showToast(res.message || 'Could not join that room.', 'error');
  };

  const handleJoinListedRoom = async (listed: RoomListItem) => {
    setShowRoomsModal(false);
    setJoinCode(listed.id);
    const res = await roomApi.joinRoom(listed.id);
    if (res.success) applyJoinResult(res);
    else showToast(res.message || 'Could not join that room.', 'error');
  };

  const handlePlayNow = async () => {
    if (!auth.token || !currentUser) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/rooms`);
      const rooms: RoomListItem[] = await response.json();
      const openLobby = rooms.find(r => r.status === 'LOBBY' && r.playersCount < 4);
      if (openLobby) {
        setJoinCode(openLobby.id);
        const res = await roomApi.joinRoom(openLobby.id);
        if (res.success) applyJoinResult(res);
        else showToast(res.message || 'Could not join that room.', 'error');
      } else {
        setShowGameTypeModal(true);
      }
    } catch (err) {
      console.error(err);
      setShowGameTypeModal(true);
    }
  };

  const handleStartGame = () => {
    if (!socket || room?.hostId !== playerId) return;
    socket.emit('start_game', {}, (res: { success: boolean; message?: string }) => {
      if (!res?.success) showToast(res?.message || 'Could not start the game.', 'error');
      else setIsRightSidebarOpen(false);
    });
  };

  const handleLeaveGame = () => {
    setIsRightSidebarOpen(false);
    setIsLeftSidebarOpen(false);
    setIsDrawerOpen(false);
    setUnreadChatCount(0);
    setRoomRailTab('chat');
    setChatSendError(null);
    roomApi.leaveRoomSession();
    game.setGameState(null);
    seededGameIdRef.current = null;
    joinAttemptedRef.current = null;
    lastActivePlayerIdRef.current = null;
    setInLobby(false);
    setInGame(false);
    setGameLog([]);
    setChatInput('');
    setHeldState(null);
    setTradeModalTargetId(null);
    setShowColorPicker(false);
    setPendingWildCardIndices(null);
    navigate('/');
  };

  const handleLogout = () => {
    roomApi.leaveRoomSession();
    setIsLeftSidebarOpen(false);
    setUnreadChatCount(0);
    setRoomRailTab('chat');
    auth.logout();
    setInLobby(false);
    setInGame(false);
    navigate('/');
  };

  const handleRollDice = () => {
    if (!socket || rollInFlightRef.current || isRolling || !game.gameState) return;
    rollInFlightRef.current = true;
    rollStartedAtRef.current = Date.now();
    setIsRolling(true);
    // Send now: the server chooses the result while the die is in motion.
    game.sendGameAction('ROLL_DICE');
    // Recover the control if the request fails or a roll event never arrives.
    rollTimersRef.current.timeout = setTimeout(() => {
      rollInFlightRef.current = false;
      setIsRolling(false);
    }, 5000);
  };

  // Uno: the parent owns wild-card orchestration (UnoHand/UnoActionBar never
  // pick a color themselves).
  const handlePlayCards = (indices: number[]) => {
    const gs = game.gameState;
    if (!gs || indices.length < 1 || indices.length > 2) return;
    const hand = gs.gameSpecificState?.hands?.[playerId] as UnoCard[] | undefined;
    const lastCard = hand?.[indices[indices.length - 1]];
    if (!lastCard) return;

    if (lastCard.color === 'wild') {
      setPendingWildCardIndices(indices);
      setShowColorPicker(true);
      return;
    }
    game.sendGameAction('PLAY_CARD', indices.length === 2 ? { cardIndices: indices } : { cardIndex: indices[0] });
  };

  const handleSelectWildColor = (color: UnoColor) => {
    const indices = pendingWildCardIndices;
    if (indices && indices.length > 0) {
      game.sendGameAction(
        'PLAY_CARD',
        indices.length === 2
          ? { cardIndices: indices, selectedColor: color }
          : { cardIndex: indices[0], selectedColor: color }
      );
    }
    setPendingWildCardIndices(null);
    setShowColorPicker(false);
  };

  // ── Derived render state ────────────────────────────────────────────────
  const displayGameState = heldState ?? game.gameState;
  const gameStateForBoard =
    displayGameState ??
    (room ? makeLobbyPlaceholderState(room.id, room.gameType, room.players) : null);
  const activePlayer =
    room?.players?.find(p => p.id === gameStateForBoard?.activePlayerId) ||
    gameStateForBoard?.players?.find(p => p.id === gameStateForBoard?.activePlayerId);
  const isMyTurn = !!gameStateForBoard && gameStateForBoard.activePlayerId === playerId;

  // ── Landing / auth screen ───────────────────────────────────────────────
  const renderLanding = () => (
    <div className="landing-screen">
      <div className="landing-screen__intro">
        <span className="landing-screen__mark">turn<span>Up</span>.io</span>
        <h1>Bring everyone<br />to the table.</h1>
        <p>One room for familiar games, live turns, and the conversation that makes game night yours.</p>
        <div className="landing-screen__game-list" aria-label="Available games">
          <span>Ludo</span><span>UNO</span><span>Monopoly</span><span>Snakes &amp; Ladders</span>
        </div>
        <div className="landing-screen__table" aria-hidden="true">
          <span className="landing-screen__table-center" />
          <span className="landing-screen__piece landing-screen__piece--one" />
          <span className="landing-screen__piece landing-screen__piece--two" />
          <span className="landing-screen__piece landing-screen__piece--three" />
          <span className="landing-screen__piece landing-screen__piece--four" />
        </div>
      </div>
      <div className="landing-screen__entry">{authTab === 'guest' && currentUser ? (
        <LandingPage
          currentUser={currentUser}
          isConnected={isConnected}
          joinCode={joinCode}
          onJoinCodeChange={setJoinCode}
          onPlayNow={() => void handlePlayNow()}
          onBrowseRooms={() => setShowRoomsModal(true)}
          onCreatePrivateGame={() => setShowGameTypeModal(true)}
          onJoinRoom={() => void handleJoinByCode()}
          onLogout={handleLogout}
        />
      ) : (
        <AuthPage authTab={authTab} onAuthTabChange={setAuthTab} onAuthenticated={auth.applySession} />
      )}</div>

      <RoomsModal
        open={showRoomsModal}
        onClose={() => setShowRoomsModal(false)}
        onJoinRoom={listed => void handleJoinListedRoom(listed)}
      />
      <GameTypeModal
        open={showGameTypeModal}
        onClose={() => setShowGameTypeModal(false)}
        onSelectGameType={gameType => void handleCreateRoom(gameType)}
      />
    </div>
  );

  // ── Board / action bar per game type ────────────────────────────────────
  const renderBoard = () => {
    if (!room || !gameStateForBoard) return null;
    const boardRoom = room as unknown as GameRoom;

    switch (room.gameType) {
      case 'SNAKES_LADDERS':
        return <SnakesLaddersBoard gameState={gameStateForBoard as unknown as SnakesLaddersGameState} room={boardRoom} />;
      case 'LUDO':
        return (
          <LudoBoard
            gameState={gameStateForBoard as unknown as LudoGameState}
            room={boardRoom}
            currentUserId={playerId}
            onMoveToken={tokenIndex => game.sendGameAction('MOVE_TOKEN', { tokenIndex })}
          />
        );
      case 'UNO':
        return (
          <BoardWrapper>
            <UnoBoard
              gameState={gameStateForBoard as unknown as UnoGameStateLike}
              room={room as unknown as UnoRoomLike}
              currentUserId={playerId}
              onDrawCard={() => game.sendGameAction('DRAW_CARD')}
              onChallengeUno={targetPlayerId => game.sendGameAction('CHALLENGE_UNO', { targetPlayerId })}
              recentLogs={gameLog}
              isPreview={!displayGameState}
            >
              <UnoHand
                gameState={gameStateForBoard as unknown as UnoGameStateLike}
                currentUserId={playerId}
                isPreview={!displayGameState}
                onPlayCard={cardIndex => handlePlayCards([cardIndex])}
                onPlayDoubles={indices => handlePlayCards(indices)}
                onError={message => showToast(message, 'warning')}
              />
            </UnoBoard>
          </BoardWrapper>
        );
      case 'MONOPOLY':
        return (
          <BoardWrapper>
            <MonopolyBoard
              gameState={gameStateForBoard as unknown as MonopolyGameState}
              room={room as unknown as MonopolyRoom}
              currentUserId={playerId}
              onRollDice={() => game.sendGameAction('ROLL_DICE')}
              onBuyProperty={() => game.sendGameAction('BUY_PROPERTY')}
              onEndTurn={() => game.sendGameAction('END_TURN')}
              onPayJailFine={() => game.sendGameAction('PAY_JAIL_FINE')}
              onMortgage={i => game.sendGameAction('MORTGAGE', { spaceIndex: i, tileIndex: i })}
              onUnmortgage={i => game.sendGameAction('UNMORTGAGE', { spaceIndex: i, tileIndex: i })}
              onSellProperty={i => game.sendGameAction('SELL_PROPERTY', { spaceIndex: i })}
              onBuildHouse={i => game.sendGameAction('BUILD_HOUSE', { spaceIndex: i, tileIndex: i })}
              onSellHouse={i => game.sendGameAction('SELL_HOUSE', { spaceIndex: i, tileIndex: i })}
              onDeclareBankruptcy={() => game.sendGameAction('DECLARE_BANKRUPTCY')}
              onBid={amount => game.sendGameAction('BID', { amount })}
              onFold={() => game.sendGameAction('FOLD')}
              recentLogs={gameLog}
            />
          </BoardWrapper>
        );
      default:
        return <div>Unknown game type</div>;
    }
  };

  const renderActionBar = () => {
    if (!room || !gameStateForBoard) return null;

    if (roomApi.isSpectator) {
      return (
        <div style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 700, padding: '10px 0' }}>
          You are spectating this match.
        </div>
      );
    }

    switch (room.gameType) {
      case 'SNAKES_LADDERS':
        return (
          <SnakesLaddersActionBar
            isMyTurn={isMyTurn}
            isRolling={isRolling}
            currentDiceValue={currentDiceValue}
            onRollDice={handleRollDice}
          />
        );
      case 'LUDO':
        return (
          <LudoActionBar
            isMyTurn={isMyTurn}
            isRolling={isRolling}
            currentDiceValue={currentDiceValue}
            isWaitingForTokenMove={gameStateForBoard.subState === 'WAITING_FOR_TOKEN_MOVE'}
            activePlayerName={activePlayer?.name}
            onRollDice={handleRollDice}
          />
        );
      case 'UNO':
        return (
          <UnoActionBar
            gameState={gameStateForBoard as unknown as UnoGameStateLike}
            currentUserId={playerId}
            isPreview={!displayGameState}
            onDrawCard={() => game.sendGameAction('DRAW_CARD')}
            onPlayCard={cardIndex => handlePlayCards([cardIndex])}
            onDeclareUno={() => game.sendGameAction('DECLARE_UNO')}
          />
        );
      default:
        return null;
    }
  };

  // ── In-room shell (waiting room / active game / game over) ───────────────
  const renderRoomShell = () => {
    if (!currentUser) return renderLanding();
    if (!room || !gameStateForBoard) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100dvh',
            color: 'var(--text-secondary)',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {isConnected ? 'Joining room…' : 'Connecting to the server…'}
        </div>
      );
    }

    const isMonopoly = room.gameType === 'MONOPOLY';
    const showAppearancePicker = inLobby && !roomApi.hasJoinedLobby;

    return (
      <div className="game-shell" data-game={room.gameType}>
        {!isConnected && (
          <div className="connection-banner" role="status" aria-live="polite">
            <WifiOff size={15} /> Connection lost. Reconnecting…
          </div>
        )}
        <div className={`left-sidebar-overlay ${isLeftSidebarOpen ? 'active' : ''}`} onClick={closeChatDrawer} />
        <button
          type="button"
          className={`game-sidebar-overlay ${isRightSidebarOpen ? 'active' : ''}`}
          onClick={() => closeRightSidebar()}
          aria-label="Close game panel"
          aria-hidden={!isRightSidebarOpen}
          tabIndex={isRightSidebarOpen ? 0 : -1}
        />

        <LeftSidebar
          roomId={room.id}
          isOpen={isLeftSidebarOpen}
          onClose={closeChatDrawer}
          chatMessages={roomApi.chatMessages}
          currentPlayerId={playerId}
          chatInput={chatInput}
          onChatInputChange={value => { setChatInput(value); setChatSendError(null); }}
          onSendChat={() => void handleSendChat()}
          copiedLink={copiedLink}
          onCopyLink={handleCopyLink}
          chatEndRef={mobileChatEndRef}
          placement="mobile"
          isConnected={isConnected}
          isSending={isSendingChat}
          sendError={chatSendError}
        />

        <button ref={chatToggleRef} className="chat-toggle-btn" onClick={() => isLeftSidebarOpen ? closeChatDrawer() : setIsLeftSidebarOpen(true)} aria-label={unreadChatCount ? `Open room chat, ${unreadChatCount} unread messages` : 'Open room chat'} aria-expanded={isLeftSidebarOpen}>
          {isLeftSidebarOpen ? <X size={20} /> : <MessageCircle size={20} />}
          {!isLeftSidebarOpen && unreadChatCount > 0 && <span className="chat-unread-badge" aria-hidden="true">{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>}
        </button>
        <button
          ref={rightSidebarTriggerRef}
          type="button"
          className="game-sidebar-toggle"
          onClick={() => setIsRightSidebarOpen(true)}
          aria-label={inLobby ? 'Open lobby settings and players' : 'Open players and game details'}
          aria-controls="desktop-sidebar"
          aria-expanded={isRightSidebarOpen}
        >
          <PanelRightOpen size={20} aria-hidden="true" />
        </button>

        {/* Game area */}
        <main className="game-main">
          <div className="hud-bar">
            <div className="hud-identity">
              <span className="hud-brand">
                <span className="turn">turn</span>
                <span className="up">Up</span>
              </span>
              <span className="hud-game-badge">{room.gameType.replace(/_/g, ' ')}</span>
              <button type="button" className="hud-room-code" onClick={handleCopyLink} aria-label={`Copy invite link for room ${room.id}`} title="Copy invite link">
                Room {room.id} {copiedLink ? '· Copied' : '· Copy invite'}
              </button>
            </div>

            <div className="hud-actions">
              {!inLobby && (
                <button type="button" id="mobile-log-trigger" className="hud-log-trigger" onClick={() => setIsDrawerOpen(true)} aria-label="Open match log">
                  Log
                </button>
              )}
              {!inLobby ? (
                <span className={`hud-turn-pill ${isMyTurn ? 'my-turn' : 'other-turn'}`} role="status" aria-live="polite">
                  <span className="hud-turn-dot" aria-hidden="true" />
                  {isMyTurn ? 'Your Turn' : `${activePlayer?.name ?? 'Opponent'}'s Turn`}
                </span>
              ) : (
                <span className="hud-turn-pill lobby-mode">Lobby</span>
              )}
              <Button variant="secondary" onClick={handleLeaveGame} style={{ padding: '6px 14px', fontSize: '13px' }}>
                Exit
              </Button>
            </div>
          </div>

          {/* Board */}
          <div className="game-board-stage">
            <div
              className={`game-board-content ${showAppearancePicker ? 'is-obscured' : ''}`}
            >
              {renderBoard()}
            </div>

            {showAppearancePicker && (
              <div className="appearance-picker-layer">
                <AppearancePicker
                  currentUserId={playerId}
                  players={room.players}
                  gameType={room.gameType}
                  maxPlayers={maxPlayersSetting}
                  availableColors={availableColors}
                  selectedColor={selectedLobbyColor}
                  onSelectColor={setSelectedLobbyColor}
                  onConfirm={() => void roomApi.selectAppearance(selectedLobbyColor)}
                />
              </div>
            )}
          </div>

          {/* Action zone (Monopoly keeps its controls inside the board's center panel) */}
          {!isMonopoly && (
            <div className="game-action-dock game-action-dock--mobile">
              {renderActionBar()}
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <div
          id="desktop-sidebar"
          className={`game-sidebar ${isRightSidebarOpen ? 'open' : ''}`}
          role={isRightSidebarOpen ? 'dialog' : 'complementary'}
          aria-modal={isRightSidebarOpen ? 'true' : undefined}
          aria-label={inLobby ? 'Lobby controls' : 'Game details'}
        >
          <div className="game-sidebar__mobile-header">
            <div>
              <strong>{inLobby ? 'Lobby controls' : isMonopoly ? 'Portfolio & trades' : 'Players & activity'}</strong>
              <span>{room.gameType.replace(/_/g, ' ')}</span>
            </div>
            <button
              ref={rightSidebarCloseRef}
              type="button"
              className="game-sidebar__close"
              onClick={() => closeRightSidebar()}
              aria-label="Close game panel"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="room-rail__primary">{inLobby ? (
            <WaitingRoomSidebar
              room={room}
              currentPlayerId={playerId}
              isConnected={isConnected}
              settingsSyncState={roomApi.settingsSyncState}
              settingsSyncMessage={roomApi.settingsSyncMessage}
              onUpdateSettings={roomApi.updateLobbySettings}
              onKickPlayer={roomApi.initiateVoteKick}
              onStartGame={handleStartGame}
              onClose={isRightSidebarOpen ? () => closeRightSidebar() : undefined}
            />
          ) : isMonopoly ? (
            <MonopolySidebar
              gameState={gameStateForBoard as unknown as MonopolyGameState}
              room={room as unknown as MonopolyRoom}
              currentUserId={playerId}
              onMortgage={i => game.sendGameAction('MORTGAGE', { spaceIndex: i, tileIndex: i })}
              onUnmortgage={i => game.sendGameAction('UNMORTGAGE', { spaceIndex: i, tileIndex: i })}
              onBuildHouse={i => game.sendGameAction('BUILD_HOUSE', { spaceIndex: i, tileIndex: i })}
              onSellHouse={i => game.sendGameAction('SELL_HOUSE', { spaceIndex: i, tileIndex: i })}
              onOpenTradeWith={setTradeModalTargetId}
            />
          ) : (
            <ActivePlayersPanel
              players={room.players}
              currentPlayerId={playerId}
              gameType={room.gameType}
              positions={gameStateForBoard.gameSpecificState?.positions}
              hands={gameStateForBoard.gameSpecificState?.hands}
              activePlayerId={gameStateForBoard.activePlayerId}
              onKickPlayer={roomApi.initiateVoteKick}
            />
          )}</div>

          {!inLobby && !isMonopoly && !roomApi.isSpectator && (
            <div className="game-action-dock game-action-dock--rail">{renderActionBar()}</div>
          )}

          <div className="room-rail__secondary">
            <div className="room-rail__tabs" role="tablist" aria-label="Room conversation and activity">
              <button type="button" role="tab" aria-selected={roomRailTab === 'chat'} onClick={() => setRoomRailTab('chat')} className={roomRailTab === 'chat' ? 'is-active' : ''}>
                Chat {unreadChatCount > 0 && <span className="room-rail__unread">{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>}
              </button>
              <button type="button" role="tab" aria-selected={roomRailTab === 'activity'} onClick={() => setRoomRailTab('activity')} className={roomRailTab === 'activity' ? 'is-active' : ''}>Match log</button>
            </div>
            <div className="room-rail__tab-panel" role="tabpanel">
              {roomRailTab === 'chat' ? (
                <LeftSidebar
                  roomId={room.id}
                  isOpen={false}
                  onClose={() => undefined}
                  chatMessages={roomApi.chatMessages}
                  currentPlayerId={playerId}
                  chatInput={chatInput}
                  onChatInputChange={value => { setChatInput(value); setChatSendError(null); }}
                  onSendChat={() => void handleSendChat()}
                  copiedLink={copiedLink}
                  onCopyLink={handleCopyLink}
                  chatEndRef={chatEndRef}
                  placement="rail"
                  isConnected={isConnected}
                  isSending={isSendingChat}
                  sendError={chatSendError}
                />
              ) : <GameLogPanel gameLog={gameLog} />}
            </div>
          </div>
        </div>

        {/* Overlays */}
        <UnoColorPicker
          isOpen={showColorPicker}
          onSelectColor={handleSelectWildColor}
          onCancel={() => {
            setShowColorPicker(false);
            setPendingWildCardIndices(null);
          }}
        />

        <MobileLogDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          gameLog={gameLog}
          getLogStyles={getLogStyles}
        />

        {isMonopoly && (
          <TradeModal
            gameState={gameStateForBoard as unknown as MonopolyGameState}
            room={room as unknown as MonopolyRoom}
            currentUserId={playerId}
            targetPlayerId={tradeModalTargetId}
            onCloseConstructor={() => setTradeModalTargetId(null)}
            onInitiateTrade={(targetPlayerId: string, offer: TradeSide, request: TradeSide) => {
              game.sendGameAction('INITIATE_TRADE', { targetPlayerId, offer, request });
              setTradeModalTargetId(null);
            }}
            onAcceptTrade={() => game.sendGameAction('ACCEPT_TRADE')}
            onRejectTrade={() => game.sendGameAction('REJECT_TRADE')}
          />
        )}

        {voteKickState && (
          <VoteKickPanel
            voteKickState={{ votes: {}, requiredVotes: 0, ...voteKickState } as PanelVoteKickState}
            room={room}
            currentPlayerId={playerId}
            countdown={voteKickCountdown}
            onCastVote={roomApi.castVote}
          />
        )}

        {room.status === 'ENDED' && (
          <GameOverScreen
            room={room}
            currentPlayerId={playerId}
            rankings={(game.gameState?.gameSpecificState?.rankings as string[]) || []}
            winnerId={game.gameState?.winnerId}
            getPlayerDetails={id => {
              const p =
                room.players?.find(x => x.id === id) || game.gameState?.players?.find(x => x.id === id);
              return { id, name: p ? p.name : 'Unknown', color: p ? p.color : '#adff2f' };
            }}
            onRematch={() => void roomApi.rematch()}
            onChangeGameType={gameType => void roomApi.changeGameType(gameType)}
          />
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={renderLanding()} />
      <Route path="/room/:roomId" element={renderRoomShell()} />
      <Route path="/join/:roomId" element={renderRoomShell()} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
