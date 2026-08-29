import { AddressInfo } from 'net';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { httpServer } from '../server';
import { generateToken } from '../services/auth';

function emitWithAck<T = any>(socket: ClientSocket, event: string, payload?: any): Promise<T> {
  return new Promise((resolve) => {
    if (payload === undefined) {
      // Some handlers (e.g. toggle_ready) take only a callback, no data argument.
      socket.emit(event, (response: T) => resolve(response));
    } else {
      socket.emit(event, payload, (response: T) => resolve(response));
    }
  });
}

function waitForEvent<T = any>(socket: ClientSocket, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe('Full room -> game flow (socket.io integration)', () => {
  let baseUrl: string;
  let hostClient: ClientSocket;
  let guestClient: ClientSocket;

  beforeAll((done) => {
    httpServer.listen(0, () => {
      const port = (httpServer.address() as AddressInfo).port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(() => done());
  });

  afterEach(() => {
    hostClient?.disconnect();
    guestClient?.disconnect();
  });

  it('creates a room, joins, readies up, starts the game, and processes a valid move', async () => {
    const hostToken = generateToken({ id: 'test-host-1', username: 'HostPlayer', role: 'USER' });
    const guestToken = generateToken({ id: 'test-guest-1', username: 'GuestPlayer', role: 'USER' });

    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });

    await Promise.all([
      waitForEvent(hostClient, 'connect'),
      waitForEvent(guestClient, 'connect')
    ]);

    // 1. Create room
    const createResult = await emitWithAck(hostClient, 'create_room', {
      name: 'Integration Test Room',
      token: hostToken,
      gameType: 'SNAKES_LADDERS'
    });
    expect(createResult.success).toBe(true);
    const roomId = createResult.roomId;
    expect(roomId).toBeTruthy();

    // 2. Guest joins
    const joinResult = await emitWithAck(guestClient, 'join_room', {
      roomId,
      token: guestToken
    });
    expect(joinResult.success).toBe(true);

    // 3. Both ready (host is auto-ready as room creator; guest must toggle)
    const readyResult = await emitWithAck<{ success: boolean; ready: boolean }>(guestClient, 'toggle_ready', undefined);
    expect(readyResult.success).toBe(true);
    expect(readyResult.ready).toBe(true);

    // 4. Host starts the game (new normalized signature: (payload, callback))
    const gameStartedPromise = waitForEvent(guestClient, 'game_started');
    const startResult = await emitWithAck<{ success: boolean }>(hostClient, 'start_game', {});
    expect(startResult.success).toBe(true);
    const gameStartedPayload: any = await gameStartedPromise;
    expect(gameStartedPayload.gameState).toBeDefined();

    const activePlayerId = gameStartedPayload.gameState.activePlayerId;
    const activeClient = activePlayerId === 'test-host-1' ? hostClient : guestClient;
    const observerClient = activePlayerId === 'test-host-1' ? guestClient : hostClient;

    // 5. Make one valid move and verify game_state_update is broadcast
    const updatePromise = waitForEvent(observerClient, 'game_state_update');
    activeClient.emit('game_action', { type: 'ROLL_DICE', payload: {} });
    const updatePayload: any = await updatePromise;

    expect(updatePayload.gameState).toBeDefined();
    expect(updatePayload.gameState.gameSpecificState.lastRoll).toBeGreaterThanOrEqual(1);
  }, 15000);
});
