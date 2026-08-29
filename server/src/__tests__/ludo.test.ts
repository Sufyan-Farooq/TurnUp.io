import { LudoRuleset } from '../engine/ludo';
import { IPlayer } from '../engine/interfaces';

describe('LudoRuleset.processAction', () => {
  const players: IPlayer[] = [
    { id: 'p1', name: 'Alice', isBot: false, color: '#d90429' },
    { id: 'p2', name: 'Bob', isBot: false, color: '#38b000' }
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
});
