import { isLudoSafeTrackPosition, LudoRuleset } from '../engine/ludo';
import { IPlayer } from '../engine/interfaces';

describe('LudoRuleset.processAction', () => {
  const players: IPlayer[] = [
    { id: 'p1', name: 'Alice', isBot: false, color: '#FF5C66' },
    { id: 'p2', name: 'Bob', isBot: false, color: '#3FBF7F' }
  ];

  it('accepts a valid ROLL_DICE action from the active player', () => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1' }, 999);

    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE',
      playerId: state.activePlayerId,
      payload: {},
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState).toBeDefined();
  });

  it('rejects MOVE_TOKEN before a dice roll has happened', () => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1' }, 999);

    const result = ruleset.processAction(state, {
      type: 'MOVE_TOKEN',
      playerId: state.activePlayerId,
      payload: { tokenIndex: 0 },
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it.each([
    { maxPlayers: 4, color: '#4E8CFF', expectedStart: 39 },
    { maxPlayers: 6, color: '#3FBF7F', expectedStart: 26 },
  ])('releases a $maxPlayers-player pawn at its chosen color seat, not player list order', ({ maxPlayers, color, expectedStart }) => {
    const ruleset = new LudoRuleset();
    const firstPlayer: IPlayer = { id: 'first', name: 'First', isBot: false, color };
    const state = ruleset.initialize([firstPlayer, players[0]], { maxPlayers }, 999);
    state.subState = 'WAITING_FOR_TOKEN_MOVE';
    state.gameSpecificState.lastRoll = 6;

    const result = ruleset.processAction(state, {
      type: 'MOVE_TOKEN', playerId: firstPlayer.id,
      payload: { tokenIndex: 0 }, timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState?.gameSpecificState.tokens[firstPlayer.id][0]).toBe(expectedStart);
  });

  it.each([
    { safeCell: 0, from: -1, roll: 6 },
    { safeCell: 8, from: 7, roll: 1 },
  ])('protects six-player safe cell $safeCell from capture', ({ safeCell, from, roll }) => {
    const ruleset = new LudoRuleset();
    const sixPlayers: IPlayer[] = [
      { id: 'red', name: 'Red', isBot: false, color: '#FF5C66' },
      { id: 'blue', name: 'Blue', isBot: false, color: '#4E8CFF' },
    ];
    const state = ruleset.initialize(sixPlayers, { maxPlayers: 6 }, 999);
    state.subState = 'WAITING_FOR_TOKEN_MOVE';
    state.gameSpecificState.lastRoll = roll;
    state.gameSpecificState.tokens.red[0] = from;
    state.gameSpecificState.tokens.blue[0] = safeCell;

    const result = ruleset.processAction(state, {
      type: 'MOVE_TOKEN', playerId: 'red', payload: { tokenIndex: 0 }, timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState?.gameSpecificState.tokens.blue[0]).toBe(safeCell);
    expect(result.events.some(event => event.type === 'TOKEN_CAPTURED')).toBe(false);
  });

  it('still captures a pawn on an unmarked six-player track cell', () => {
    const ruleset = new LudoRuleset();
    const sixPlayers: IPlayer[] = [
      { id: 'red', name: 'Red', isBot: false, color: '#FF5C66' },
      { id: 'blue', name: 'Blue', isBot: false, color: '#4E8CFF' },
    ];
    const state = ruleset.initialize(sixPlayers, { maxPlayers: 6 }, 999);
    state.subState = 'WAITING_FOR_TOKEN_MOVE';
    state.gameSpecificState.lastRoll = 1;
    state.gameSpecificState.tokens.red[0] = 8;
    state.gameSpecificState.tokens.blue[0] = 9;

    const result = ruleset.processAction(state, {
      type: 'MOVE_TOKEN', playerId: 'red', payload: { tokenIndex: 0 }, timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState?.gameSpecificState.tokens.blue[0]).toBe(-1);
    expect(result.events.some(event => event.type === 'TOKEN_CAPTURED')).toBe(true);
  });

  it('matches the six-player board stars and colored starts to safe rules', () => {
    for (let seat = 0; seat < 6; seat++) {
      expect(isLudoSafeTrackPosition(seat * 13, 6)).toBe(true);
      expect(isLudoSafeTrackPosition(seat * 13 + 8, 6)).toBe(true);
      expect(isLudoSafeTrackPosition(seat * 13 + 9, 6)).toBe(false);
    }
    expect(isLudoSafeTrackPosition(8, 4)).toBe(false);
  });
});
