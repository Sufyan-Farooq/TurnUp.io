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

  describe('Monopoly Trading & Negotiation System', () => {
    it('allows a player to initiate a trade even when it is NOT their turn', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      // Give p1 and p2 properties
      state.gameSpecificState.properties[1].ownerId = 'p1';
      state.gameSpecificState.properties[3].ownerId = 'p2';

      // Ensure active player is p1, but p2 initiates the trade
      state.activePlayerId = 'p1';
      const nonTurnPlayerId = 'p2';

      const res = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: nonTurnPlayerId,
        payload: {
          targetPlayerId: 'p1',
          offer: { cash: 100, properties: [3] },
          request: { cash: 50, properties: [1] }
        },
        timestamp: Date.now()
      });

      expect(res.isValid).toBe(true);
      expect(res.newState?.gameSpecificState.activeTrade).toBeDefined();
      expect(res.newState?.gameSpecificState.activeTrade?.proposerId).toBe('p2');
      expect(res.newState?.gameSpecificState.activeTrade?.receiverId).toBe('p1');
    });

    it('allows the recipient to negotiate a counter-offer (COUNTER_TRADE)', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      state.gameSpecificState.properties[1].ownerId = 'p1';
      state.gameSpecificState.properties[3].ownerId = 'p2';

      // p1 initiates trade to p2
      const initRes = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: 50, properties: [1] },
          request: { cash: 100, properties: [3] }
        },
        timestamp: Date.now()
      });
      expect(initRes.isValid).toBe(true);
      const stateWithTrade = initRes.newState!;

      // p2 negotiates / counters: now p2 offers [3] + 20 cash in exchange for [1] + 200 cash
      const counterRes = ruleset.processAction(stateWithTrade, {
        type: 'COUNTER_TRADE',
        playerId: 'p2',
        payload: {
          offer: { cash: 20, properties: [3] },
          request: { cash: 200, properties: [1] }
        },
        timestamp: Date.now()
      });

      expect(counterRes.isValid).toBe(true);
      const activeTrade = counterRes.newState?.gameSpecificState.activeTrade;
      expect(activeTrade).toBeDefined();
      expect(activeTrade?.proposerId).toBe('p2');
      expect(activeTrade?.receiverId).toBe('p1');
      expect(activeTrade?.offer.cash).toBe(20);
      expect(activeTrade?.request.cash).toBe(200);
      expect(counterRes.events.some(e => e.type === 'TRADE_COUNTERED')).toBe(true);
    });

    it('allows the recipient to decline a trade (REJECT_TRADE)', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      state.gameSpecificState.properties[1].ownerId = 'p1';

      const initRes = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: 50, properties: [1] },
          request: { cash: 100, properties: [] }
        },
        timestamp: Date.now()
      });

      const rejectRes = ruleset.processAction(initRes.newState!, {
        type: 'REJECT_TRADE',
        playerId: 'p2',
        payload: {},
        timestamp: Date.now()
      });

      expect(rejectRes.isValid).toBe(true);
      expect(rejectRes.newState?.gameSpecificState.activeTrade).toBeUndefined();
      expect(rejectRes.events.some(e => e.type === 'TRADE_REJECTED')).toBe(true);
    });

    it('prevents trade execution if conditions no longer match (e.g. proposer spent cash)', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      state.gameSpecificState.properties[1].ownerId = 'p1';

      // p1 offers $1000 + property 1 to p2 for $100
      const initRes = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: 1000, properties: [1] },
          request: { cash: 100, properties: [] }
        },
        timestamp: Date.now()
      });
      const stateWithTrade = initRes.newState!;

      // Time passes, turns occur, p1 pays rent or fine and now only has $400
      stateWithTrade.gameSpecificState.cash['p1'] = 400;

      // p2 attempts to accept the trade
      const acceptRes = ruleset.processAction(stateWithTrade, {
        type: 'ACCEPT_TRADE',
        playerId: 'p2',
        payload: {},
        timestamp: Date.now()
      });

      expect(acceptRes.isValid).toBe(false);
      expect(acceptRes.error).toMatch(/does not have enough cash/i);
      // Trade must not have executed: cash unchanged
      expect(stateWithTrade.gameSpecificState.cash['p1']).toBe(400);
    });

    it('prevents trade execution if property was mortgaged or houses built while trade was pending', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      state.gameSpecificState.properties[1].ownerId = 'p1';

      const initRes = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: 100, properties: [1] },
          request: { cash: 50, properties: [] }
        },
        timestamp: Date.now()
      });
      const stateWithTrade = initRes.newState!;

      // p1 mortgaged property 1 in the meantime
      stateWithTrade.gameSpecificState.properties[1].mortgaged = true;

      const acceptRes = ruleset.processAction(stateWithTrade, {
        type: 'ACCEPT_TRADE',
        playerId: 'p2',
        payload: {},
        timestamp: Date.now()
      });

      expect(acceptRes.isValid).toBe(false);
      expect(acceptRes.error).toMatch(/mortgaged/i);
    });

    it('successfully completes trade when conditions DO match', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      state.gameSpecificState.properties[1].ownerId = 'p1';
      state.gameSpecificState.properties[3].ownerId = 'p2';

      const initRes = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: 100, properties: [1] },
          request: { cash: 200, properties: [3] }
        },
        timestamp: Date.now()
      });

      const acceptRes = ruleset.processAction(initRes.newState!, {
        type: 'ACCEPT_TRADE',
        playerId: 'p2',
        payload: {},
        timestamp: Date.now()
      });

      expect(acceptRes.isValid).toBe(true);
      const nextGss = acceptRes.newState!.gameSpecificState;
      // p1 gave 100, received 200 => net +100
      expect(nextGss.cash['p1']).toBe(1600);
      // p2 gave 200, received 100 => net -100
      expect(nextGss.cash['p2']).toBe(1400);
      // Properties swapped
      expect(nextGss.properties[1].ownerId).toBe('p2');
      expect(nextGss.properties[3].ownerId).toBe('p1');
      expect(nextGss.activeTrade).toBeUndefined();
    });
  });
});
