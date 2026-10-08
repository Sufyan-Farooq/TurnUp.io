import { GameEngineManager, type IPlayer } from '../engine/interfaces';
import { MonopolyRuleset, type MonopolyState } from '../engine/monopoly';
import { chooseMonopolyBotAction, getMonopolyBotActor, getMonopolyBotDelay } from '../engine/monopolyBot';

const bots: IPlayer[] = [{ id: 'bot-a', name: 'Alpha', isBot: true }, { id: 'bot-b', name: 'Beta', isBot: true }];
function game(config = {}) {
  const engine = new GameEngineManager(new MonopolyRuleset());
  engine.initGame(bots.map(bot => ({ ...bot })), { startingCash: 1500, evenBuild: true, ...config }, 7);
  return engine;
}
function act(engine: GameEngineManager) {
  const state = engine.getCurrentState() as MonopolyState;
  const decision = chooseMonopolyBotAction(state, getMonopolyBotActor(state));
  expect(decision).not.toBeNull();
  const result = engine.handleIncomingAction(decision!);
  if (!result.isValid) throw new Error(`${result.error}: ${JSON.stringify({ decision, subState: state.subState, cash: state.gameSpecificState.cash, position: state.gameSpecificState.positions[state.activePlayerId], lastActions: engine.getActionLog().slice(-4) })}`);
  expect(result.error).toBeUndefined();
  expect(result.isValid).toBe(true);
  return decision!;
}

describe('Monopoly bot strategy', () => {
  it('pauses 1.6–3 seconds per action and 2.4–3.9 seconds for trade responses', () => {
    const state = game().getCurrentState() as MonopolyState;
    expect(getMonopolyBotDelay(state, () => 0)).toBe(1600);
    expect(getMonopolyBotDelay(state, () => 1)).toBe(3000);
    state.gameSpecificState.activeTrade = { proposerId: 'bot-a', receiverId: 'bot-b', offer: { cash: 100, properties: [] }, request: { cash: 0, properties: [] } };
    expect(getMonopolyBotDelay(state, () => 0)).toBe(2400);
    expect(getMonopolyBotDelay(state, () => 1)).toBe(3900);
  });

  it('waits for a long pawn move before the next bot decision', () => {
    const state = game().getCurrentState() as MonopolyState;
    state.gameSpecificState.lastRoll = [6, 6];
    const roll = { type: 'ROLL_DICE', playerId: 'bot-a', payload: {}, timestamp: 0 };
    expect(getMonopolyBotDelay(state, () => 0, roll)).toBe(4400);
    expect(getMonopolyBotDelay(state, () => 1, roll)).toBe(5800);
    expect(getMonopolyBotDelay(state, () => 0, { ...roll, type: 'BUY_PROPERTY' })).toBe(1600);
  });
  it('uses shorter random pauses in Fast mode while preserving movement time', () => {
    const state = game({ botSpeed: 'fast' }).getCurrentState() as MonopolyState;
    expect(getMonopolyBotDelay(state, () => 0)).toBe(650);
    expect(getMonopolyBotDelay(state, () => 1)).toBe(1300);
    state.gameSpecificState.lastRoll = [1, 1];
    const roll = { type: 'ROLL_DICE', playerId: 'bot-a', payload: {}, timestamp: 0 };
    expect(getMonopolyBotDelay(state, () => 0, roll)).toBe(2300);
    state.gameSpecificState.lastRoll = [6, 6];
    expect(getMonopolyBotDelay(state, () => 0, roll)).toBe(3450);
  });

  it.each([false, true])('settles off-turn negative cash before the next player rolls (previous player bankrupt: %s)', bankruptcy => {
    const engine = game();
    const state = engine.getCurrentState() as MonopolyState;
    state.subState = bankruptcy ? 'DEBT_OR_BANKRUPT' : 'WAITING_FOR_TURN_END';
    state.gameSpecificState.cash['bot-b'] = -10;
    // Keep a third player alive when testing the bankruptcy transition.
    state.players.push({ id: 'bot-c', name: 'Gamma', isBot: true });
    state.turnOrder.push('bot-c');
    state.gameSpecificState.cash['bot-c'] = 1500;
    const result = engine.handleIncomingAction({ type: bankruptcy ? 'DECLARE_BANKRUPTCY' : 'END_TURN', playerId: 'bot-a', payload: {}, timestamp: 0 });
    expect(result.isValid).toBe(true);
    expect(engine.getCurrentState().activePlayerId).toBe('bot-b');
    expect(engine.getCurrentState().subState).toBe('DEBT_OR_BANKRUPT');
    expect((engine.getCurrentState() as MonopolyState).gameSpecificState.debtAmount).toBe(10);
  });
  it('buys the missing property from another bot, gets an out-of-turn response, and builds', () => {
    const engine = game();
    const state = engine.getCurrentState() as MonopolyState;
    state.gameSpecificState.properties[1].ownerId = 'bot-a';
    state.gameSpecificState.properties[3].ownerId = 'bot-b';
    expect(act(engine).type).toBe('INITIATE_TRADE');
    expect(getMonopolyBotActor(engine.getCurrentState())).toBe('bot-b');
    expect(act(engine).type).toBe('ACCEPT_TRADE');
    expect(act(engine).type).toBe('BUILD_HOUSE');
    expect(act(engine).type).toBe('BUILD_HOUSE');
    const after = engine.getCurrentState() as MonopolyState;
    expect(after.gameSpecificState.properties[1].houses).toBe(1);
    expect(after.gameSpecificState.properties[3].houses).toBe(1);
    expect(Object.values(after.gameSpecificState.cash).reduce((a, b) => a + b)).toBe(2900);
  });

  it('can exchange bundles that complete sets for both bots when cash alone is insufficient', () => {
    const engine = game();
    const state = engine.getCurrentState() as MonopolyState;
    state.gameSpecificState.cash = { 'bot-a': 175, 'bot-b': 325 };
    for (const index of [1, 7, 8]) state.gameSpecificState.properties[index].ownerId = 'bot-a';
    for (const index of [3, 5]) state.gameSpecificState.properties[index].ownerId = 'bot-b';
    const trade = act(engine);
    expect(trade.type).toBe('INITIATE_TRADE');
    expect(trade.payload.offer.properties).toEqual([7, 8]);
    expect(trade.payload.request.properties).toEqual([3]);
    expect(act(engine).type).toBe('ACCEPT_TRADE');
    const after = engine.getCurrentState() as MonopolyState;
    expect([1, 3].every(i => after.gameSpecificState.properties[i].ownerId === 'bot-a')).toBe(true);
    expect([5, 7, 8].every(i => after.gameSpecificState.properties[i].ownerId === 'bot-b')).toBe(true);
  });

  it('rejects a human offer that takes away its full set for nothing', () => {
    const engine = game();
    const state = engine.getCurrentState() as MonopolyState;
    state.players[0].isBot = false;
    for (const index of [1, 3]) state.gameSpecificState.properties[index].ownerId = 'bot-b';
    engine.handleIncomingAction({ type: 'INITIATE_TRADE', playerId: 'bot-a', timestamp: 0,
      payload: { targetPlayerId: 'bot-b', offer: { cash: 1, properties: [] }, request: { cash: 0, properties: [1] } } });
    expect(getMonopolyBotActor(engine.getCurrentState())).toBe('bot-b');
    expect(act(engine).type).toBe('REJECT_TRADE');
  });

  it('does not initiate automated trades with humans or trade mortgaged properties', () => {
    const engine = game();
    const state = engine.getCurrentState() as MonopolyState;
    state.gameSpecificState.properties[1].ownerId = 'bot-a';
    state.gameSpecificState.properties[3].ownerId = 'bot-b';
    state.players[1].isBot = false;
    expect(chooseMonopolyBotAction(state, 'bot-a')?.type).toBe('ROLL_DICE');
    state.players[1].isBot = true;
    state.gameSpecificState.properties[3].mortgaged = true;
    expect(chooseMonopolyBotAction(state, 'bot-a')?.type).toBe('ROLL_DICE');
  });

  it('unmortgages a completed set before building while retaining cash', () => {
    const engine = game();
    const state = engine.getCurrentState() as MonopolyState;
    for (const index of [1, 3]) state.gameSpecificState.properties[index].ownerId = 'bot-a';
    state.gameSpecificState.properties[1].mortgaged = true;
    expect(act(engine).type).toBe('UNMORTGAGE');
    for (let count = 0; count < 10; count++) expect(act(engine).type).toBe('BUILD_HOUSE');
    expect(act(engine).type).toBe('ROLL_DICE');
    expect((engine.getCurrentState() as MonopolyState).gameSpecificState.cash['bot-a']).toBeGreaterThanOrEqual(150);
  });

  it.each([true, false])('sells buildings evenly to clear debt (mortgage enabled: %s)', mortgage => {
    const engine = game({ mortgage });
    const state = engine.getCurrentState() as MonopolyState;
    for (const index of [1, 3]) state.gameSpecificState.properties[index].ownerId = 'bot-a';
    state.gameSpecificState.properties[1].houses = 2;
    state.gameSpecificState.properties[3].houses = 1;
    state.subState = 'DEBT_OR_BANKRUPT';
    state.gameSpecificState.cash['bot-a'] = -30;
    expect(act(engine).type).toBe('SELL_HOUSE');
    expect(act(engine).type).toBe('SELL_HOUSE');
    expect(engine.getCurrentState().subState).toBe('WAITING_FOR_TURN_END');
  });

  it('sells property to clear debt when mortgages are disabled', () => {
    const engine = game({ mortgage: false });
    const state = engine.getCurrentState() as MonopolyState;
    state.gameSpecificState.properties[1].ownerId = 'bot-a';
    state.subState = 'DEBT_OR_BANKRUPT';
    state.gameSpecificState.cash['bot-a'] = -10;
    expect(act(engine).type).toBe('SELL_PROPERTY');
    expect(engine.getCurrentState().subState).toBe('WAITING_FOR_TURN_END');
  });

  it('schedules the auction bidder even when another bot owns the turn', () => {
    const engine = game({ auction: true });
    const state = engine.getCurrentState() as MonopolyState;
    state.subState = 'AUCTION';
    Object.assign(state.gameSpecificState, { auctionSpaceIndex: 1, auctionBidders: ['bot-b', 'bot-a'], auctionActiveBidderIndex: 0, auctionCurrentBid: 0 });
    expect(getMonopolyBotActor(state)).toBe('bot-b');
    expect(act(engine).type).toBe('BID');
    expect(getMonopolyBotActor(engine.getCurrentState())).toBe('bot-a');
  });

  it.each([7, 19, 42, 101, 2026, 404])('finishes a seeded four-bot game (%s) with legal decisions', seed => {
    const engine = new GameEngineManager(new MonopolyRuleset());
    engine.initGame([...bots, { id: 'bot-c', name: 'Gamma', isBot: true }, { id: 'bot-d', name: 'Delta', isBot: true }],
      { startingCash: 1500, evenBuild: true, auction: true, mortgage: true }, seed);
    let actions = 0;
    let trades = 0;
    let buildings = 0;
    while (engine.getCurrentState().status !== 'GAME_OVER' && actions < 20000) {
      const decision = act(engine);
      trades += Number(decision.type === 'ACCEPT_TRADE');
      buildings += Number(decision.type === 'BUILD_HOUSE');
      actions++;
    }
    expect(engine.getCurrentState().status).toBe('GAME_OVER');
    expect(engine.getCurrentState().winnerId).toBeTruthy();
    expect(trades).toBeGreaterThan(0);
    expect(buildings).toBeGreaterThan(0);
  });
});
