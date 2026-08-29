import { UnoRuleset } from '../engine/uno';
import { IPlayer } from '../engine/interfaces';

describe('UnoRuleset.processAction', () => {
  const players: IPlayer[] = [
    { id: 'p1', name: 'Alice', isBot: false },
    { id: 'p2', name: 'Bob', isBot: false }
  ];

  it('accepts a valid DRAW_CARD action from the active player', () => {
    const ruleset = new UnoRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1' }, 42);

    const result = ruleset.processAction(state, {
      type: 'DRAW_CARD',
      playerId: state.activePlayerId,
      payload: {},
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState).toBeDefined();
  });

  it('rejects PLAY_CARD with an out-of-range card index', () => {
    const ruleset = new UnoRuleset();
    const state = ruleset.initialize(players, { gameId: 'g1' }, 42);

    const result = ruleset.processAction(state, {
      type: 'PLAY_CARD',
      playerId: state.activePlayerId,
      payload: { cardIndex: 999 },
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
