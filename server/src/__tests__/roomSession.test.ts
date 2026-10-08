import { readFileSync } from 'fs';
import { resolve } from 'path';
import ts from 'typescript';

// Exercise the client hook's async membership operations with held socket ACKs.
// Rendering isn't needed: the regression is the ordering of clear vs await.
const source = readFileSync(resolve(__dirname, '../../../client/src/hooks/useRoom.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function roomHook() {
  const states: any[] = [];
  const react = {
    useState: (initial: any) => {
      const index = states.length;
      states.push(initial);
      return [initial, (value: any) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef: (current: any) => ({ current }),
    useCallback: (callback: any) => callback,
    useEffect: () => {}
  };
  const exported = { exports: {} as any };
  new Function('require', 'module', 'exports', compiled)((name: string) => {
    if (name === 'react') return react;
    throw new Error(`Unexpected hook dependency: ${name}`);
  }, exported, exported.exports);
  const requests: { event: string; ack: (result?: any) => void }[] = [];
  const socket = { connected: true, timeout: () => socket, emit: (event: string, ...args: any[]) => {
    requests.push({ event, ack: args[args.length - 1] });
  } };
  let session: any = { roomId: 'ROOM1', token: 'token' };
  const service = { getSession: () => session, clearSession: () => { session = { roomId: null, token: null }; },
    saveSession: (roomId: string, token: string) => { session = { roomId, token }; } };
  const onReconnectedToGame = jest.fn();
  const hook = exported.exports.useRoom(socket, service, { id: 'human', username: 'Human' }, 'token', { onReconnectedToGame });
  return { hook, states, socket, service, requests, onReconnectedToGame };
}
const joined = { success: true, roomId: 'ROOM1', room: { id: 'ROOM1', status: 'PLAYING', players: [{ id: 'human' }] }, gameState: {} };

describe('Explicit room exit', () => {
  it('clears room and persisted recovery session before waiting for leave acknowledgement', async () => {
    const test = roomHook();
    const joining = test.hook.joinRoom('ROOM1');
    test.requests[0].ack(joined);
    await joining;
    expect(test.states[0]?.id).toBe('ROOM1');
    const leaving = test.hook.leaveRoom();
    expect(test.states[0]).toBeNull();
    expect(test.service.getSession()).toEqual({ roomId: null, token: null });
    expect(test.requests[1].event).toBe('leave_room');
    test.requests[1].ack();
    await leaving;
  });

  it('ignores an old recovery reply after Exit and does not resume on reconnect', async () => {
    const test = roomHook();
    test.hook.handleTransportConnect(test.socket);
    const leaving = test.hook.leaveRoom();
    test.requests[0].ack({ ...joined, isSpectator: true });
    expect(test.states[0]).toBeNull();
    expect(test.onReconnectedToGame).not.toHaveBeenCalled();
    test.hook.handleTransportConnect(test.socket);
    expect(test.requests.map(request => request.event)).toEqual(['auth', 'leave_room']);
    test.requests[1].ack();
    await leaving;
  });

  it('cancels a late join reply instead of restoring room membership', async () => {
    const test = roomHook();
    const joining = test.hook.joinRoom('ROOM1');
    const leaving = test.hook.leaveRoom();
    test.requests[0].ack({ ...joined, isSpectator: true });
    expect((await joining).success).toBe(false);
    expect(test.states[0]).toBeNull();
    expect(test.service.getSession().roomId).toBeNull();
    test.requests[1].ack();
    await leaving;
  });

  it('does not clear a newly joined room when the old leave acknowledgement arrives', async () => {
    const test = roomHook();
    const leaving = test.hook.leaveRoom();
    const joining = test.hook.joinRoom('ROOM2');
    test.requests[1].ack({ ...joined, roomId: 'ROOM2', room: { ...joined.room, id: 'ROOM2' } });
    await joining;
    test.requests[0].ack();
    await leaving;
    expect(test.states[0]?.id).toBe('ROOM2');
    expect(test.service.getSession().roomId).toBe('ROOM2');
  });
});
