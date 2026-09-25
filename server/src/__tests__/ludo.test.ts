import { LudoRuleset } from '../engine/ludo';
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
});
