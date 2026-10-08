import type { GameAction, GameState } from './interfaces';
import { MONOPOLY_BOARD, validateTradeConditions, type MonopolyState, type TradeOffer } from './monopoly';

const CASH_RESERVE = 150;

/** Keep each broadcast readable, with extra thinking time for trade replies. */
export function getMonopolyBotDelay(state: GameState, random = Math.random, previousAction?: GameAction): number {
  const fast = state.gameSpecificState.config?.botSpeed === 'fast';
  const thinkingTime = state.gameSpecificState.activeTrade
    ? (fast ? 1200 + random() * 900 : 2400 + random() * 1500)
    : (fast ? 650 + random() * 650 : 1600 + random() * 1400);
  // Allow the preceding roll to settle before buying, trading, or rolling again.
  const dice = state.gameSpecificState.lastRoll as [number, number] | undefined;
  const animationTime = previousAction?.type === 'ROLL_DICE' && dice
    ? 720 + (dice[0] + dice[1]) * 170 + 40 : 0;
  // Fast still leaves room for a card warp that travels further than the dice.
  return previousAction?.type === 'ROLL_DICE' ? Math.max(2300, thinkingTime + animationTime) : thinkingTime;
}
const groups = [...new Set(MONOPOLY_BOARD.flatMap(space => space.group ? [space.group] : []))]
  .map(group => MONOPOLY_BOARD.flatMap((space, index) => space.group === group ? [index] : []));

/** Auctions and trade responses belong to their participant, not the turn owner. */
export function getMonopolyBotActor(state: GameState): string {
  const data = state.gameSpecificState;
  const receiver = data.activeTrade?.receiverId;
  if (state.players.some(player => player.id === receiver && player.isBot)) return receiver;
  if (state.subState === 'AUCTION') {
    const bidder = data.auctionBidders?.[data.auctionActiveBidderIndex ?? 0];
    return state.players.some(player => player.id === bidder && player.isBot) ? bidder : '';
  }
  return state.players.some(player => player.id === state.activePlayerId && player.isBot) ? state.activePlayerId : '';
}

function ownedValue(state: MonopolyState, playerId: string): number {
  const properties = state.gameSpecificState.properties;
  let value = Object.entries(properties).reduce((sum, [index, prop]) =>
    sum + (prop.ownerId === playerId ? (MONOPOLY_BOARD[Number(index)].price ?? 0) * (prop.mortgaged ? 0.5 : 1) : 0), 0);
  for (const group of groups) {
    const owned = group.filter(index => properties[index]?.ownerId === playerId).length;
    value += owned * owned * 25;
    if (owned === group.length) value += group.reduce((sum, index) => sum + (MONOPOLY_BOARD[index].price ?? 0) * 2, 0);
  }
  return value;
}

function tradeGains(state: MonopolyState, trade: TradeOffer): [number, number] {
  const properties = { ...state.gameSpecificState.properties };
  for (const index of trade.offer.properties) properties[index] = { ...properties[index], ownerId: trade.receiverId };
  for (const index of trade.request.properties) properties[index] = { ...properties[index], ownerId: trade.proposerId };
  const after = { ...state, gameSpecificState: { ...state.gameSpecificState, properties } };
  const netCash = trade.request.cash - trade.offer.cash;
  return [ownedValue(after, trade.proposerId) - ownedValue(state, trade.proposerId) + netCash,
    ownedValue(after, trade.receiverId) - ownedValue(state, trade.receiverId) - netCash];
}

function findSetTrade(state: MonopolyState, botId: string): TradeOffer | undefined {
  const { properties, cash, bankrupt } = state.gameSpecificState;
  let best: TradeOffer | undefined;
  let bestGain = 0;
  for (const wantedGroup of groups) {
    const missing = wantedGroup.filter(index => properties[index]?.ownerId !== botId);
    if (!missing.length || missing.length === wantedGroup.length) continue;
    const owner = properties[missing[0]]?.ownerId;
    if (!owner || bankrupt[owner] || !state.players.some(p => p.id === owner && p.isBot)) continue;
    if (!missing.every(index => properties[index]?.ownerId === owner)) continue;

    // Try a cash purchase, then exchanges that complete a set for the other bot.
    const exchanges = [[], ...groups.filter(group => group !== wantedGroup && group.some(index => properties[index]?.ownerId === owner))
      .map(group => group.filter(index => properties[index]?.ownerId !== owner))
      .filter(indices => indices.length > 0 && indices.every(index => properties[index]?.ownerId === botId))];
    for (const offered of exchanges) {
      const trade: TradeOffer = { proposerId: botId, receiverId: owner,
        offer: { cash: 0, properties: offered }, request: { cash: 0, properties: missing } };
      const [, recipientGain] = tradeGains(state, trade);
      // Compensate the seller for losing assets; split surplus on mutual set swaps.
      const priceDifference = missing.reduce((sum, i) => sum + (MONOPOLY_BOARD[i].price ?? 0), 0) -
        offered.reduce((sum, i) => sum + (MONOPOLY_BOARD[i].price ?? 0), 0);
      const payment = offered.length ? priceDifference : Math.ceil(-recipientGain + 25);
      trade.offer.cash = Math.max(0, payment);
      trade.request.cash = Math.max(0, -payment);
      if (cash[botId] - trade.offer.cash + trade.request.cash < CASH_RESERVE ||
          cash[owner] - trade.request.cash + trade.offer.cash < CASH_RESERVE) continue;
      if (!validateTradeConditions(state, trade).canExecute) continue;
      const [myGain, theirGain] = tradeGains(state, trade);
      if (myGain > bestGain && theirGain >= 0) { best = trade; bestGain = myGain; }
    }
  }
  return best;
}

/** One legal decision at a time; the engine applies it before we plan again. */
export function chooseMonopolyBotAction(state: MonopolyState, botId: string): GameAction | null {
  const { properties, cash, activeTrade, config } = state.gameSpecificState;
  const money = cash[botId] ?? 0;
  const action = (type: string, payload: GameAction['payload'] = {}): GameAction => ({ type, payload, playerId: botId, timestamp: Date.now() });
  if (activeTrade?.receiverId === botId) {
    const valid = validateTradeConditions(state, activeTrade).canExecute;
    const [, gain] = valid ? tradeGains(state, activeTrade) : [0, -1];
    return action(valid && gain >= 0 ? 'ACCEPT_TRADE' : 'REJECT_TRADE');
  }
  if (state.subState === 'AUCTION') {
    const index = state.gameSpecificState.auctionSpaceIndex;
    const price = index === undefined ? 0 : MONOPOLY_BOARD[index]?.price ?? 0;
    const bid = (state.gameSpecificState.auctionCurrentBid ?? 0) + 10;
    return bid <= price && money - bid >= CASH_RESERVE ? action('BID', { amount: bid }) : action('FOLD');
  }
  if (state.activePlayerId !== botId) return null;
  const owned = Object.keys(properties).map(Number).filter(index => properties[index].ownerId === botId);
  if (state.subState === 'DEBT_OR_BANKRUPT') {
    // Sell from the most developed street to obey even-building rules.
    const improved = owned.filter(index => properties[index].houses > 0)
      .sort((a, b) => properties[b].houses - properties[a].houses);
    if (improved.length) return action('SELL_HOUSE', { spaceIndex: improved[0] });
    const liquid = owned.find(index => !properties[index].mortgaged);
    if (liquid !== undefined) return action(config.mortgage !== false ? 'MORTGAGE' : 'SELL_PROPERTY', { spaceIndex: liquid });
    return action('DECLARE_BANKRUPTCY');
  }
  if (state.subState === 'WAITING_FOR_ROLL' || state.subState === 'WAITING_FOR_TURN_END') {
    const completeGroups = groups.filter(group => group.every(index => properties[index]?.ownerId === botId));
    for (const group of completeGroups) {
      const mortgageCost = group.reduce((sum, index) => sum + (properties[index].mortgaged ? Math.round((MONOPOLY_BOARD[index].mortgageValue ?? 0) * 1.1) : 0), 0);
      const cost = MONOPOLY_BOARD[group[0]].houseCost ?? 0;
      const mortgaged = group.find(index => properties[index].mortgaged);
      if (mortgaged !== undefined) {
        if (config.mortgage !== false && money >= mortgageCost + cost + CASH_RESERVE) return action('UNMORTGAGE', { spaceIndex: mortgaged });
        continue;
      }
      const leastBuilt = [...group].sort((a, b) => properties[a].houses - properties[b].houses)[0];
      if (properties[leastBuilt].houses < 5 && money >= cost + CASH_RESERVE) return action('BUILD_HOUSE', { spaceIndex: leastBuilt });
    }
    if (!activeTrade) {
      const trade = findSetTrade(state, botId);
      if (trade) return action('INITIATE_TRADE', { targetPlayerId: trade.receiverId, offer: trade.offer, request: trade.request });
    }
    return action(state.subState === 'WAITING_FOR_ROLL' ? 'ROLL_DICE' : 'END_TURN');
  }
  if (state.subState === 'WAITING_FOR_BUY_OR_PASS') {
    const index = state.gameSpecificState.positions[botId];
    const space = MONOPOLY_BOARD[index];
    const completesSet = groups.some(group => group.includes(index) && group.every(i => i === index || properties[i]?.ownerId === botId));
    const price = space?.price ?? Infinity;
    return action(money >= price && (completesSet || money - price >= CASH_RESERVE) ? 'BUY_PROPERTY' : 'END_TURN');
  }
  if (state.subState === 'WAITING_FOR_JAIL_DECISION') {
    return action(money >= CASH_RESERVE + 50 ? 'PAY_JAIL_FINE' : 'ROLL_DICE');
  }
  return null;
}
