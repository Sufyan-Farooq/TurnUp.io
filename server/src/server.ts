import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { IPlayer, GameAction, GameState } from './engine/interfaces';
import { SnakesLaddersRuleset } from './engine/snakesLadders';
import { LudoRuleset } from './engine/ludo';
import { UnoRuleset } from './engine/uno';
import { MonopolyRuleset, getMonopolySpacePrice } from './engine/monopoly';
import { GameEngineManager } from './engine/interfaces';
import { prisma } from './db';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './services/auth';

interface PlayerSession {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  handshakeToken: string;
  color?: string; // Optional chosen color for token/avatar
  socketId?: string; // Latest transport for this identity; rejects stale disconnects
}

interface VoteKickSession {
  targetId: string;
  initiatorId: string;
  votes: Record<string, boolean>; // voterId -> boolean (true = kick, false = keep)
  timeoutHandle?: NodeJS.Timeout; // 60s auto-expire handle
}

interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  players: PlayerSession[];
  spectators?: PlayerSession[]; // Spectator players joining ongoing games
  lobbySettings?: Record<string, any>; // Host settings (rules, starting cash, etc.)
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  gameType: 'SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY';
  engineManager: GameEngineManager | null;
  seed: number;
  voteKick?: VoteKickSession;
  bannedPlayerIds: Set<string>; // Players kicked via vote — cannot rejoin this session
  endedAt?: number; // Timestamp (ms) when the room's status transitioned to ENDED, for lifecycle sweep
}

// CORS allow-list configuration. Falls back to the Vite dev server origin if unset,
// and warns loudly since that fallback is not appropriate for production.
const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

if (!corsOriginEnv) {
  console.warn(
    '[WARNING] CORS_ORIGIN environment variable is not set. ' +
    `Falling back to the local dev default (${corsOrigins.join(', ')}). ` +
    'This is NOT suitable for production — set CORS_ORIGIN to a comma-separated allow-list of your real client origin(s).'
  );
}

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST']
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

// Port configuration
const PORT = process.env.PORT || 3000;
let isShuttingDown = false;

// Shared state
const rooms: Record<string, GameRoom> = {};
const playerToRoom: Record<string, string> = {}; // playerId -> roomId
const disconnectTimers: Record<string, NodeJS.Timeout> = {};

app.use(helmet());
app.use(express.json());

app.get('/api/health/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health/ready', async (_req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting_down' });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({ status: 'not_ready' });
  }
});

// Enable manual CORS, restricted to the configured allow-list
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic rate limiting for auth endpoints to slow down brute-force / spam signups
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Auth API Endpoints
app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or Email already registered.' });
    }

    const passwordHash = hashPassword(password);

    // Wrap user + stats creation in a single transaction: if GameStat creation fails,
    // the User row is rolled back too, so a retried registration doesn't hit
    // "already registered" for a signup the client believes never succeeded.
    const gameTypes: ('SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY')[] = ['SNAKES_LADDERS', 'LUDO', 'UNO', 'MONOPOLY'];
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: 'USER'
        }
      });

      await Promise.all(
        gameTypes.map(gt =>
          tx.gameStat.create({
            data: {
              userId: createdUser.id,
              gameType: gt
            }
          })
        )
      );

      return createdUser;
    });

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

app.post('/api/auth/guest', authRateLimiter, async (req, res) => {
  try {
    const { username } = req.body;
    const finalUsername = username?.trim() || `Guest_${uuidv4().substring(0, 4)}`;

    // Wrap user + stats creation in a single transaction (see /api/auth/register for rationale).
    const gameTypes: ('SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY')[] = ['SNAKES_LADDERS', 'LUDO', 'UNO', 'MONOPOLY'];
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username: finalUsername,
          role: 'GUEST'
        }
      });

      await Promise.all(
        gameTypes.map(gt =>
          tx.gameStat.create({
            data: {
              userId: createdUser.id,
              gameType: gt
            }
          })
        )
      );

      return createdUser;
    });

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error: any) {
    console.error('Guest login error:', error);
    res.status(500).json({ success: false, message: 'Server error during guest creation.' });
  }
});

// API endpoints
app.get('/api/rooms', (req, res) => {
  const roomsList = Object.values(rooms)
    .filter(r => !r.lobbySettings?.privateRoom && r.status === 'LOBBY')
    .map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      gameType: r.gameType,
      playersCount: r.players.length,
      maxPlayers: r.lobbySettings?.maxPlayers || 4
    }));
  res.json(roomsList);
});

const VALID_GAME_TYPES = ['SNAKES_LADDERS', 'LUDO', 'UNO', 'MONOPOLY'];

// Leaderboard: top players by gamesWon for a given game type
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { gameType } = req.query;
    if (!gameType || typeof gameType !== 'string' || !VALID_GAME_TYPES.includes(gameType)) {
      return res.status(400).json({ success: false, message: `gameType query param is required and must be one of: ${VALID_GAME_TYPES.join(', ')}.` });
    }

    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);

    const topStats = await prisma.gameStat.findMany({
      where: { gameType: gameType as any },
      orderBy: { gamesWon: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    const data = topStats.map(stat => ({
      userId: stat.userId,
      username: stat.user.username,
      gameType: stat.gameType,
      gamesPlayed: stat.gamesPlayed,
      gamesWon: stat.gamesWon,
      totalPoints: stat.totalPoints
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching leaderboard.' });
  }
});

// All GameStat rows for a given user
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await prisma.gameStat.findMany({
      where: { userId: id }
    });
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('User stats error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user stats.' });
  }
});

// Helper function to persist match statistics to PostgreSQL on game over
async function saveMatchOutcome(room: GameRoom, winnerId: string | null, finalState: GameState) {
  try {
    const dbWinnerId = (winnerId && !winnerId.startsWith('bot-')) ? winnerId : null;

    // 1. Create MatchHistory record
    const match = await prisma.matchHistory.create({
      data: {
        id: uuidv4(), // Generate a unique match ID
        gameType: room.gameType,
        status: 'ENDED',
        winnerId: dbWinnerId || undefined,
        endedAt: new Date()
      }
    });

    // 2. Create MatchPlayer links and update GameStats
    const participants = room.players;
    await Promise.all(
      participants.map(async (player) => {
        if (player.id.startsWith('bot-')) {
          return; // Skip database entries for bots
        }

        const isWinner = player.id === winnerId;
        const rank = isWinner ? 1 : 2; // Simple standing mapping
        
        let score = 0;
        if (room.gameType === 'MONOPOLY') {
          score = finalState.gameSpecificState.cash?.[player.id] || 0;
        } else if (room.gameType === 'UNO') {
          score = finalState.gameSpecificState.hands?.[player.id]?.length || 0;
        } else if (room.gameType === 'LUDO') {
          const tokens = finalState.gameSpecificState.tokens?.[player.id] || [];
          score = tokens.filter((t: number) => t === 57).length;
        } else if (room.gameType === 'SNAKES_LADDERS') {
          score = finalState.gameSpecificState.positions?.[player.id] || 1;
        }

        // Save player record
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: player.id,
            rank,
            score
          }
        });

        // Update aggregated statistics
        await prisma.gameStat.upsert({
          where: {
            userId_gameType: {
              userId: player.id,
              gameType: room.gameType
            }
          },
          update: {
            gamesPlayed: { increment: 1 },
            gamesWon: isWinner ? { increment: 1 } : undefined,
            totalPoints: { increment: score }
          },
          create: {
            userId: player.id,
            gameType: room.gameType,
            gamesPlayed: 1,
            gamesWon: isWinner ? 1 : 0,
            totalPoints: score
          }
        });
      })
    );

    console.log(`Successfully persisted match history and stats for room ${room.id}`);
  } catch (error) {
    console.error(`Error saving match outcome for room ${room.id}:`, error);
  }
}

// Generic "remove a player from a running game" state mutation.
// Used both when a vote-kick succeeds and when a player permanently disconnects (30s grace
// period expiry), so that a departed player never permanently stalls the game for everyone
// else — regardless of game type, and regardless of whether they were mid-trade or mid-auction
// in Monopoly. Mutates the engine's state via setCurrentState and returns the resulting state.
function applyPlayerRemovalToGameState(engineManager: GameEngineManager, targetId: string): GameState {
  const freshState = engineManager.getCurrentState();
  const updatedState: GameState = { ...freshState, gameSpecificState: { ...freshState.gameSpecificState } };
  const gss = updatedState.gameSpecificState;

  if (updatedState.gameType === 'MONOPOLY') {
    // Mark bankrupt so turn-advancement / win-condition logic skips them from now on
    if (gss.bankrupt) {
      gss.bankrupt = { ...gss.bankrupt, [targetId]: true };
    }

    // Return all owned properties to the bank
    if (gss.properties) {
      const updatedProperties: Record<number, any> = { ...gss.properties };
      Object.keys(updatedProperties).forEach((idxStr: any) => {
        const idx = parseInt(idxStr, 10);
        const prop = updatedProperties[idx];
        if (prop && prop.ownerId === targetId) {
          updatedProperties[idx] = { ownerId: null, mortgaged: false, houses: 0 };
        }
      });
      gss.properties = updatedProperties;
    }

    // Clear any active trade that references the removed player, otherwise INITIATE_TRADE
    // stays permanently blocked and nobody can accept/reject a trade with a ghost participant.
    if (gss.activeTrade && (gss.activeTrade.proposerId === targetId || gss.activeTrade.receiverId === targetId)) {
      gss.activeTrade = undefined;
    }

    // If they were participating in an active auction, remove them and resolve/advance it
    // so the auction doesn't stall forever waiting on a bid from a player who is gone.
    if (updatedState.subState === 'AUCTION' && Array.isArray(gss.auctionBidders)) {
      const oldBidders: string[] = gss.auctionBidders;
      const oldActiveIndex = gss.auctionActiveBidderIndex ?? 0;
      const wasActiveBidder = oldBidders[oldActiveIndex] === targetId;
      const wasHighestBidder = gss.auctionHighestBidderId === targetId;
      const remainingBidders = oldBidders.filter(id => id !== targetId);

      if (wasHighestBidder) {
        gss.auctionHighestBidderId = null;
      }

      const clearAuctionFields = () => {
        gss.auctionSpaceIndex = undefined;
        gss.auctionCurrentBid = undefined;
        gss.auctionHighestBidderId = undefined;
        gss.auctionActiveBidderIndex = undefined;
        gss.auctionBidders = undefined;
        gss.auctionOriginPlayerId = undefined;
      };

      if (remainingBidders.length === 0) {
        // No bidders left at all: cancel the auction outright.
        updatedState.subState = 'WAITING_FOR_TURN_END';
        updatedState.activePlayerId = gss.auctionOriginPlayerId || updatedState.activePlayerId;
        clearAuctionFields();
      } else if (remainingBidders.length === 1 && gss.auctionHighestBidderId) {
        // Exactly one bidder remains and a real bid stands: resolve the auction to them.
        const winnerId = remainingBidders[0];
        const finalBid = gss.auctionCurrentBid || 0;
        if (winnerId && finalBid > 0 && gss.properties && typeof gss.auctionSpaceIndex === 'number') {
          gss.properties = {
            ...gss.properties,
            [gss.auctionSpaceIndex]: { ownerId: winnerId, mortgaged: false, houses: 0 }
          };
          gss.cash = { ...gss.cash, [winnerId]: (gss.cash?.[winnerId] || 0) - finalBid };
        }
        updatedState.subState = 'WAITING_FOR_TURN_END';
        updatedState.activePlayerId = gss.auctionOriginPlayerId || updatedState.activePlayerId;
        clearAuctionFields();
      } else {
        // Auction continues with the remaining bidders — recompute whose turn it is to bid.
        let nextActiveIndex: number;
        if (wasActiveBidder) {
          nextActiveIndex = oldActiveIndex % remainingBidders.length;
        } else {
          const oldActiveId = oldBidders[oldActiveIndex];
          const newIdx = remainingBidders.indexOf(oldActiveId);
          nextActiveIndex = newIdx === -1 ? 0 : newIdx;
        }
        gss.auctionBidders = remainingBidders;
        gss.auctionActiveBidderIndex = nextActiveIndex;
      }
    }

    // Force turn advancement if the removed player was active
    if (updatedState.activePlayerId === targetId && updatedState.turnOrder.length > 0) {
      let nextTurnIndex = updatedState.turnIndex;
      const total = updatedState.turnOrder.length;
      for (let i = 0; i < total; i++) {
        nextTurnIndex = (nextTurnIndex + 1) % total;
        if (!gss.bankrupt?.[updatedState.turnOrder[nextTurnIndex]]) break;
      }
      updatedState.activePlayerId = updatedState.turnOrder[nextTurnIndex];
      updatedState.turnIndex = nextTurnIndex;
      updatedState.subState = 'WAITING_FOR_ROLL';
    }
  } else {
    // Remove forfeiting players from future rotation. Merely advancing once leaves
    // the departed id in turnOrder and deadlocks the match when rotation reaches it again.
    const oldTurnOrder = updatedState.turnOrder;
    const remainingTurnOrder = oldTurnOrder.filter(id => id !== targetId);
    if (remainingTurnOrder.length > 0) {
      if (updatedState.activePlayerId === targetId) {
        const direction = updatedState.gameType === 'UNO' && gss.direction === -1 ? -1 : 1;
        let oldIndex = oldTurnOrder.indexOf(targetId);
        let nextPlayerId = '';
        for (let i = 0; i < oldTurnOrder.length; i++) {
          oldIndex = (oldIndex + direction + oldTurnOrder.length) % oldTurnOrder.length;
          if (oldTurnOrder[oldIndex] !== targetId && remainingTurnOrder.includes(oldTurnOrder[oldIndex])) {
            nextPlayerId = oldTurnOrder[oldIndex];
            break;
          }
        }
        updatedState.activePlayerId = nextPlayerId || remainingTurnOrder[0];
      }
      updatedState.turnOrder = remainingTurnOrder;
      updatedState.turnIndex = remainingTurnOrder.indexOf(updatedState.activePlayerId);
      updatedState.subState = updatedState.gameType === 'UNO' ? 'WAITING_FOR_PLAY' : 'WAITING_FOR_ROLL';
    } else {
      updatedState.turnOrder = [];
      updatedState.activePlayerId = '';
      updatedState.turnIndex = 0;
    }
  }

  engineManager.setCurrentState(updatedState);

  const winnerId = engineManager.getRuleset().checkWinConditions(updatedState)
    || (updatedState.turnOrder.length === 1 ? updatedState.turnOrder[0] : null);
  if (winnerId) {
    updatedState.status = 'GAME_OVER';
    updatedState.winnerId = winnerId;
  }

  return updatedState;
}

// Socket server coordination
io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Connection / Reconnect Handshake Auth via JWT
  socket.on('auth', (payload: { token: string; roomId: string }, callback: Function) => {
    const { token, roomId } = payload;
    const decoded = verifyToken(token);
    if (!decoded) {
      return callback({ success: false, message: 'Invalid or expired session token.' });
    }

    const playerId = decoded.id;
    const room = rooms[roomId];

    if (!room) {
      return callback({ success: false, message: 'Game room not found.' });
    }

    const player = room.players.find(p => p.id === playerId);
    const spectator = room.spectators?.find(p => p.id === playerId);
    const session = player ?? spectator;
    if (!session) {
      return callback({ success: false, message: 'Player session not found in this room.' });
    }

    // Cancel pending grace period timer
    if (disconnectTimers[playerId]) {
      clearTimeout(disconnectTimers[playerId]);
      delete disconnectTimers[playerId];
      console.log(`Cancelled disconnect grace period timer for player: ${playerId}`);
    }

    // Bind player data to socket session
    socket.data.playerId = playerId;
    socket.data.roomId = roomId;

    socket.join(roomId);
    session.connected = true;
    session.socketId = socket.id;
    playerToRoom[playerId] = roomId;

    callback({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        gameType: room.gameType,
        players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
        lobbySettings: room.lobbySettings
      },
      gameState: room.engineManager ? room.engineManager.getAuditedState(playerId) : null,
      isSpectator: Boolean(spectator)
    });

    // Notify others
    if (player) socket.to(roomId).emit('player_reconnected', { playerId });
    console.log(`${spectator ? 'Spectator' : 'Player'} ${session.name} (${playerId}) reconnected to room ${roomId}`);
  });

  // 2. Room Creation
  socket.on('create_room', (payload: { name: string; token: string; gameType: string }, callback: Function) => {
    const { name, token, gameType } = payload;
    const decoded = verifyToken(token);
    if (!decoded) {
      return callback({ success: false, message: 'Invalid authentication token.' });
    }

    const supportedGameTypes: GameRoom['gameType'][] = ['SNAKES_LADDERS', 'LUDO', 'UNO', 'MONOPOLY'];
    if (!supportedGameTypes.includes(gameType as GameRoom['gameType'])) {
      return callback({ success: false, message: 'Unsupported game type.' });
    }

    const playerId = decoded.id;
    const username = decoded.username;
    const roomId = uuidv4().substring(0, 6).toUpperCase();

    const newRoom: GameRoom = {
      id: roomId,
      name: name || `${username}'s Game`,
      hostId: playerId,
      players: [
        { id: playerId, name: username, connected: true, ready: true, handshakeToken: token, socketId: socket.id }
      ],
      status: 'LOBBY',
      gameType: gameType as GameRoom['gameType'],
      engineManager: null,
      seed: Math.floor(Math.random() * 1000000000),
      lobbySettings: sanitizeLobbySettings(gameType as GameRoom['gameType'], {}),
      bannedPlayerIds: new Set<string>()
    };

    rooms[roomId] = newRoom;
    playerToRoom[playerId] = roomId;

    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
    socket.join(roomId);

    callback({
      success: true,
      roomId,
      token,
      room: {
        id: newRoom.id,
        name: newRoom.name,
        hostId: newRoom.hostId,
        status: newRoom.status,
        gameType: newRoom.gameType,
        players: newRoom.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
        lobbySettings: newRoom.lobbySettings
      }
    });

    console.log(`Room ${roomId} created by ${username} for game: ${gameType}`);
  });

  // 3. Joining Existing Room
  socket.on('join_room', (payload: { roomId: string; token: string }, callback: Function) => {
    const { roomId, token } = payload;
    const decoded = verifyToken(token);
    if (!decoded) {
      return callback({ success: false, message: 'Invalid authentication token.' });
    }

    const playerId = decoded.id;
    const username = decoded.username;
    const room = rooms[roomId];

    if (!room) {
      return callback({ success: false, message: 'Room not found.' });
    }

    const mappedRoomId = playerToRoom[playerId];
    if (mappedRoomId && mappedRoomId !== roomId && rooms[mappedRoomId]) {
      return callback({ success: false, message: 'Leave your current room before joining another.' });
    }

    // W-3: Block re-join for players who were vote-kicked from this room
    if (room.bannedPlayerIds && room.bannedPlayerIds.has(playerId)) {
      return callback({ success: false, message: 'You have been removed from this room by a vote kick.' });
    }


    // Treat repeated join attempts as transport recovery, never as a new seat.
    const existingPlayer = room.players.find(p => p.id === playerId);
    const existingSpectator = room.spectators?.find(p => p.id === playerId);
    const existingSession = existingPlayer ?? existingSpectator;
    if (existingSession) {
      if (disconnectTimers[playerId]) {
        clearTimeout(disconnectTimers[playerId]);
        delete disconnectTimers[playerId];
      }
      existingSession.connected = true;
      existingSession.socketId = socket.id;
      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.join(roomId);
      playerToRoom[playerId] = roomId;
      return callback({
        success: true,
        token,
        isSpectator: Boolean(existingSpectator),
        room: publicRoomPayload(room),
        gameState: room.engineManager ? room.engineManager.getAuditedState(playerId) : null
      });
    }

    if (room.status !== 'LOBBY') {
      const newSpectator: PlayerSession = {
        id: playerId,
        name: username,
        connected: true,
        ready: false,
        handshakeToken: token,
        socketId: socket.id
      };
      if (!room.spectators) room.spectators = [];
      if (!room.spectators.some(s => s.id === playerId)) {
        room.spectators.push(newSpectator);
      }
      playerToRoom[playerId] = roomId;

      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.join(roomId);

      callback({
        success: true,
        token,
        isSpectator: true,
        room: {
          id: room.id,
          name: room.name,
          hostId: room.hostId,
          status: room.status,
          gameType: room.gameType,
          players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
          lobbySettings: room.lobbySettings
        },
        gameState: room.engineManager ? room.engineManager.getAuditedState(playerId) : null
      });

      socket.to(roomId).emit('spectator_joined', {
        player: { id: playerId, name: username, connected: true }
      });
      console.log(`Player ${username} joined room ${roomId} as spectator`);
      return;
    }

    const maxPlayersLimit = room.lobbySettings?.maxPlayers || 4;
    if (room.players.length >= maxPlayersLimit) {
      return callback({ success: false, message: 'Room is full.' });
    }

    const newPlayer: PlayerSession = {
      id: playerId,
      name: username,
      connected: true,
      ready: false,
      handshakeToken: token,
      socketId: socket.id
    };

    room.players.push(newPlayer);
    playerToRoom[playerId] = roomId;

    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
    socket.join(roomId);

    callback({
      success: true,
      token,
      room: {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        gameType: room.gameType,
        players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
        lobbySettings: room.lobbySettings
      }
    });

    // Notify other lobby players
    socket.to(roomId).emit('player_joined', {
      player: { id: playerId, name: username, connected: true, ready: false }
    });

    console.log(`Player ${username} joined room ${roomId}`);
  });

  // 4. Ready / Toggle Ready States
  socket.on('toggle_ready', (callback: Function) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return callback?.({ success: false, message: 'Not authenticated in a room.' });

    const room = rooms[roomId];
    if (!room || room.status !== 'LOBBY') return callback?.({ success: false, message: 'Ready state can only change in the lobby.' });

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = !player.ready;
      io.to(roomId).emit('player_ready_changed', { playerId, ready: player.ready });
      callback({ success: true, ready: player.ready });
    }
  });

  // 5. Start Game
  // Client-facing contract: socket.on('start_game', (payload: { config?: {...} }, callback: Function))
  socket.on('start_game', (payload: { config?: Record<string, any> } | undefined, callback?: Function) => {
    const actualCallback = callback;

    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) {
      actualCallback?.({ success: false, message: 'Not authenticated in a room.' });
      return;
    }

    const room = rooms[roomId];
    if (!room || room.hostId !== playerId || room.status !== 'LOBBY') {
      if (actualCallback) actualCallback({ success: false, message: 'Only the host can start the game.' });
      return;
    }

    // Check if other guest/users are ready in lobby (production check)
    const allGuestsReady = room.players.every(p => p.id === room.hostId || p.ready);
    if (!allGuestsReady) {
      if (actualCallback) actualCallback({ success: false, message: 'Wait for all players to ready up.' });
      return;
    }

    if (room.players.length < 2 && !room.lobbySettings?.allowBots) {
      if (actualCallback) actualCallback({ success: false, message: 'At least two players are required to start.' });
      return;
    }

    try {
      // Set up engine manager
      let ruleset;
      if (room.gameType === 'SNAKES_LADDERS') {
        ruleset = new SnakesLaddersRuleset();
      } else if (room.gameType === 'LUDO') {
        ruleset = new LudoRuleset();
      } else if (room.gameType === 'UNO') {
        ruleset = new UnoRuleset();
      } else if (room.gameType === 'MONOPOLY') {
        ruleset = new MonopolyRuleset();
      } else {
        ruleset = new SnakesLaddersRuleset();
      }

      const maxPlayersLimit = room.lobbySettings?.maxPlayers || 4;
      const currentPlayersCount = room.players.length;

      if (room.lobbySettings?.allowBots && currentPlayersCount < maxPlayersLimit) {
        const botsNeeded = maxPlayersLimit - currentPlayersCount;
        const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon', 'Bot Zeta'];
        let colors = [
          '#adff2f', '#ffb703', '#fb8500', '#e63946',
          '#4a90e2', '#8ecae6', '#2a9d8f', '#38b000',
          '#b07d62', '#ffafcc', '#ff007f', '#7b2cbf'
        ];
        if (room.gameType === 'LUDO') {
          colors = maxPlayersLimit === 6
            ? ['#d90429', '#fb8500', '#ffb703', '#38b000', '#00b4d8', '#7b2cbf']
            : ['#d90429', '#38b000', '#ffb703', '#00b4d8'];
        }
        const takenColors = room.players.map(p => p.color).filter(Boolean);
        const availableColors = colors.filter(c => !takenColors.includes(c));

        for (let i = 0; i < botsNeeded; i++) {
          const botId = `bot-${uuidv4().substring(0, 8)}`;
          const botName = botNames[i % botNames.length];
          const botColor = availableColors[i % availableColors.length] || colors[i % colors.length];
          
          room.players.push({
            id: botId,
            name: botName,
            connected: true,
            ready: true,
            color: botColor,
            handshakeToken: 'bot-token'
          });
        }
      }

      const enginePlayers: IPlayer[] = room.players.map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.id.startsWith('bot-'),
        color: p.color
      }));

      room.engineManager = new GameEngineManager(ruleset);
      const actualConfig: Record<string, any> = {
        gameId: room.id,
        ...sanitizeLobbySettings(room.gameType, {}, room.lobbySettings, room.players.length)
      };
      room.engineManager.initGame(enginePlayers, actualConfig, room.seed);
      room.status = 'PLAYING';

      emitAuditedGameStarted(room);

      // Start the bot execution loop if a bot starts the game
      runBotTurnIfActive(roomId);

      if (actualCallback) actualCallback({ success: true });
      console.log(`Game started in room ${roomId}`);
    } catch (error: any) {
      console.error('Failed to start game:', error);
      if (actualCallback) actualCallback({ success: false, message: `Failed to initialize game engine: ${error.message}` });
    }
  });

  // 6. Game Move / Action Execution
  socket.on('game_action', (action: { type: string; payload: Record<string, any> }) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return;

    const room = rooms[roomId];
    if (!room || room.status !== 'PLAYING' || !room.engineManager) return;

    const gameAction: GameAction = {
      type: action.type,
      playerId,
      payload: action.payload,
      timestamp: Date.now()
    };

    const result = room.engineManager.handleIncomingAction(gameAction);
    if (!result.isValid) {
      socket.emit('action_rejected', { error: result.error });
      return;
    }

    const updatedState = room.engineManager.getCurrentState();

    emitAuditedGameStateUpdate(room, result.events);

    // Check if the game is now over
    if (updatedState.status === 'GAME_OVER') {
      room.status = 'ENDED';
      room.endedAt = Date.now();
      io.to(roomId).emit('game_ended', { winnerId: updatedState.winnerId });
      console.log(`Game ended in room ${roomId}. Winner: ${updatedState.winnerId}`);

      saveMatchOutcome(room, updatedState.winnerId, updatedState).catch(err => {
        console.error('Failed to save match outcome to PostgreSQL:', err);
      });
    } else {
      // Trigger the bot execution loop if the next active player is a bot
      runBotTurnIfActive(roomId);
    }
  });

  // 7. Handle Room Chat Messages
  socket.on('send_chat_message', (data: { text: string }) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId || !data.text || !data.text.trim()) return;

    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    io.to(roomId).emit('chat_message', {
      playerId,
      senderName: player.name,
      text: data.text.trim(),
      timestamp: Date.now()
    });
  });

  // 9. Handle Appearance Color Selection
  socket.on('select_appearance', (payload: { color: string }, callback: Function) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return callback?.({ success: false, message: 'Not authenticated in a room.' });

    const room = rooms[roomId];
    if (!room || room.status !== 'LOBBY') return callback?.({ success: false, message: 'Appearance can only change in the lobby.' });

    const color = payload?.color;
    const ludoColors = room.lobbySettings?.maxPlayers === 6
      ? ['#d90429', '#fb8500', '#ffb703', '#38b000', '#00b4d8', '#7b2cbf']
      : ['#d90429', '#38b000', '#ffb703', '#00b4d8'];
    if (typeof color !== 'string' || (room.gameType === 'LUDO' ? !ludoColors.includes(color) : !/^#[0-9a-f]{6}$/i.test(color))) {
      return callback?.({ success: false, message: 'Invalid player color.' });
    }
    if (room.gameType === 'LUDO' && room.players.some(p => p.id !== playerId && p.color === color)) {
      return callback?.({ success: false, message: 'That color is already taken.' });
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.color = color;
      io.to(roomId).emit('player_appearance_changed', { playerId, color });
      if (callback) callback({ success: true });
    }
  });

  // 10. Handle Custom Lobby Settings Changes
  socket.on('update_lobby_settings', (payload: { settings: Record<string, any> }, callback?: Function) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) {
      callback?.({ success: false, message: 'Not authenticated in a room.' });
      return;
    }

    const room = rooms[roomId];
    if (!room || room.hostId !== playerId || room.status !== 'LOBBY') {
      callback?.({ success: false, message: 'Only the host can update lobby settings.' });
      return;
    }

    room.lobbySettings = sanitizeLobbySettings(
      room.gameType,
      payload?.settings,
      room.lobbySettings,
      room.players.length
    );
    io.to(roomId).emit('lobby_settings_updated', { settings: room.lobbySettings });
    callback?.({ success: true, settings: room.lobbySettings });
  });

  // Vote Kick: Initiate a vote kick session against a player
  socket.on('initiate_vote_kick', (payload: { targetPlayerId: string }) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const targetPlayerId = payload.targetPlayerId;
    const targetPlayer = room.players.find(p => p.id === targetPlayerId);

    if (!targetPlayer) {
      socket.emit('action_rejected', { error: 'Target player not found in room.' });
      return;
    }

    if (targetPlayerId === playerId) {
      socket.emit('action_rejected', { error: 'You cannot initiate a vote kick against yourself.' });
      return;
    }

    if (room.voteKick) {
      socket.emit('action_rejected', { error: 'A vote kick is already in progress. Please wait for it to resolve.' });
      return;
    }

    if (room.players.length < 3) {
      socket.emit('action_rejected', { error: 'Vote kick requires at least three players.' });
      return;
    }

    // Set up vote kick
    const eligibleVoters = Math.max(0, room.players.length - 1); // everyone except the target
    const requiredVotes = Math.floor(eligibleVoters / 2) + 1;
    room.voteKick = {
      targetId: targetPlayerId,
      initiatorId: playerId,
      votes: {
        [playerId]: true // initiator automatically votes YES
      }
    };

    // W-2: Auto-expire the vote after 60 seconds
    room.voteKick.timeoutHandle = setTimeout(() => {
      const freshRoom = rooms[roomId];
      if (freshRoom && freshRoom.voteKick && freshRoom.voteKick.targetId === targetPlayerId) {
        console.log(`Vote kick against ${targetPlayerId} in room ${roomId} expired.`);
        freshRoom.voteKick = undefined;
        io.to(roomId).emit('vote_kick_failed', { targetPlayerId, reason: 'timeout' });
      }
    }, 60_000);

    io.to(roomId).emit('vote_kick_started', {
      targetPlayerId,
      initiatorId: playerId,
      votes: room.voteKick.votes,
      requiredVotes,
      timeoutSeconds: 60
    });

    console.log(`Vote kick started in room ${roomId} against ${targetPlayer.name} by ${playerId}`);
  });

  // Vote Kick: Cast a kick vote
  socket.on('cast_kick_vote', (payload: { vote: boolean }) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return;

    const room = rooms[roomId];
    if (!room || !room.voteKick) return;

    const voteKick = room.voteKick;
    if (playerId === voteKick.targetId) {
      socket.emit('action_rejected', { error: 'You cannot vote in your own kick session.' });
      return;
    }

    // Record the vote
    voteKick.votes[playerId] = !!payload.vote;

    const totalPlayersCount = room.players.length;
    const totalEligibleVoters = Math.max(0, totalPlayersCount - 1);
    const requiredVotes = Math.floor(totalEligibleVoters / 2) + 1;

    // Tally votes
    const yesCount = Object.values(voteKick.votes).filter(v => v === true).length;
    const noCount = Object.values(voteKick.votes).filter(v => v === false).length;
    const currentVotesCount = Object.keys(voteKick.votes).length;
    const remainingVotes = totalEligibleVoters - currentVotesCount;

    io.to(roomId).emit('vote_kick_updated', {
      targetPlayerId: voteKick.targetId,
      votes: voteKick.votes,
      yesCount,
      noCount,
      requiredVotes
    });

    if (yesCount >= requiredVotes) {
      // Vote kick succeeds! Kick target player
      // Clear timeout if it was pending, then clean up the session
      if (voteKick.timeoutHandle) clearTimeout(voteKick.timeoutHandle);

      const targetId = voteKick.targetId;
      const targetPlayer = room.players.find(p => p.id === targetId);
      const targetName = targetPlayer ? targetPlayer.name : targetId;

      console.log(`Vote kick succeeded in room ${roomId} against ${targetName}. Kicking player.`);

      // Disconnect and clean up player sessions, and add to room ban list (W-3)
      room.players = room.players.filter(p => p.id !== targetId);
      delete playerToRoom[targetId];
      delete disconnectTimers[targetId];
      room.voteKick = undefined;
      room.bannedPlayerIds.add(targetId); // Prevent re-join

      // Broadcast kick event
      io.to(roomId).emit('player_kicked', {
        targetPlayerId: targetId,
        targetName,
        players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color }))
      });

      // If in game, remove the kicked player from the running game state so it is not blocked!
      if (room.status === 'PLAYING' && room.engineManager) {
        const freshState = room.engineManager.getCurrentState();
        const updatedState = applyPlayerRemovalToGameState(room.engineManager, targetId);

        if (updatedState.status === 'GAME_OVER') {
          room.status = 'ENDED';
          room.endedAt = Date.now();
          emitAuditedGameStateUpdate(room, []);
          io.to(roomId).emit('game_ended', { winnerId: updatedState.winnerId });
          console.log(`Game in room ${roomId} ended after kick — winner: ${updatedState.winnerId}`);
          saveMatchOutcome(room, updatedState.winnerId, updatedState).catch(err => {
            console.error('Failed to save match outcome to PostgreSQL:', err);
          });
        } else {
          emitAuditedGameStateUpdate(
            room,
            freshState.gameType === 'MONOPOLY' ? [{ type: 'BANKRUPTCY_DECLARED', playerId: targetId, payload: {} }] : []
          );
          runBotTurnIfActive(roomId);
        }
      }

      // Check if room is empty now
      if (room.players.length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted after kick since no players remain.`);
      } else if (room.hostId === targetId) {
        // Migrate host if host was kicked
        const nextActiveHost = room.players.find(p => p.connected);
        if (nextActiveHost) {
          room.hostId = nextActiveHost.id;
          io.to(roomId).emit('host_changed', { hostId: room.hostId });
          console.log(`Migrated host of room ${roomId} to player ${nextActiveHost.name}`);
        }
      }
    } else if (yesCount + remainingVotes < requiredVotes || currentVotesCount >= totalEligibleVoters) {
      // Vote failed — clear timeout and session
      const targetId = voteKick.targetId;
      if (voteKick.timeoutHandle) clearTimeout(voteKick.timeoutHandle);
      console.log(`Vote kick failed in room ${roomId} against ${targetId}.`);
      room.voteKick = undefined;
      io.to(roomId).emit('vote_kick_failed', { targetPlayerId: targetId });
    }
  });

  // 8. Handle Disconnects
  socket.on('disconnect', () => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    const spectator = room.spectators?.find(p => p.id === playerId);
    const session = player ?? spectator;

    // A user can reconnect before an older transport has fully closed. Only
    // the latest socket is allowed to mark that identity offline.
    if (!session || session.socketId !== socket.id) return;

    if (player) {
      player.connected = false;
      io.to(roomId).emit('player_disconnected', { playerId });

      console.log(`Player ${player.name} (${playerId}) disconnected. Starting 30s grace period.`);

      disconnectTimers[playerId] = setTimeout(() => {
        handlePermanentLeave(roomId, playerId);
      }, 30000); // 30-second grace window
    } else if (spectator) {
      spectator.connected = false;
      disconnectTimers[playerId] = setTimeout(() => {
        const freshRoom = rooms[roomId];
        if (!freshRoom) return;
        freshRoom.spectators = freshRoom.spectators?.filter(s => s.id !== playerId);
        delete playerToRoom[playerId];
        delete disconnectTimers[playerId];
      }, 30000);
    }
  });

  // 11. Handle Rematch (Lobby Play Again)
  socket.on('rematch', (callback?: Function) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return;

    const room = rooms[roomId];
    if (!room || room.hostId !== playerId || room.status !== 'ENDED') {
      if (callback) callback({ success: false, message: 'Only the host can trigger a rematch when the game is ended.' });
      return;
    }

    // Filter out bots from players list so we don't duplicate them on start
    room.players = room.players.filter(p => !p.id.startsWith('bot-'));
    
    // Reset status and player readies
    room.status = 'LOBBY';
    room.endedAt = undefined;
    room.engineManager = null;
    room.seed = Math.floor(Math.random() * 1000000000);
    room.players.forEach(p => {
      p.ready = (p.id === room.hostId); // host remains ready, others reset
    });

    io.to(roomId).emit('room_reset_to_lobby', {
      room: {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        gameType: room.gameType,
        players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
        lobbySettings: room.lobbySettings
      }
    });

    if (callback) callback({ success: true });
    console.log(`Room ${roomId} reset to lobby for rematch by host.`);
  });

  // 12. Handle Change Game Type (Lobby Return & Swap Game)
  socket.on('change_game_type', (payload: { gameType: 'SNAKES_LADDERS' | 'LUDO' | 'UNO' | 'MONOPOLY' }, callback?: Function) => {
    const { playerId, roomId } = socket.data;
    if (!playerId || !roomId) return;

    const room = rooms[roomId];
    if (!room || room.hostId !== playerId) {
      if (callback) callback({ success: false, message: 'Only the host can change the game type.' });
      return;
    }

    const { gameType } = payload;
    if (!['SNAKES_LADDERS', 'LUDO', 'UNO', 'MONOPOLY'].includes(gameType)) {
      if (callback) callback({ success: false, message: 'Invalid game type.' });
      return;
    }

    room.gameType = gameType;
    room.lobbySettings = sanitizeLobbySettings(gameType, {}, room.lobbySettings, room.players.length);
    room.status = 'LOBBY';
    room.endedAt = undefined;
    room.engineManager = null;
    room.seed = Math.floor(Math.random() * 1000000000);
    room.players = room.players.filter(p => !p.id.startsWith('bot-'));
    room.players.forEach(p => {
      p.ready = (p.id === room.hostId);
    });

    io.to(roomId).emit('room_reset_to_lobby', {
      room: {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        gameType: room.gameType,
        players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, ready: p.ready, color: p.color })),
        lobbySettings: room.lobbySettings
      }
    });

    if (callback) callback({ success: true });
    console.log(`Room ${roomId} reset to lobby and game type changed to ${gameType} by host.`);
  });
});

function handlePermanentLeave(roomId: string, playerId: string) {
  const room = rooms[roomId];
  if (!room) return;

  const player = room.players.find(p => p.id === playerId);
  const name = player ? player.name : playerId;

  room.players = room.players.filter(p => p.id !== playerId);
  delete playerToRoom[playerId];
  delete disconnectTimers[playerId];

  console.log(`Player ${name} permanently left room ${roomId}.`);

  if (room.players.length === 0) {
    delete rooms[roomId];
    console.log(`Room ${roomId} has been deleted since all players left.`);
    return;
  }

  // Host migration if host left
  if (room.hostId === playerId) {
    const nextActiveHost = room.players.find(p => p.connected);
    if (nextActiveHost) {
      room.hostId = nextActiveHost.id;
      io.to(roomId).emit('host_changed', { hostId: room.hostId });
      console.log(`Migrated host of room ${roomId} to player ${nextActiveHost.name}`);
    }
  }

  io.to(roomId).emit('player_left_permanent', { playerId });

  // Fix: a permanently-left player must not stall the game if they were the active player
  // (or otherwise blocking progress, e.g. mid-trade/mid-auction in Monopoly). Force a
  // turn-skip using the same generic removal logic the vote-kick path uses.
  if (room.status === 'PLAYING' && room.engineManager) {
    const freshState = room.engineManager.getCurrentState();
    if (freshState.status === 'ACTIVE') {
      const updatedState = applyPlayerRemovalToGameState(room.engineManager, playerId);

      if (updatedState.status === 'GAME_OVER') {
        room.status = 'ENDED';
        room.endedAt = Date.now();
        emitAuditedGameStateUpdate(room, []);
        io.to(roomId).emit('game_ended', { winnerId: updatedState.winnerId });
        console.log(`Game in room ${roomId} ended after permanent disconnect — winner: ${updatedState.winnerId}`);
        saveMatchOutcome(room, updatedState.winnerId, updatedState).catch(err => {
          console.error('Failed to save match outcome to PostgreSQL:', err);
        });
      } else {
        emitAuditedGameStateUpdate(
          room,
          freshState.gameType === 'MONOPOLY' ? [{ type: 'BANKRUPTCY_DECLARED', playerId, payload: {} }] : []
        );
        runBotTurnIfActive(roomId);
      }
    }
  }
}

function runBotTurnIfActive(roomId: string) {
  const room = rooms[roomId];
  if (!room || room.status !== 'PLAYING' || !room.engineManager) return;

  const state = room.engineManager.getCurrentState();
  if (state.status === 'GAME_OVER') return;

  const activePlayer = state.players.find(p => p.id === state.activePlayerId);
  let botPlayerId = '';

  if (activePlayer && activePlayer.isBot) {
    botPlayerId = activePlayer.id;
  } else if (state.subState === 'AUCTION') {
    const auctionBidders = state.gameSpecificState.auctionBidders || [];
    const auctionActiveBidderIndex = state.gameSpecificState.auctionActiveBidderIndex;
    const auctionActiveBidderId = auctionBidders[auctionActiveBidderIndex];
    const bidder = state.players.find(p => p.id === auctionActiveBidderId);
    if (bidder && bidder.isBot) {
      botPlayerId = bidder.id;
    }
  }

  if (!botPlayerId) return;

  setTimeout(() => {
    const freshRoom = rooms[roomId];
    if (!freshRoom || freshRoom.status !== 'PLAYING' || !freshRoom.engineManager) return;
    const freshState = freshRoom.engineManager.getCurrentState();

    const expectedBotId = (() => {
      const active = freshState.players.find(p => p.id === freshState.activePlayerId);
      if (active?.isBot) return active.id;
      if (freshState.subState === 'AUCTION') {
        const bidders = freshState.gameSpecificState.auctionBidders || [];
        const bidderId = bidders[freshState.gameSpecificState.auctionActiveBidderIndex || 0];
        return freshState.players.find(p => p.id === bidderId)?.isBot ? bidderId : '';
      }
      return '';
    })();
    if (expectedBotId !== botPlayerId) {
      runBotTurnIfActive(roomId);
      return;
    }

    const subState = freshState.subState;
    const gameType = freshState.gameType;

    let actionType = '';
    let actionPayload: Record<string, any> = {};

    if (gameType === 'SNAKES_LADDERS') {
      if (subState === 'WAITING_FOR_ROLL') {
        actionType = 'ROLL_DICE';
      } else if (subState === 'WAITING_FOR_TURN_END') {
        actionType = 'END_TURN';
      }
    } else if (gameType === 'LUDO') {
      if (subState === 'WAITING_FOR_ROLL') {
        actionType = 'ROLL_DICE';
      } else if (subState === 'WAITING_FOR_TOKEN_MOVE') {
        for (let i = 0; i <= 3; i++) {
          const gameAction: GameAction = {
            type: 'MOVE_TOKEN',
            playerId: botPlayerId,
            payload: { tokenIndex: i },
            timestamp: Date.now()
          };
          const result = (freshRoom.engineManager as any)['ruleset'].processAction(freshState, gameAction);
          if (result.isValid) {
            actionType = 'MOVE_TOKEN';
            actionPayload = { tokenIndex: i };
            break;
          }
        }
      }
    } else if (gameType === 'UNO') {
      if (subState === 'WAITING_FOR_PLAY') {
        const hand = freshState.gameSpecificState.hands[botPlayerId] || [];
        const currentCard = freshState.gameSpecificState.currentCard;
        const currentColor = freshState.gameSpecificState.currentColor;
        const pendingDraw = freshState.gameSpecificState.pendingDrawCount || 0;
        const rules = freshState.gameSpecificState.rules || { cardStacking: true, cardDoubles: true };

        if (pendingDraw > 0) {
          // If stacking is active, check if we can stack
          let stackIndex = -1;
          if (rules.cardStacking) {
            for (let i = 0; i < hand.length; i++) {
              const card = hand[i];
              if ((currentCard?.value === 'draw2' && (card.value === 'draw2' || card.value === 'wildDraw4')) ||
                  (currentCard?.value === 'wildDraw4' && card.value === 'wildDraw4')) {
                stackIndex = i;
                break;
              }
            }
          }
          if (stackIndex !== -1) {
            actionType = 'PLAY_CARD';
            const wildColor = ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)];
            actionPayload = { cardIndex: stackIndex, selectedColor: wildColor };
          } else {
            actionType = 'DRAW_CARD';
          }
        } else {
          // Check for doubles first if enabled
          let doubleIndices: number[] = [];
          if (rules.cardDoubles && hand.length >= 2) {
            // Find all matching pairs in hand
            const pairs: Record<string, number[]> = {};
            for (let i = 0; i < hand.length; i++) {
              const val = hand[i].value;
              if (!pairs[val]) pairs[val] = [];
              pairs[val].push(i);
            }
            // Check if any pair is playable
            for (const [val, indices] of Object.entries(pairs)) {
              if (indices.length >= 2) {
                // Check if card at indices[0] or indices[1] is playable on discard pile
                const c1 = hand[indices[0]];
                const c2 = hand[indices[1]];
                const c1Playable = c1.color === 'wild' || c1.color === currentColor || c1.value === currentCard?.value;
                const c2Playable = c2.color === 'wild' || c2.color === currentColor || c2.value === currentCard?.value;
                if (c1Playable || c2Playable) {
                  doubleIndices = [indices[0], indices[1]];
                  break;
                }
              }
            }
          }

          if (doubleIndices.length === 2) {
            actionType = 'PLAY_CARD';
            const wildColor = ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)];
            actionPayload = { cardIndices: doubleIndices, selectedColor: wildColor };
          } else {
            // Play normal single card
            let playIndex = -1;
            for (let i = 0; i < hand.length; i++) {
              const card = hand[i];
              if (card.color === 'wild' || card.color === currentColor || card.value === currentCard?.value) {
                playIndex = i;
                break;
              }
            }
            if (playIndex !== -1) {
              actionType = 'PLAY_CARD';
              const wildColor = ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)];
              actionPayload = { cardIndex: playIndex, selectedColor: wildColor };
            } else {
              actionType = 'DRAW_CARD';
            }
          }
        }
      } else if (subState === 'PLAY_OR_PASS') {
        const hand = freshState.gameSpecificState.hands[botPlayerId] || [];
        const newCard = hand[hand.length - 1];
        const currentCard = freshState.gameSpecificState.currentCard;
        const currentColor = freshState.gameSpecificState.currentColor;
        if (newCard && (newCard.color === 'wild' || newCard.color === currentColor || newCard.value === currentCard?.value)) {
          actionType = 'PLAY_CARD';
          const wildColor = ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)];
          actionPayload = { cardIndex: hand.length - 1, selectedColor: wildColor };
        } else {
          actionType = 'DRAW_CARD';
        }
      }
    } else if (gameType === 'MONOPOLY') {
      if (subState === 'WAITING_FOR_ROLL') {
        actionType = 'ROLL_DICE';
      } else if (subState === 'WAITING_FOR_BUY_OR_PASS') {
        const cash = freshState.gameSpecificState.cash[botPlayerId] || 0;
        const position = freshState.gameSpecificState.positions[botPlayerId];
        const propPrice = getMonopolySpacePrice(position) ?? Number.POSITIVE_INFINITY;
        if (cash >= propPrice && Math.random() < 0.7) {
          actionType = 'BUY_PROPERTY';
        } else {
          actionType = 'END_TURN';
        }
      } else if (subState === 'WAITING_FOR_JAIL_DECISION') {
        const cash = freshState.gameSpecificState.cash[botPlayerId] || 0;
        if (cash > 150 && Math.random() < 0.5) {
          actionType = 'PAY_JAIL_FINE';
        } else {
          actionType = 'ROLL_DICE';
        }
      } else if (subState === 'WAITING_FOR_TURN_END') {
        actionType = 'END_TURN';
      } else if (subState === 'DEBT_OR_BANKRUPT') {
        const properties = freshState.gameSpecificState.properties || {};
        let mortgagedAny = false;
        const mortgageEnabled = freshState.gameSpecificState.config?.mortgage !== false;
        for (const [idxStr, prop] of Object.entries(properties) as any) {
          const idx = parseInt(idxStr, 10);
          if (mortgageEnabled && prop.ownerId === botPlayerId && !prop.mortgaged && prop.houses === 0) {
            actionType = 'MORTGAGE';
            actionPayload = { spaceIndex: idx };
            mortgagedAny = true;
            break;
          }
        }
        if (!mortgagedAny) {
          actionType = 'DECLARE_BANKRUPTCY';
        }
      } else if (subState === 'AUCTION') {
        const currentBid = freshState.gameSpecificState.auctionCurrentBid || 0;
        const cash = freshState.gameSpecificState.cash[botPlayerId] || 0;
        if (cash > currentBid + 10 && currentBid < 200 && Math.random() < 0.6) {
          actionType = 'BID';
          actionPayload = { amount: currentBid + 10 };
        } else {
          actionType = 'FOLD';
        }
      }
    }

    if (!actionType) return;

    const gameAction: GameAction = {
      type: actionType,
      playerId: botPlayerId,
      payload: actionPayload,
      timestamp: Date.now()
    };

    const result = freshRoom.engineManager.handleIncomingAction(gameAction);
    if (result.isValid) {
      const nextFreshState = freshRoom.engineManager.getCurrentState();
      emitAuditedGameStateUpdate(freshRoom, result.events);

      if (nextFreshState.status === 'GAME_OVER') {
        freshRoom.status = 'ENDED';
        freshRoom.endedAt = Date.now();
        io.to(roomId).emit('game_ended', { winnerId: nextFreshState.winnerId });
        saveMatchOutcome(freshRoom, nextFreshState.winnerId, nextFreshState).catch(err => {
          console.error('Failed to save match outcome to PostgreSQL:', err);
        });
      } else {
        runBotTurnIfActive(roomId);
      }
    }
  }, 800);
}


// Periodic lifecycle sweep: delete rooms that have sat ENDED with no activity for a while,
// so in-memory `rooms` doesn't grow unbounded across the server's lifetime.
const ENDED_ROOM_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const ROOM_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // run every 5 minutes

const roomSweepInterval = setInterval(() => {
  const now = Date.now();
  for (const roomId of Object.keys(rooms)) {
    const room = rooms[roomId];
    if (room.status === 'ENDED' && room.endedAt && (now - room.endedAt) > ENDED_ROOM_TIMEOUT_MS) {
      delete rooms[roomId];
      room.players.forEach(p => {
        if (playerToRoom[p.id] === roomId) delete playerToRoom[p.id];
      });
      console.log(`Swept stale ENDED room ${roomId} (inactive for over ${ENDED_ROOM_TIMEOUT_MS / 60000} minutes).`);
    }
  }
}, ROOM_SWEEP_INTERVAL_MS);
roomSweepInterval.unref?.();

// Only auto-listen when this file is run directly (e.g. `ts-node src/server.ts` / `node dist/server.js`).
// When imported by a test harness, the caller is responsible for starting httpServer on an
// ephemeral port, so requiring this module doesn't bind a port as a side effect.
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`${signal} received; draining connections.`);

    for (const timer of Object.values(disconnectTimers)) clearTimeout(timer);
    io.disconnectSockets(true);

    httpServer.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

const BASE_LOBBY_SETTINGS = {
  maxPlayers: 4,
  privateRoom: false,
  allowBots: false,
  startingCash: 1500,
  doubleRentRule: true,
  vacationCash: false,
  auction: false,
  prisonRent: false,
  evenBuild: true,
  mortgage: true,
  randomizeOrder: false,
  cardStacking: true,
  cardDoubles: true
};

const BOOLEAN_LOBBY_SETTINGS = [
  'privateRoom', 'allowBots', 'doubleRentRule', 'vacationCash', 'auction',
  'prisonRent', 'evenBuild', 'mortgage', 'randomizeOrder', 'cardStacking',
  'cardDoubles'
] as const;

function allowedPlayerCounts(gameType: GameRoom['gameType']): number[] {
  if (gameType === 'LUDO') return [4, 6];
  if (gameType === 'MONOPOLY') return [2, 3, 4];
  return [2, 3, 4, 5, 6];
}

/**
 * Treat lobby settings as server-owned input. Unknown keys and values with the
 * wrong type are ignored, while numeric settings are restricted to the values
 * exposed by the UI. Keeping this centralized also makes rematches and game
 * type changes use the same rules as initial room creation.
 */
function sanitizeLobbySettings(
  gameType: GameRoom['gameType'],
  incoming: unknown,
  previous: Record<string, any> = BASE_LOBBY_SETTINGS,
  currentPlayerCount = 1
): Record<string, any> {
  const source = incoming && typeof incoming === 'object' && !Array.isArray(incoming)
    ? incoming as Record<string, unknown>
    : {};
  const next: Record<string, any> = { ...BASE_LOBBY_SETTINGS, ...previous };

  for (const key of BOOLEAN_LOBBY_SETTINGS) {
    if (typeof source[key] === 'boolean') next[key] = source[key];
  }

  if (typeof source.startingCash === 'number' && [1000, 1500, 2000, 2500].includes(source.startingCash)) {
    next.startingCash = source.startingCash;
  }

  const counts = allowedPlayerCounts(gameType);
  if (typeof source.maxPlayers === 'number' && Number.isInteger(source.maxPlayers) && counts.includes(source.maxPlayers)) {
    // Never accept a setting that would silently strand players already in the lobby.
    if (source.maxPlayers >= currentPlayerCount) next.maxPlayers = source.maxPlayers;
  }
  if (!counts.includes(next.maxPlayers) || next.maxPlayers < currentPlayerCount) {
    next.maxPlayers = counts.find(count => count >= currentPlayerCount) ?? counts[counts.length - 1];
  }

  return next;
}

function publicRoomPayload(room: GameRoom) {
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    status: room.status,
    gameType: room.gameType,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      ready: p.ready,
      color: p.color
    })),
    lobbySettings: room.lobbySettings
  };
}

function connectedRoomSessions(room: GameRoom): PlayerSession[] {
  return [...room.players, ...(room.spectators || [])].filter(session => session.connected && session.socketId);
}

/** Emit a separately redacted state to every human transport in the room. */
function emitAuditedGameStarted(room: GameRoom): void {
  if (!room.engineManager) return;
  for (const session of connectedRoomSessions(room)) {
    io.to(session.socketId!).emit('game_started', {
      roomStatus: room.status,
      room: publicRoomPayload(room),
      gameState: room.engineManager.getAuditedState(session.id)
    });
  }
}

function emitAuditedGameStateUpdate(room: GameRoom, events: any[]): void {
  if (!room.engineManager) return;
  for (const session of connectedRoomSessions(room)) {
    io.to(session.socketId!).emit('game_state_update', {
      gameState: room.engineManager.getAuditedState(session.id),
      events
    });
  }
}

export { app, httpServer, io, rooms };
