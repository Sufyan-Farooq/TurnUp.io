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
  let spectatorClient: ClientSocket;

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
    spectatorClient?.disconnect();
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

  it('restores a spectator session after its transport reconnects', async () => {
    const hostToken = generateToken({ id: 'spectator-host', username: 'Host', role: 'USER' });
    const guestToken = generateToken({ id: 'spectator-guest', username: 'Guest', role: 'USER' });
    const spectatorToken = generateToken({ id: 'spectator-user', username: 'Watcher', role: 'USER' });

    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'Spectator Recovery',
      token: hostToken,
      gameType: 'SNAKES_LADDERS'
    });
    await emitWithAck(guestClient, 'join_room', { roomId: created.roomId, token: guestToken });
    await emitWithAck(guestClient, 'toggle_ready');
    await emitWithAck(hostClient, 'start_game', {});

    spectatorClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await waitForEvent(spectatorClient, 'connect');
    const joined: any = await emitWithAck(spectatorClient, 'join_room', {
      roomId: created.roomId,
      token: spectatorToken
    });
    expect(joined.success).toBe(true);
    expect(joined.isSpectator).toBe(true);

    spectatorClient.disconnect();
    spectatorClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await waitForEvent(spectatorClient, 'connect');
    const restored: any = await emitWithAck(spectatorClient, 'auth', {
      roomId: created.roomId,
      token: spectatorToken
    });

    expect(restored.success).toBe(true);
    expect(restored.isSpectator).toBe(true);
    expect(restored.gameState).toBeDefined();
  }, 15000);

  it('explains why vote kick is unavailable in a two-player room', async () => {
    const hostToken = generateToken({ id: 'vote-host', username: 'Host', role: 'USER' });
    const guestToken = generateToken({ id: 'vote-guest', username: 'Guest', role: 'USER' });

    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'Vote Validation',
      token: hostToken,
      gameType: 'UNO'
    });
    await emitWithAck(guestClient, 'join_room', { roomId: created.roomId, token: guestToken });

    const rejectionPromise = waitForEvent<{ error: string }>(hostClient, 'action_rejected');
    hostClient.emit('initiate_vote_kick', { targetPlayerId: 'vote-guest' });
    const rejection = await rejectionPromise;
    expect(rejection.error).toBe('Vote kick requires at least three players.');
  }, 15000);

  it('keeps lobby settings server-authoritative and rejects non-host updates', async () => {
    const hostToken = generateToken({ id: 'settings-host', username: 'SettingsHost', role: 'USER' });
    const guestToken = generateToken({ id: 'settings-guest', username: 'SettingsGuest', role: 'USER' });

    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'Authoritative Settings', token: hostToken, gameType: 'MONOPOLY'
    });
    await emitWithAck(guestClient, 'join_room', { roomId: created.roomId, token: guestToken });

    const guestUpdate: any = await emitWithAck(guestClient, 'update_lobby_settings', {
      settings: { startingCash: 2500 }
    });
    expect(guestUpdate).toEqual(expect.objectContaining({ success: false }));

    const hostUpdate: any = await emitWithAck(hostClient, 'update_lobby_settings', {
      settings: { startingCash: 2500, auction: true, maxPlayers: 3, unknownRule: true }
    });
    expect(hostUpdate).toEqual(expect.objectContaining({
      success: true,
      settings: expect.objectContaining({ startingCash: 2500, auction: true, maxPlayers: 3 })
    }));
    expect(hostUpdate.settings.unknownRule).toBeUndefined();

    await emitWithAck(guestClient, 'toggle_ready');
    const startedPromise = waitForEvent<any>(hostClient, 'game_started');
    const started: any = await emitWithAck(hostClient, 'start_game', {
      config: { startingCash: 1, auction: false, maxPlayers: 99 }
    });
    expect(started.success).toBe(true);
    const payload = await startedPromise;
    expect(payload.gameState.gameSpecificState.config).toEqual(expect.objectContaining({
      startingCash: 2500,
      auction: true
    }));
    expect(payload.gameState.gameSpecificState.cash['settings-host']).toBe(2500);
  }, 15000);

  it('accepts the current Ludo palette and prevents duplicate seats', async () => {
    const hostToken = generateToken({ id: 'ludo-color-host', username: 'LudoHost', role: 'USER' });
    const guestToken = generateToken({ id: 'ludo-color-guest', username: 'LudoGuest', role: 'USER' });

    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'Ludo Palette', token: hostToken, gameType: 'LUDO'
    });
    expect(created.success).toBe(true);

    const hostAppearance: any = await emitWithAck(hostClient, 'select_appearance', { color: '#ff5c66' });
    expect(hostAppearance).toEqual(expect.objectContaining({ success: true }));

    const joined: any = await emitWithAck(guestClient, 'join_room', {
      roomId: created.roomId, token: guestToken
    });
    expect(joined.success).toBe(true);

    const duplicateAppearance: any = await emitWithAck(guestClient, 'select_appearance', { color: '#FF5C66' });
    expect(duplicateAppearance).toEqual(expect.objectContaining({ success: false }));

    const guestAppearance: any = await emitWithAck(guestClient, 'select_appearance', { color: '#4E8CFF' });
    expect(guestAppearance).toEqual(expect.objectContaining({ success: true }));
  }, 15000);

  it('sends each UNO player a separately redacted state', async () => {
    const hostToken = generateToken({ id: 'uno-host', username: 'UnoHost', role: 'USER' });
    const guestToken = generateToken({ id: 'uno-guest', username: 'UnoGuest', role: 'USER' });

    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'UNO Privacy', token: hostToken, gameType: 'UNO'
    });
    await emitWithAck(guestClient, 'join_room', { roomId: created.roomId, token: guestToken });
    await emitWithAck(hostClient, 'update_lobby_settings', {
      settings: { cardStacking: false, cardDoubles: false }
    });
    await emitWithAck(guestClient, 'toggle_ready');

    const hostStarted = waitForEvent<any>(hostClient, 'game_started');
    const guestStarted = waitForEvent<any>(guestClient, 'game_started');
    const startResult: any = await emitWithAck(hostClient, 'start_game', {
      config: { cardStacking: true, cardDoubles: true }
    });
    expect(startResult.success).toBe(true);

    const [hostPayload, guestPayload] = await Promise.all([hostStarted, guestStarted]);
    const hostState = hostPayload.gameState.gameSpecificState;
    const guestState = guestPayload.gameState.gameSpecificState;

    expect(Array.isArray(hostState.hands['uno-host'])).toBe(true);
    expect(hostState.hands['uno-guest']).toBe(7);
    expect(Array.isArray(guestState.hands['uno-guest'])).toBe(true);
    expect(guestState.hands['uno-host']).toBe(7);
    expect(typeof hostState.deck).toBe('number');
    expect(typeof guestState.deck).toBe('number');
    expect(hostState.rules).toEqual({ cardStacking: false, cardDoubles: false });
    expect(guestState.rules).toEqual({ cardStacking: false, cardDoubles: false });
  }, 15000);

  it('confirms room chat delivery and keeps invalid messages out of the room', async () => {
    const hostToken = generateToken({ id: 'chat-host', username: 'ChatHost', role: 'USER' });
    const guestToken = generateToken({ id: 'chat-guest', username: 'ChatGuest', role: 'USER' });
    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'Chat Test', token: hostToken, gameType: 'LUDO'
    });
    await emitWithAck(guestClient, 'join_room', { roomId: created.roomId, token: guestToken });

    const received = waitForEvent<any>(guestClient, 'chat_message');
    const delivered = await emitWithAck<{ success: boolean }>(hostClient, 'send_chat_message', { text: '  Ready to play?  ' });
    expect(delivered.success).toBe(true);
    expect(await received).toEqual(expect.objectContaining({
      playerId: 'chat-host', senderName: 'ChatHost', text: 'Ready to play?'
    }));

    const rejected = await emitWithAck<{ success: boolean; message: string }>(hostClient, 'send_chat_message', { text: 'x'.repeat(501) });
    expect(rejected.success).toBe(false);
    expect(rejected.message).toMatch(/500/);
  }, 15000);

  it('immediately removes player from lobby when leave_room is emitted', async () => {
    const hostToken = generateToken({ id: 'leave-host', username: 'LeaveHost', role: 'USER' });
    const guestToken = generateToken({ id: 'leave-guest', username: 'LeaveGuest', role: 'USER' });
    hostClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    guestClient = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
    await Promise.all([waitForEvent(hostClient, 'connect'), waitForEvent(guestClient, 'connect')]);

    const created: any = await emitWithAck(hostClient, 'create_room', {
      name: 'Leave Test', token: hostToken, gameType: 'LUDO'
    });
    await emitWithAck(guestClient, 'join_room', { roomId: created.roomId, token: guestToken });

    // Host listens for player_left_permanent
    const leavePromise = waitForEvent<any>(hostClient, 'player_left_permanent');

    // Guest emits leave_room
    const leaveAck = await emitWithAck<{ success: boolean }>(guestClient, 'leave_room');
    expect(leaveAck.success).toBe(true);

    const leavePayload = await leavePromise;
    expect(leavePayload.playerId).toBe('leave-guest');

    // Guest should now be able to join another room immediately without "Leave your current room first" error
    const newRoom: any = await emitWithAck(guestClient, 'create_room', {
      name: 'New Room', token: guestToken, gameType: 'UNO'
    });
    expect(newRoom.success).toBe(true);
  }, 15000);

  it('requires the registered owner token to read a private profile', async () => {
    const profileId = '00000000-0000-4000-8000-000000000001';
    const anonymous = await fetch(`${baseUrl}/api/users/${profileId}/profile`);
    expect(anonymous.status).toBe(401);

    const guestToken = generateToken({
      id: '00000000-0000-4000-8000-000000000003', username: 'Guest', role: 'GUEST'
    });
    const guest = await fetch(`${baseUrl}/api/users/${profileId}/profile`, {
      headers: { Authorization: `Bearer ${guestToken}` }
    });
    expect(guest.status).toBe(401);

    const otherUserToken = generateToken({
      id: '00000000-0000-4000-8000-000000000002', username: 'Other', role: 'USER'
    });
    const otherUser = await fetch(`${baseUrl}/api/users/${profileId}/profile`, {
      headers: { Authorization: `Bearer ${otherUserToken}` }
    });
    expect(otherUser.status).toBe(403);
  });
});
