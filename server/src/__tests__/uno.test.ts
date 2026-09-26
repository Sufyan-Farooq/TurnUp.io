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

  it('publishes the new direction when a reverse card is played', () => {
    const ruleset = new UnoRuleset();
    const threePlayers = [...players, { id: 'p3', name: 'Cara', isBot: false }];
    const state = ruleset.initialize(threePlayers, { gameId: 'g1' }, 42);
    const activePlayerId = state.activePlayerId;
    state.gameSpecificState.hands[activePlayerId] = [
      { color: 'red', value: 'reverse' },
      { color: 'blue', value: '4' }
    ];
    state.gameSpecificState.currentCard = { color: 'red', value: '3' };
    state.gameSpecificState.currentColor = 'red';
    state.gameSpecificState.pendingDrawCount = 0;
    state.gameSpecificState.direction = 1;

    const result = ruleset.processAction(state, {
      type: 'PLAY_CARD',
      playerId: activePlayerId,
      payload: { cardIndex: 0 },
      timestamp: Date.now()
    });

    expect(result.isValid).toBe(true);
    expect(result.newState?.gameSpecificState.direction).toBe(-1);
    expect(result.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'DIRECTION_REVERSED',
        playerId: activePlayerId,
        payload: { direction: -1 }
      })
    ]));
  });
});
