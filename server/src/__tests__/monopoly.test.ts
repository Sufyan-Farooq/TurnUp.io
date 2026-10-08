import { MonopolyRuleset } from '../engine/monopoly';
import { IPlayer } from '../engine/interfaces';
import { DeterministicRNG } from '../engine/rng';

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

  describe('Doubles continuation', () => {
    const ruleset = new MonopolyRuleset();
    // A deterministic double of 1, 2, or 3 keeps fixtures away from wraparound bonuses.
    const seed = Array.from({ length: 1000 }, (_, index) => index).find(value => {
      const rng = new DeterministicRNG(value);
      const first = rng.rollRange(1, 6);
      return first <= 3 && first === rng.rollRange(1, 6);
    })!;
    const rng = new DeterministicRNG(seed);
    const total = rng.rollRange(1, 6) + rng.rollRange(1, 6);
    const setup = (destination: number, config = {}) => {
      const state = ruleset.initialize(players, { startingCash: 1500, ...config }, 7);
      state.rngState = String(seed);
      state.gameSpecificState.positions.p1 = destination - total;
      return state;
    };
    const action = (type: string, playerId = 'p1', payload = {}) => ({ type, playerId, payload, timestamp: 0 });

    it('moves the pawn and permits a second roll immediately after a double', () => {
      const result = ruleset.processAction(setup(12), action('ROLL_DICE'));
      expect(result.isValid).toBe(true);
      expect(result.newState?.gameSpecificState.positions.p1).toBe(12);
      expect(result.newState?.activePlayerId).toBe('p1');
      expect(result.newState?.subState).toBe('WAITING_FOR_ROLL');
      expect(result.events.map(event => event.type)).toContain('PLAYER_MOVED');
      expect(result.events.map(event => event.type)).toContain('EXTRA_ROLL_DUE_TO_DOUBLES');
      expect(ruleset.processAction(result.newState!, action('ROLL_DICE')).isValid).toBe(true);
    });

    it.each(['BUY_PROPERTY', 'END_TURN'])('requires the buy/pass choice before another roll (%s)', choice => {
      const rolled = ruleset.processAction(setup(7), action('ROLL_DICE')).newState!;
      expect(rolled.subState).toBe('WAITING_FOR_BUY_OR_PASS');
      expect(ruleset.processAction(rolled, action('ROLL_DICE')).isValid).toBe(false);
      const resolved = ruleset.processAction(rolled, action(choice));
      expect(resolved.isValid).toBe(true);
      expect(resolved.newState?.subState).toBe('WAITING_FOR_ROLL');
      expect(resolved.newState?.activePlayerId).toBe('p1');
    });

    it('waits for the auction to finish before offering the extra roll', () => {
      const rolled = ruleset.processAction(setup(7, { auction: true }), action('ROLL_DICE')).newState!;
      let state = ruleset.processAction(rolled, action('END_TURN')).newState!;
      expect(state.subState).toBe('AUCTION');
      expect(ruleset.processAction(state, action('ROLL_DICE')).isValid).toBe(false);
      for (const playerId of ['p1', 'p2']) {
        const result = ruleset.processAction(state, action('FOLD', playerId));
        expect(result.isValid).toBe(true);
        state = result.newState!;
      }
      expect(state.subState).toBe('WAITING_FOR_ROLL');
      expect(state.activePlayerId).toBe('p1');
    });

    it('waits for debt to be cleared, then permits the extra roll', () => {
      const state = setup(7);
      state.gameSpecificState.cash.p1 = 10;
      state.gameSpecificState.properties[7] = { ownerId: 'p2', houses: 1, mortgaged: false };
      state.gameSpecificState.properties[6].ownerId = 'p1';
      const rolled = ruleset.processAction(state, action('ROLL_DICE')).newState!;
      expect(rolled.subState).toBe('DEBT_OR_BANKRUPT');
      expect(ruleset.processAction(rolled, action('ROLL_DICE')).isValid).toBe(false);
      const resolved = ruleset.processAction(rolled, action('MORTGAGE', 'p1', { spaceIndex: 6 }));
      expect(resolved.isValid).toBe(true);
      expect(resolved.newState?.subState).toBe('WAITING_FOR_ROLL');
    });

    it.each([false, true])('does not grant an extra roll when sent to jail (third double: %s)', third => {
      const state = setup(third ? 12 : 36);
      state.gameSpecificState.doubleRollCount = third ? 2 : 0;
      const rolled = ruleset.processAction(state, action('ROLL_DICE')).newState!;
      expect(rolled.gameSpecificState.inJail.p1).toBe(true);
      expect(rolled.subState).toBe('WAITING_FOR_TURN_END');
      expect(ruleset.processAction(rolled, action('END_TURN')).newState?.activePlayerId).toBe('p2');
    });

    it('does not grant an extra roll for the double that releases a jailed player', () => {
      const state = setup(12 + total);
      state.subState = 'WAITING_FOR_JAIL_DECISION';
      state.gameSpecificState.inJail.p1 = true;
      if (state.gameSpecificState.properties[12 + total]) state.gameSpecificState.properties[12 + total].ownerId = 'p1';
      const rolled = ruleset.processAction(state, action('ROLL_DICE')).newState!;
      expect(rolled.gameSpecificState.inJail.p1).toBe(false);
      expect(rolled.subState).toBe('WAITING_FOR_TURN_END');
      expect(ruleset.processAction(rolled, action('END_TURN')).newState?.activePlayerId).toBe('p2');
    });
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

    it('rejects negative and non-finite cash on both new and counter offers', () => {
      const ruleset = new MonopolyRuleset();
      const state = ruleset.initialize(players, { gameId: 'g1', startingCash: 1500 }, 7);
      const invalidNewTrade = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: -200, properties: [] },
          request: { cash: 0, properties: [] }
        },
        timestamp: Date.now()
      });
      expect(invalidNewTrade.isValid).toBe(false);

      const validNewTrade = ruleset.processAction(state, {
        type: 'INITIATE_TRADE',
        playerId: 'p1',
        payload: {
          targetPlayerId: 'p2',
          offer: { cash: 100, properties: [] },
          request: { cash: 0, properties: [] }
        },
        timestamp: Date.now()
      });
      expect(validNewTrade.isValid).toBe(true);

      const invalidCounter = ruleset.processAction(validNewTrade.newState!, {
        type: 'COUNTER_TRADE',
        playerId: 'p2',
        payload: {
          offer: { cash: 0, properties: [] },
          request: { cash: Number.POSITIVE_INFINITY, properties: [] }
        },
        timestamp: Date.now()
      });
      expect(invalidCounter.isValid).toBe(false);
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
