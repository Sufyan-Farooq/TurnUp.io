import { isLudoSafeTrackPosition, LudoRuleset } from '../engine/ludo';
import { IPlayer } from '../engine/interfaces';
import { DeterministicRNG } from '../engine/rng';

describe('LudoRuleset.processAction', () => {
  const players: IPlayer[] = [
    { id: 'p1', name: 'Alice', isBot: false, color: '#FF5C66' },
    { id: 'p2', name: 'Bob', isBot: false, color: '#3FBF7F' }
  ];

  afterEach(() => jest.restoreAllMocks());

  it.each([4, 6])('automatically moves the only legal token on a %i-player board', maxPlayers => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, { maxPlayers }, 999);
    state.gameSpecificState.tokens.p1 = [-1, 0, -1, -1];
    const before = JSON.stringify(state);
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockImplementation(function (this: DeterministicRNG) {
      this.nextInt();
      return 4;
    });

    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState?.gameSpecificState.tokens.p1).toEqual([-1, 4, -1, -1]);
    expect(result.newState?.activePlayerId).toBe('p2');
    expect(result.newState?.subState).toBe('WAITING_FOR_ROLL');
    expect(result.events.map(event => event.type)).toEqual(['DICE_ROLLED', 'TOKEN_MOVED']);
    expect(result.newState?.rngState).not.toBe(state.rngState);
    expect(JSON.stringify(state)).toBe(before);
  });

  it.each([4, 6])('automatically skips rolls with no legal move on a %i-player board', maxPlayers => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, { maxPlayers }, 999);
    const home = (maxPlayers === 6 ? 78 : 52) + 5;
    state.gameSpecificState.tokens.p1 = [-1, home, home - 1, -1];
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockReturnValue(4);

    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now()
    });

    expect(result.newState?.activePlayerId).toBe('p2');
    expect(result.newState?.subState).toBe('WAITING_FOR_ROLL');
    expect(result.newState?.gameSpecificState.tokens).toEqual(state.gameSpecificState.tokens);
    expect(result.events.map(event => event.type)).toEqual(['DICE_ROLLED', 'NO_VALID_MOVES']);
  });

  it('keeps token selection when more than one token can move', () => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, {}, 999);
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockReturnValue(6);
    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now()
    });
    expect(result.newState?.subState).toBe('WAITING_FOR_TOKEN_MOVE');
    expect(result.newState?.gameSpecificState.tokens.p1).toEqual([-1, -1, -1, -1]);
  });

  it('preserves captures and bonus turns for automatic moves', () => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, {}, 999);
    state.gameSpecificState.tokens.p1 = [0, -1, -1, -1];
    state.gameSpecificState.tokens.p2[0] = 4;
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockReturnValue(4);
    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now()
    });
    expect(result.newState?.activePlayerId).toBe('p1');
    expect(result.newState?.gameSpecificState.tokens.p2[0]).toBe(-1);
    expect(result.events.some(event => event.type === 'TOKEN_CAPTURED')).toBe(true);
  });

  it('automatically releases the only available base token and retains the six bonus', () => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, {}, 999);
    state.gameSpecificState.tokens.p1 = [57, -1, 57, 57];
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockReturnValue(6);
    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now()
    });
    expect(result.newState?.gameSpecificState.tokens.p1).toEqual([57, 0, 57, 57]);
    expect(result.newState?.activePlayerId).toBe('p1');
    expect(result.newState?.gameSpecificState.consecutiveSixes).toBe(1);
    expect(result.events.some(event => event.type === 'TOKEN_RELEASED')).toBe(true);
  });

  it('forfeits a third consecutive six before executing a forced move', () => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, {}, 999);
    state.gameSpecificState.tokens.p1 = [57, -1, 57, 57];
    state.gameSpecificState.consecutiveSixes = 2;
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockReturnValue(6);
    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now()
    });
    expect(result.newState?.gameSpecificState.tokens.p1).toEqual([57, -1, 57, 57]);
    expect(result.newState?.activePlayerId).toBe('p2');
    expect(result.newState?.gameSpecificState.consecutiveSixes).toBe(0);
    expect(result.events.map(event => event.type)).toEqual(['DICE_ROLLED', 'TURN_FORFEITED']);
  });

  it('passes to the next seat when a player finishes on an automatic six', () => {
    const ruleset = new LudoRuleset();
    const table = [...players, { id: 'p3', name: 'Charlie', isBot: false }];
    const state = ruleset.initialize(table, {}, 999);
    state.activePlayerId = 'p2';
    state.turnIndex = 1;
    state.gameSpecificState.tokens.p2 = [12, 57, 57, 57];
    jest.spyOn(DeterministicRNG.prototype, 'rollRange').mockReturnValue(6);
    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE', playerId: 'p2', payload: {}, timestamp: Date.now()
    });
    expect(result.newState?.gameSpecificState.tokens.p2).toEqual([57, 57, 57, 57]);
    expect(result.newState?.gameSpecificState.rankings).toEqual(['p2']);
    expect(result.newState?.turnOrder).toEqual(['p1', 'p3']);
    expect(result.newState?.activePlayerId).toBe('p3');
    expect(result.newState?.turnIndex).toBe(1);
    expect(result.events.map(event => event.type)).toEqual(['DICE_ROLLED', 'TOKEN_MOVED', 'TOKEN_HOME', 'PLAYER_FINISHED']);
  });

  it.each([0.5, NaN, undefined, -1, 4])('rejects malformed token index %s', tokenIndex => {
    const ruleset = new LudoRuleset();
    const state = ruleset.initialize(players, {}, 999);
    state.subState = 'WAITING_FOR_TOKEN_MOVE';
    state.gameSpecificState.lastRoll = 6;
    const result = ruleset.processAction(state, {
      type: 'MOVE_TOKEN', playerId: 'p1', payload: { tokenIndex }, timestamp: Date.now()
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid token index.');
  });

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
