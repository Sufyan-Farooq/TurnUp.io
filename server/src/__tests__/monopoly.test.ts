import { MonopolyRuleset } from '../engine/monopoly';
import { IPlayer } from '../engine/interfaces';

describe('MonopolyRuleset.processAction', () => {
  const players: IPlayer[] = [
    { id: 'p1', name: 'Alice', isBot: false },
    { id: 'p2', name: 'Bob', isBot: false }
  ];

  it('accepts a valid ROLL_DICE action from the active player', () => {
    const ruleset = new MonopolyRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);

    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE',
      playerId: state.activePlayerId,
      payload: {},
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState).toBeDefined();
  });

  it('rejects BUY_PROPERTY before rolling the dice', () => {
    const ruleset = new MonopolyRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);

    const result = ruleset.processAction(state, {
      type: 'BUY_PROPERTY',
      playerId: state.activePlayerId,
      payload: {},
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects MORTGAGE with a non-numeric spaceIndex instead of throwing', () => {
    const ruleset = new MonopolyRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);

    const result = ruleset.processAction(state, {
      type: 'MORTGAGE',
      playerId: state.activePlayerId,
      payload: { spaceIndex: 'not-a-number' },
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
