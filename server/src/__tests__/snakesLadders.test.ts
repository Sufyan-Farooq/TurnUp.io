import { SnakesLaddersRuleset } from '../engine/snakesLadders';
import { IPlayer } from '../engine/interfaces';

describe('SnakesLaddersRuleset.processAction', () => {
  const players: IPlayer[] = [
    { id: 'p1', name: 'Alice', isBot: false },
    { id: 'p2', name: 'Bob', isBot: false }
  ];

  it('accepts a valid ROLL_DICE action from the active player', () => {
    const ruleset = new SnakesLaddersRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1' }, 12345);

    const result = ruleset.processAction(state, {
      type: 'ROLL_DICE',
      playerId: state.activePlayerId,
      payload: {},
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState).toBeDefined();
    expect(result.newState!.gameSpecificState.lastRoll).toBeGreaterThanOrEqual(1);
    expect(result.newState!.gameSpecificState.lastRoll).toBeLessThanOrEqual(6);
  });

  it('rejects an action type other than ROLL_DICE', () => {
    const ruleset = new SnakesLaddersRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1' }, 12345);

    const result = ruleset.processAction(state, {
      type: 'JUMP',
      playerId: state.activePlayerId,
      payload: {},
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
