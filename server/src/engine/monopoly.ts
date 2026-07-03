import { IGameRuleset, GameState, GameAction, ActionResult, IPlayer, GameEvent } from './interfaces';
import { DeterministicRNG } from './rng';

interface MonopolySpace {
  name: string;
  type: 'go' | 'property' | 'chance' | 'community_chest' | 'tax' | 'railroad' | 'utility' | 'jail' | 'go_to_jail' | 'free_parking';
  group?: string; // color group: 'brazil', 'israel', 'india', 'italy', 'germany', 'china', 'france', 'japan', 'united-kingdom', 'united-states-of-america'
  price?: number;
  rent?: number[]; // [base, 1h, 2h, 3h, 4h, hotel] for properties. For railroad/utility: calculated dynamically.
  houseCost?: number;
  mortgageValue?: number;
}

const MONOPOLY_BOARD: MonopolySpace[] = [
  { name: 'START', type: 'go' }, // 0
  { name: 'Salvador', type: 'property', group: 'brazil', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 }, // 1
  { name: 'Treasure', type: 'community_chest' }, // 2
  { name: 'Rio', type: 'property', group: 'brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 }, // 3
  { name: 'Earnings Tax', type: 'tax', price: 200 }, // 4
  { name: 'Tel Aviv', type: 'property', group: 'israel', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 }, // 5
  { name: 'TLV Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 6
  { name: 'Haifa', type: 'property', group: 'israel', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 }, // 7
  { name: 'Jerusalem', type: 'property', group: 'israel', price: 110, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 55 }, // 8
  { name: 'Surprise', type: 'chance' }, // 9
  { name: 'Mumbai', type: 'property', group: 'india', price: 120, rent: [8, 45, 120, 350, 500, 650], houseCost: 100, mortgageValue: 60 }, // 10
  { name: 'New Delhi', type: 'property', group: 'india', price: 130, rent: [10, 45, 130, 400, 575, 700], houseCost: 100, mortgageValue: 65 }, // 11
  { name: 'In Prison / Passing by', type: 'jail' }, // 12
  { name: 'Venice', type: 'property', group: 'italy', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 }, // 13
  { name: 'Bologna', type: 'property', group: 'italy', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 }, // 14
  { name: 'Power Company', type: 'utility', price: 150, mortgageValue: 75 }, // 15
  { name: 'Milan', type: 'property', group: 'italy', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 }, // 16
  { name: 'Rome', type: 'property', group: 'italy', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 }, // 17
  { name: 'MUC Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 18
  { name: 'Frankfurt', type: 'property', group: 'germany', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 }, // 19
  { name: 'Treasure', type: 'community_chest' }, // 20
  { name: 'Munich', type: 'property', group: 'germany', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 }, // 21
  { name: 'Gas Company', type: 'utility', price: 150, mortgageValue: 75 }, // 22
  { name: 'Berlin', type: 'property', group: 'germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 }, // 23
  { name: 'Vacation', type: 'free_parking' }, // 24
  { name: 'Shenzhen', type: 'property', group: 'china', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 }, // 25
  { name: 'Surprise', type: 'chance' }, // 26
  { name: 'Beijing', type: 'property', group: 'china', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 }, // 27
  { name: 'Treasure', type: 'community_chest' }, // 28
  { name: 'Shanghai', type: 'property', group: 'china', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 }, // 29
  { name: 'CDG Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 30
  { name: 'Toulouse', type: 'property', group: 'france', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 }, // 31
  { name: 'Paris', type: 'property', group: 'france', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 }, // 32
  { name: 'Water Company', type: 'utility', price: 150, mortgageValue: 75 }, // 33
  { name: 'Yokohama', type: 'property', group: 'japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 }, // 34
  { name: 'Tokyo', type: 'property', group: 'japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 }, // 35
  { name: 'Go to prison', type: 'go_to_jail' }, // 36
  { name: 'Liverpool', type: 'property', group: 'united-kingdom', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 }, // 37
  { name: 'Manchester', type: 'property', group: 'united-kingdom', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 }, // 38
  { name: 'Treasure', type: 'community_chest' }, // 39
  { name: 'Birmingham', type: 'property', group: 'united-kingdom', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 }, // 40
  { name: 'London', type: 'property', group: 'united-kingdom', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 }, // 41
  { name: 'JFK Airport', type: 'railroad', price: 200, mortgageValue: 100 }, // 42
  { name: 'Los Angeles', type: 'property', group: 'united-states-of-america', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 }, // 43
  { name: 'Surprise', type: 'chance' }, // 44
  { name: 'San Francisco', type: 'property', group: 'united-states-of-america', price: 360, rent: [40, 180, 540, 1200, 1450, 1675], houseCost: 200, mortgageValue: 180 }, // 45
  { name: 'Premium Tax', type: 'tax', price: 75 }, // 46
  { name: 'New York', type: 'property', group: 'united-states-of-america', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 } // 47
];

const TREASURE_DECK = [
  { text: "Advance to START. (Collect $200)", action: { type: "move-to-block", blockIndex: 0, collectGo: true } },
  { text: "You found a wallet containing some cash. Collect $200.", action: { type: "money-event", moneyType: "earn", amount: 200 } },
  { text: "Your car has ran out of gas. Pay $50.", action: { type: "money-event", moneyType: "pay", amount: 50 } },
  { text: "From trading stocks you earned $50.", action: { type: "money-event", moneyType: "earn", amount: 50 } },
  { text: "Go to prison.", action: { type: "go-to-prison" } },
  { text: "You host a party. Collect $50 from every player for equipment.", action: { type: "collect-from-each-player", amount: 50 } },
  { text: "Happy holidays! Receive $20.", action: { type: "money-event", moneyType: "earn", amount: 20 } },
  { text: "Tax refund. Collect $100.", action: { type: "money-event", moneyType: "earn", amount: 100 } },
  { text: "Happy birthday! Collect $10 from every player.", action: { type: "collect-from-each-player", amount: 10 } },
  { text: "From gift cards you get $100.", action: { type: "money-event", moneyType: "earn", amount: 100 } },
  { text: "Car rental insurance. Pay $60.", action: { type: "money-event", moneyType: "pay", amount: 60 } },
  { text: "Your phone died. Pay $50 for a repair.", action: { type: "money-event", moneyType: "pay", amount: 50 } },
  { text: "Beneficial business decisions. You made a profit of $25.", action: { type: "money-event", moneyType: "earn", amount: 25 } },
  { text: "It's time to renovate your properties. Pay $30 per house and $120 per hotel you own.", action: { type: "repairs", perHouse: 30, perHotel: 120 } },
  { text: "You have won third prize in a lottery. Collect $15.", action: { type: "money-event", moneyType: "earn", amount: 15 } },
  { text: "You received $100 from your sibling.", action: { type: "money-event", moneyType: "earn", amount: 100 } },
  { text: "Received a Pardon card.", action: { type: "get-pardon-card", deck: "treasure" } }
];

const SURPRISE_DECK = [
  { text: "Advance to START. (Collect $200)", action: { type: "move-to-block", blockIndex: 0, collectGo: true } },
  { text: "Advance to Liverpool.", action: { type: "move-to-block", blockIndex: 37, collectGo: true } },
  { text: "Advance to Rome.", action: { type: "move-to-block", blockIndex: 17, collectGo: true } },
  { text: "Advance to the next company.", action: { type: "move-to-next-grouped", group: "company" } },
  { text: "Advance to the next airport.", action: { type: "move-to-next-grouped", group: "airport" } },
  { text: "Stock agency pays you dividend of $60.", action: { type: "money-event", moneyType: "earn", amount: 60 } },
  { text: "Go back 3 steps.", action: { type: "move-steps", steps: -3 } },
  { text: "Go to prison.", action: { type: "go-to-prison" } },
  { text: "Have a redesign for your properties. Pay $25 for each house and $100 for each hotel.", action: { type: "repairs", perHouse: 25, perHotel: 100 } },
  { text: "Pay tax of $20.", action: { type: "money-event", moneyType: "pay", amount: 20 } },
  { text: "Take a trip to Tel Aviv.", action: { type: "move-to-block", blockIndex: 5, collectGo: true } },
  { text: "Have an adventure to San Francisco.", action: { type: "move-to-block", blockIndex: 45, collectGo: true } },
  { text: "You lost a bet. Pay each player $50.", action: { type: "pay-each-player", amount: 50 } },
  { text: "You have a new investment. Receive $150.", action: { type: "money-event", moneyType: "earn", amount: 150 } },
  { text: "From a scholarship you get $100.", action: { type: "money-event", moneyType: "earn", amount: 100 } },
  { text: "Your cousin needs some financial assistance. Pay $50.", action: { type: "money-event", moneyType: "pay", amount: 50 } },
  { text: "Received a Pardon card.", action: { type: "get-pardon-card", deck: "surprise" } }
];

export interface PropertyState {
  ownerId: string | null;
  mortgaged: boolean;
  houses: number; // 0-5 (5 is hotel)
}

export interface TradeOffer {
  proposerId: string;
  receiverId: string;
  offer: {
    cash: number;
    properties: number[];
  };
  request: {
    cash: number;
    properties: number[];
  };
}

export interface MonopolyState extends GameState {
  gameSpecificState: {
    positions: Record<string, number>; // playerId -> 0-47
    cash: Record<string, number>; // playerId -> cash
    inJail: Record<string, boolean>; // playerId -> boolean
    jailTurns: Record<string, number>; // playerId -> turns spent (0-3)
    jailCards: Record<string, number>; // playerId -> pardon cards
    bankrupt: Record<string, boolean>; // playerId -> boolean
    properties: Record<number, PropertyState>; // spaceIndex -> PropertyState
    doubleRollCount: number;
    lastRoll: [number, number]; // [die1, die2]
    debtOwedTo: string | null; // playerId or 'bank'
    debtAmount: number;
    vacationCashPool: number;
    auctionSpaceIndex?: number;
    auctionCurrentBid?: number;
    auctionHighestBidderId?: string | null;
    auctionActiveBidderIndex?: number;
    auctionBidders?: string[];
    auctionOriginPlayerId?: string;
    activeTrade?: TradeOffer;
    config: {
      startingCash: number;
      doubleRentRule: boolean;
      vacationCash: boolean;
      auction: boolean;
      prisonRent: boolean;
      evenBuild: boolean;
      mortgage: boolean;
    };
  };
}

export class MonopolyRuleset implements IGameRuleset<MonopolyState> {
  public gameType = 'MONOPOLY';

  public initialize(players: IPlayer[], config: Record<string, any>, seed: number): MonopolyState {
    const positions: Record<string, number> = {};
    const cash: Record<string, number> = {};
    const inJail: Record<string, boolean> = {};
    const jailTurns: Record<string, number> = {};
    const bankrupt: Record<string, boolean> = {};
    const jailCards: Record<string, number> = {};

    const startingCashVal = config.startingCash !== undefined ? Number(config.startingCash) : 1500;

    players.forEach(p => {
      positions[p.id] = 0;
      cash[p.id] = startingCashVal;
      inJail[p.id] = false;
      jailTurns[p.id] = 0;
      bankrupt[p.id] = false;
      jailCards[p.id] = 0;
    });

    const properties: Record<number, PropertyState> = {};
    MONOPOLY_BOARD.forEach((space, idx) => {
      if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
        properties[idx] = { ownerId: null, mortgaged: false, houses: 0 };
      }
    });

    let turnOrder = players.map(p => p.id);
    if (config.randomizeOrder) {
      const rng = new DeterministicRNG(seed);
      for (let i = turnOrder.length - 1; i > 0; i--) {
        const j = rng.rollRange(0, i);
        const temp = turnOrder[i];
        turnOrder[i] = turnOrder[j];
        turnOrder[j] = temp;
      }
    }

    return {
      gameId: config.gameId || 'game_monopoly',
      gameType: this.gameType,
      status: 'ACTIVE',
      players,
      activePlayerId: turnOrder[0] || '',
      turnOrder,
      turnIndex: 0,
      subState: 'WAITING_FOR_ROLL',
      rngState: seed.toString(),
      winnerId: null,
      historyLength: 0,
      gameSpecificState: {
        positions,
        cash,
        inJail,
        jailTurns,
        jailCards,
        bankrupt,
        properties,
        doubleRollCount: 0,
        lastRoll: [0, 0],
        debtOwedTo: null,
        debtAmount: 0,
        vacationCashPool: 0,
        config: {
          startingCash: startingCashVal,
          doubleRentRule: config.doubleRentRule !== undefined ? !!config.doubleRentRule : true,
          vacationCash: config.vacationCash !== undefined ? !!config.vacationCash : false,
          auction: config.auction !== undefined ? !!config.auction : false,
          prisonRent: config.prisonRent !== undefined ? !!config.prisonRent : false,
          evenBuild: config.evenBuild !== undefined ? !!config.evenBuild : true,
          mortgage: config.mortgage !== undefined ? !!config.mortgage : true
        }
      }
    };
  }

  public processAction(currentState: MonopolyState, action: GameAction): ActionResult<MonopolyState> {
    const { type, playerId, payload } = action;

    const isOutOfTurnAction = 
      (currentState.subState === 'AUCTION' && (type === 'BID' || type === 'FOLD')) ||
      (type === 'INITIATE_TRADE' || type === 'ACCEPT_TRADE' || type === 'REJECT_TRADE');
    if (!isOutOfTurnAction && playerId !== currentState.activePlayerId) {
      return { isValid: false, error: 'Not your turn.', events: [] };
    }

    const rng = new DeterministicRNG(parseInt(currentState.rngState, 10));
    const events: GameEvent[] = [];

    // Helper to check debt / negative cash transition (mutates state in-place)
    const handleNegativeCash = (state: MonopolyState, targetPlayerId: string, amount: number, creditor: string | null): void => {
      const currentCash = state.gameSpecificState.cash[targetPlayerId];
      if (currentCash < 0) {
        state.subState = 'DEBT_OR_BANKRUPT';
        state.gameSpecificState.debtOwedTo = creditor;
        state.gameSpecificState.debtAmount = amount;
      }
    };

    if (type === 'INITIATE_TRADE') {
      const targetPlayerId = payload.targetPlayerId;
      const offer = payload.offer || { cash: 0, properties: [] };
      const request = payload.request || { cash: 0, properties: [] };

      if (!targetPlayerId || targetPlayerId === playerId) {
        return { isValid: false, error: 'Invalid target player for trade.', events: [] };
      }
      if (currentState.gameSpecificState.activeTrade) {
        return { isValid: false, error: 'A trade is already in progress. Please wait for it to resolve.', events: [] };
      }
      if (currentState.gameSpecificState.bankrupt[targetPlayerId]) {
        return { isValid: false, error: 'Cannot trade with a bankrupt player.', events: [] };
      }
      // W-4: Block proposer from trading while they are in debt resolution
      if (currentState.subState === 'DEBT_OR_BANKRUPT') {
        return { isValid: false, error: 'You must resolve your debt before initiating a trade.', events: [] };
      }
      const proposerCashW4 = currentState.gameSpecificState.cash[playerId] || 0;
      if (proposerCashW4 < 0) {
        return { isValid: false, error: 'You cannot initiate a trade while in debt.', events: [] };
      }

      // Check proposer cash can cover the offer
      const proposerCash = currentState.gameSpecificState.cash[playerId] || 0;
      if (offer.cash > 0 && proposerCash < offer.cash) {
        return { isValid: false, error: 'You do not have enough cash for this offer.', events: [] };
      }

      // Check proposer properties
      const properties = currentState.gameSpecificState.properties || {};
      for (const spaceIndex of (offer.properties || [])) {
        const prop = properties[spaceIndex];
        if (!prop || prop.ownerId !== playerId) {
          return { isValid: false, error: `You do not own property index ${spaceIndex}.`, events: [] };
        }
        if (prop.houses > 0) {
          return { isValid: false, error: 'Cannot trade a property that has houses built on it.', events: [] };
        }
        // Check if any property in this group has houses
        const space = MONOPOLY_BOARD[spaceIndex];
        if (space.group) {
          const hasHouses = Object.entries(properties).some(([idx, p]) => {
            const s = MONOPOLY_BOARD[parseInt(idx, 10)];
            return s.group === space.group && p.houses > 0;
          });
          if (hasHouses) {
            return { isValid: false, error: 'Cannot trade property in group with built houses.', events: [] };
          }
        }
      }

      // Check receiver cash
      const receiverCash = currentState.gameSpecificState.cash[targetPlayerId] || 0;
      if (request.cash > 0 && receiverCash < request.cash) {
        return { isValid: false, error: 'Target player does not have enough cash.', events: [] };
      }

      // Check receiver properties
      for (const spaceIndex of (request.properties || [])) {
        const prop = properties[spaceIndex];
        if (!prop || prop.ownerId !== targetPlayerId) {
          return { isValid: false, error: `Target player does not own property index ${spaceIndex}.`, events: [] };
        }
        if (prop.houses > 0) {
          return { isValid: false, error: 'Cannot trade a property that has houses built on it.', events: [] };
        }
        const space = MONOPOLY_BOARD[spaceIndex];
        if (space.group) {
          const hasHouses = Object.entries(properties).some(([idx, p]) => {
            const s = MONOPOLY_BOARD[parseInt(idx, 10)];
            return s.group === space.group && p.houses > 0;
          });
          if (hasHouses) {
            return { isValid: false, error: 'Cannot trade property in group with built houses.', events: [] };
          }
        }
      }

      // Safe to propose! Stash the active trade in state
      const newTrade = {
        proposerId: playerId,
        receiverId: targetPlayerId,
        offer: {
          cash: offer.cash || 0,
          properties: offer.properties || []
        },
        request: {
          cash: request.cash || 0,
          properties: request.properties || []
        }
      };

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          activeTrade: newTrade
        }
      };

      events.push({
        type: 'TRADE_INITIATED',
        playerId,
        payload: { targetPlayerId, offer, request }
      });

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'REJECT_TRADE') {
      const activeTrade = currentState.gameSpecificState.activeTrade;
      if (!activeTrade) {
        return { isValid: false, error: 'No active trade proposal exists.', events: [] };
      }
      if (playerId !== activeTrade.receiverId && playerId !== activeTrade.proposerId) {
        return { isValid: false, error: 'You are not a participant in this trade.', events: [] };
      }

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          activeTrade: undefined
        }
      };

      events.push({
        type: 'TRADE_REJECTED',
        playerId,
        payload: { proposerId: activeTrade.proposerId, receiverId: activeTrade.receiverId }
      });

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'ACCEPT_TRADE') {
      const activeTrade = currentState.gameSpecificState.activeTrade;
      if (!activeTrade) {
        return { isValid: false, error: 'No active trade proposal exists.', events: [] };
      }
      if (playerId !== activeTrade.receiverId) {
        return { isValid: false, error: 'Only the receiver can accept the trade offer.', events: [] };
      }

      const { proposerId, receiverId, offer, request } = activeTrade;

      // Re-validate proposers and receivers cash & properties
      const properties = currentState.gameSpecificState.properties || {};
      const updatedProperties = { ...properties };
      const updatedCash = { ...currentState.gameSpecificState.cash };

      // 1. Proposer validation
      if (updatedCash[proposerId] < offer.cash) {
        return { isValid: false, error: 'Proposer no longer has enough cash to complete trade.', events: [] };
      }
      for (const spaceIndex of offer.properties) {
        const prop = properties[spaceIndex];
        if (!prop || prop.ownerId !== proposerId) {
          return { isValid: false, error: 'Proposer no longer owns one of the offered properties.', events: [] };
        }
        if (prop.houses > 0) {
          return { isValid: false, error: 'One of the offered properties now has houses.', events: [] };
        }
      }

      // 2. Receiver validation
      if (updatedCash[receiverId] < request.cash) {
        return { isValid: false, error: 'You no longer have enough cash to complete trade.', events: [] };
      }
      for (const spaceIndex of request.properties) {
        const prop = properties[spaceIndex];
        if (!prop || prop.ownerId !== receiverId) {
          return { isValid: false, error: 'You no longer own one of the requested properties.', events: [] };
        }
        if (prop.houses > 0) {
          return { isValid: false, error: 'One of the requested properties now has houses.', events: [] };
        }
      }

      // 3. Execute exchanges!
      updatedCash[proposerId] -= offer.cash;
      updatedCash[receiverId] += offer.cash;

      updatedCash[receiverId] -= request.cash;
      updatedCash[proposerId] += request.cash;

      for (const spaceIndex of offer.properties) {
        updatedProperties[spaceIndex] = { ...properties[spaceIndex], ownerId: receiverId };
      }

      for (const spaceIndex of request.properties) {
        updatedProperties[spaceIndex] = { ...properties[spaceIndex], ownerId: proposerId };
      }

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash,
          activeTrade: undefined
        }
      };

      events.push({
        type: 'TRADE_ACCEPTED',
        playerId,
        payload: { proposerId, receiverId, offer, request }
      });

      return { isValid: true, newState: nextState, events };
    }

    // Actions that can be performed during turn (mortgaging, building, unmortgaging, selling)
    if (type === 'MORTGAGE') {
      const config = currentState.gameSpecificState.config || {};
      if (!config.mortgage) {
        return { isValid: false, error: 'Mortgaging is disabled in this match.', events: [] };
      }

      const spaceIndex = payload.spaceIndex;
      const propState = currentState.gameSpecificState.properties[spaceIndex];
      const space = MONOPOLY_BOARD[spaceIndex];

      if (!propState || propState.ownerId !== playerId) {
        return { isValid: false, error: 'You do not own this property.', events: [] };
      }
      if (propState.mortgaged) {
        return { isValid: false, error: 'Property is already mortgaged.', events: [] };
      }
      if (propState.houses > 0) {
        return { isValid: false, error: 'You must sell all houses on the color group first.', events: [] };
      }

      // Check that no property in this group has houses
      if (space.group) {
        const hasHouses = Object.entries(currentState.gameSpecificState.properties).some(([idx, p]) => {
          const s = MONOPOLY_BOARD[parseInt(idx, 10)];
          return s.group === space.group && p.houses > 0;
        });
        if (hasHouses) {
          return { isValid: false, error: 'Cannot mortgage property in group with built houses.', events: [] };
        }
      }

      const mortgageValue = space.mortgageValue || 0;
      const updatedProperties = { ...currentState.gameSpecificState.properties };
      updatedProperties[spaceIndex] = { ...propState, mortgaged: true };

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] += mortgageValue;

      events.push({
        type: 'PROPERTY_MORTGAGED',
        playerId,
        payload: { spaceIndex, value: mortgageValue }
      });

      let nextSubState = currentState.subState;
      let debtOwedTo = currentState.gameSpecificState.debtOwedTo;
      let debtAmount = currentState.gameSpecificState.debtAmount;

      if (updatedCash[playerId] >= 0 && currentState.subState === 'DEBT_OR_BANKRUPT') {
        nextSubState = 'WAITING_FOR_TURN_END';
        debtOwedTo = null;
        debtAmount = 0;
      }

      const nextState: MonopolyState = {
        ...currentState,
        subState: nextSubState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash,
          debtOwedTo,
          debtAmount
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'UNMORTGAGE') {
      const config = currentState.gameSpecificState.config || {};
      if (!config.mortgage) {
        return { isValid: false, error: 'Mortgaging is disabled in this match.', events: [] };
      }

      const spaceIndex = payload.spaceIndex;
      const propState = currentState.gameSpecificState.properties[spaceIndex];
      const space = MONOPOLY_BOARD[spaceIndex];

      if (!propState || propState.ownerId !== playerId) {
        return { isValid: false, error: 'You do not own this property.', events: [] };
      }
      if (!propState.mortgaged) {
        return { isValid: false, error: 'Property is not mortgaged.', events: [] };
      }

      const mortgageValue = space.mortgageValue || 0;
      const cost = Math.round(mortgageValue * 1.1);

      if (currentState.gameSpecificState.cash[playerId] < cost) {
        return { isValid: false, error: 'Not enough cash to unmortgage.', events: [] };
      }

      const updatedProperties = { ...currentState.gameSpecificState.properties };
      updatedProperties[spaceIndex] = { ...propState, mortgaged: false };

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] -= cost;

      events.push({
        type: 'PROPERTY_UNMORTGAGED',
        playerId,
        payload: { spaceIndex, cost }
      });

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'SELL_PROPERTY') {
      const spaceIndex = payload.spaceIndex;
      const propState = currentState.gameSpecificState.properties[spaceIndex];
      const space = MONOPOLY_BOARD[spaceIndex];

      if (!propState || propState.ownerId !== playerId) {
        return { isValid: false, error: 'You do not own this property.', events: [] };
      }
      if (propState.houses > 0) {
        return { isValid: false, error: 'You must sell all houses on the color group first.', events: [] };
      }

      // Calculate refund: 50% of property price
      const refund = Math.floor((space.price || 0) * 0.5);

      const updatedProperties = { ...currentState.gameSpecificState.properties };
      updatedProperties[spaceIndex] = { ownerId: null, mortgaged: false, houses: 0 };

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] += refund;

      events.push({
        type: 'PROPERTY_SOLD',
        playerId,
        payload: { spaceIndex, refund }
      });

      let nextSubState = currentState.subState;
      let debtOwedTo = currentState.gameSpecificState.debtOwedTo;
      let debtAmount = currentState.gameSpecificState.debtAmount;

      if (updatedCash[playerId] >= 0 && currentState.subState === 'DEBT_OR_BANKRUPT') {
        nextSubState = 'WAITING_FOR_TURN_END';
        debtOwedTo = null;
        debtAmount = 0;
      }

      const nextState: MonopolyState = {
        ...currentState,
        subState: nextSubState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash,
          debtOwedTo,
          debtAmount
        }
      };

      return { isValid: true, newState: nextState, events };
    }


    if (type === 'BUILD_HOUSE') {
      const spaceIndex = payload.spaceIndex;
      const propState = currentState.gameSpecificState.properties[spaceIndex];
      const space = MONOPOLY_BOARD[spaceIndex];

      if (!propState || propState.ownerId !== playerId) {
        return { isValid: false, error: 'You do not own this property.', events: [] };
      }
      if (space.type !== 'property' || !space.group) {
        return { isValid: false, error: 'You can only build houses on streets.', events: [] };
      }
      if (propState.mortgaged) {
        return { isValid: false, error: 'Cannot build on mortgaged property.', events: [] };
      }
      if (propState.houses >= 5) {
        return { isValid: false, error: 'Already reached maximum improvements (Hotel).', events: [] };
      }

      // Check group ownership
      const groupSpaces = MONOPOLY_BOARD.filter(s => s.group === space.group);
      const ownsAll = groupSpaces.every(s => {
        const idx = MONOPOLY_BOARD.indexOf(s);
        return currentState.gameSpecificState.properties[idx].ownerId === playerId;
      });
      if (!ownsAll) {
        return { isValid: false, error: 'You must own the full color group to build houses.', events: [] };
      }

      // Check group mortgaged
      const anyMortgaged = groupSpaces.some(s => {
        const idx = MONOPOLY_BOARD.indexOf(s);
        return currentState.gameSpecificState.properties[idx].mortgaged;
      });
      if (anyMortgaged) {
        return { isValid: false, error: 'Cannot build if any property in the group is mortgaged.', events: [] };
      }

      // Check building evenly
      const config = currentState.gameSpecificState.config || {};
      if (config.evenBuild) {
        const currentHouses = propState.houses;
        const canBuild = groupSpaces.every(s => {
          const idx = MONOPOLY_BOARD.indexOf(s);
          const otherHouses = currentState.gameSpecificState.properties[idx].houses;
          return currentHouses <= otherHouses;
        });
        if (!canBuild) {
          return { isValid: false, error: 'You must build evenly across the group.', events: [] };
        }
      }

      const houseCost = space.houseCost || 0;
      if (currentState.gameSpecificState.cash[playerId] < houseCost) {
        return { isValid: false, error: 'Not enough cash to build house.', events: [] };
      }

      const updatedProperties = { ...currentState.gameSpecificState.properties };
      updatedProperties[spaceIndex] = { ...propState, houses: propState.houses + 1 };

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] -= houseCost;

      events.push({
        type: 'HOUSE_BUILT',
        playerId,
        payload: { spaceIndex, housesCount: propState.houses + 1 }
      });

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'SELL_HOUSE') {
      const spaceIndex = payload.spaceIndex;
      const propState = currentState.gameSpecificState.properties[spaceIndex];
      const space = MONOPOLY_BOARD[spaceIndex];

      if (!propState || propState.ownerId !== playerId) {
        return { isValid: false, error: 'You do not own this property.', events: [] };
      }
      if (propState.houses === 0) {
        return { isValid: false, error: 'No houses to sell on this property.', events: [] };
      }

      // Check selling evenly
      const config = currentState.gameSpecificState.config || {};
      if (config.evenBuild) {
        const currentHouses = propState.houses;
        const groupSpaces = MONOPOLY_BOARD.filter(s => s.group === space.group);
        const canSell = groupSpaces.every(s => {
          const idx = MONOPOLY_BOARD.indexOf(s);
          const otherHouses = currentState.gameSpecificState.properties[idx].houses;
          return currentHouses >= otherHouses;
        });
        if (!canSell) {
          return { isValid: false, error: 'You must sell evenly across the group.', events: [] };
        }
      }

      const refund = Math.floor((space.houseCost || 0) / 2);
      const updatedProperties = { ...currentState.gameSpecificState.properties };
      updatedProperties[spaceIndex] = { ...propState, houses: propState.houses - 1 };

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] += refund;

      events.push({
        type: 'HOUSE_SOLD',
        playerId,
        payload: { spaceIndex, housesCount: propState.houses - 1, refund }
      });

      let nextSubState = currentState.subState;
      let debtOwedTo = currentState.gameSpecificState.debtOwedTo;
      let debtAmount = currentState.gameSpecificState.debtAmount;

      if (updatedCash[playerId] >= 0 && currentState.subState === 'DEBT_OR_BANKRUPT') {
        nextSubState = 'WAITING_FOR_TURN_END';
        debtOwedTo = null;
        debtAmount = 0;
      }

      const nextState: MonopolyState = {
        ...currentState,
        subState: nextSubState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash,
          debtOwedTo,
          debtAmount
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'ROLL_DICE') {
      const isPlayerInJail = currentState.gameSpecificState.inJail[playerId];

      if (isPlayerInJail) {
        if (currentState.subState !== 'WAITING_FOR_JAIL_DECISION') {
          return { isValid: false, error: 'Must make jail decision or already rolled.', events: [] };
        }
      } else {
        if (currentState.subState !== 'WAITING_FOR_ROLL') {
          return { isValid: false, error: 'You cannot roll dice right now.', events: [] };
        }
      }

      const die1 = rng.rollRange(1, 6);
      const die2 = rng.rollRange(1, 6);
      const rollSum = die1 + die2;
      const isDoubles = die1 === die2;

      events.push({
        type: 'DICE_ROLLED',
        playerId,
        payload: { die1, die2, total: rollSum, isDoubles }
      });

      const updatedPositions = { ...currentState.gameSpecificState.positions };
      const updatedCash = { ...currentState.gameSpecificState.cash };
      const updatedInJail = { ...currentState.gameSpecificState.inJail };
      const updatedJailTurns = { ...currentState.gameSpecificState.jailTurns };
      let doubleRollCount = currentState.gameSpecificState.doubleRollCount;

      let nextSubState = 'WAITING_FOR_TURN_END';

      let tempState: MonopolyState = {
        ...currentState,
        rngState: rng.getState().toString(),
        gameSpecificState: {
          ...currentState.gameSpecificState,
          positions: updatedPositions,
          cash: updatedCash,
          inJail: updatedInJail,
          jailTurns: updatedJailTurns,
          doubleRollCount,
          lastRoll: [die1, die2]
        }
      };

      if (isPlayerInJail) {
        if (isDoubles) {
          updatedInJail[playerId] = false;
          updatedJailTurns[playerId] = 0;
          events.push({ type: 'JAIL_RELEASED', playerId, payload: { reason: 'Doubles rolled' } });

          // Move player
          const oldPos = updatedPositions[playerId];
          const newPos = (oldPos + rollSum) % MONOPOLY_BOARD.length;
          updatedPositions[playerId] = newPos;

          events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: newPos } });
          tempState = this.resolveSpaceLanding(tempState, playerId, newPos, rollSum, rng, events);
        } else {
          updatedJailTurns[playerId]++;
          if (updatedJailTurns[playerId] === 3) {
            // Must pay fine and leave
            events.push({ type: 'JAIL_FORCED_PAYMENT', playerId, payload: { amount: 50 } });
            updatedCash[playerId] -= 50;
            updatedInJail[playerId] = false;
            updatedJailTurns[playerId] = 0;

            const oldPos = updatedPositions[playerId];
            const newPos = (oldPos + rollSum) % MONOPOLY_BOARD.length;
            updatedPositions[playerId] = newPos;

            events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: newPos } });

            handleNegativeCash(tempState, playerId, 50, 'bank');
            tempState = this.resolveSpaceLanding(tempState, playerId, newPos, rollSum, rng, events);
          } else {
            events.push({ type: 'JAIL_STAY', playerId, payload: { turns: updatedJailTurns[playerId] } });
            nextSubState = 'WAITING_FOR_TURN_END';
            tempState.subState = nextSubState;
          }
        }
      } else {
        // Normal roll
        if (isDoubles) {
          doubleRollCount++;
          tempState.gameSpecificState.doubleRollCount = doubleRollCount;

          if (doubleRollCount === 3) {
            // Go directly to jail
            updatedInJail[playerId] = true;
            updatedPositions[playerId] = MONOPOLY_BOARD.findIndex(s => s.type === 'jail');
            tempState.gameSpecificState.doubleRollCount = 0;
            nextSubState = 'WAITING_FOR_TURN_END';
            tempState.subState = nextSubState;
            events.push({ type: 'SENT_TO_JAIL', playerId, payload: { reason: 'Three consecutive doubles' } });
          } else {
            // Move player
            const oldPos = updatedPositions[playerId];
            const newPos = (oldPos + rollSum) % MONOPOLY_BOARD.length;
            updatedPositions[playerId] = newPos;

            if (newPos === 0) {
              updatedCash[playerId] += 300;
              events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 300, landed: true } });
            } else if (newPos < oldPos) {
              updatedCash[playerId] += 200;
              events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 200 } });
            }

            events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: newPos } });
            tempState = this.resolveSpaceLanding(tempState, playerId, newPos, rollSum, rng, events);
          }
        } else {
          // Normal move
          tempState.gameSpecificState.doubleRollCount = 0;
          const oldPos = updatedPositions[playerId];
          const newPos = (oldPos + rollSum) % MONOPOLY_BOARD.length;
          updatedPositions[playerId] = newPos;

          if (newPos === 0) {
            updatedCash[playerId] += 300;
            events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 300, landed: true } });
          } else if (newPos < oldPos) {
            updatedCash[playerId] += 200;
            events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 200 } });
          }

          events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: newPos } });
          tempState = this.resolveSpaceLanding(tempState, playerId, newPos, rollSum, rng, events);
        }
      }

      tempState.rngState = rng.getState().toString();
      return { isValid: true, newState: tempState, events };
    }

    if (type === 'BUY_PROPERTY') {
      if (currentState.subState !== 'WAITING_FOR_BUY_OR_PASS') {
        return { isValid: false, error: 'Cannot buy property right now.', events: [] };
      }

      const position = currentState.gameSpecificState.positions[playerId];
      const space = MONOPOLY_BOARD[position];
      const propState = currentState.gameSpecificState.properties[position];

      if (!propState || propState.ownerId !== null) {
        return { isValid: false, error: 'Property is not available for purchase.', events: [] };
      }

      const price = space.price || 0;
      if (currentState.gameSpecificState.cash[playerId] < price) {
        return { isValid: false, error: 'Not enough cash to buy property.', events: [] };
      }

      const updatedProperties = { ...currentState.gameSpecificState.properties };
      updatedProperties[position] = { ...propState, ownerId: playerId };

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] -= price;

      events.push({
        type: 'PROPERTY_BOUGHT',
        playerId,
        payload: { spaceIndex: position, price }
      });

      const nextState: MonopolyState = {
        ...currentState,
        subState: 'WAITING_FOR_TURN_END',
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'PAY_JAIL_FINE') {
      const isPlayerInJail = currentState.gameSpecificState.inJail[playerId];
      if (!isPlayerInJail || currentState.subState !== 'WAITING_FOR_JAIL_DECISION') {
        return { isValid: false, error: 'Cannot pay jail fine right now.', events: [] };
      }

      if (currentState.gameSpecificState.cash[playerId] < 50) {
        return { isValid: false, error: 'Not enough cash to pay jail fine.', events: [] };
      }

      const updatedCash = { ...currentState.gameSpecificState.cash };
      updatedCash[playerId] -= 50;

      const config = currentState.gameSpecificState.config || {};
      let nextVacationPool = currentState.gameSpecificState.vacationCashPool || 0;
      if (config.vacationCash) {
        nextVacationPool += 50;
      }

      const updatedInJail = { ...currentState.gameSpecificState.inJail };
      updatedInJail[playerId] = false;

      const updatedJailTurns = { ...currentState.gameSpecificState.jailTurns };
      updatedJailTurns[playerId] = 0;

      events.push({
        type: 'JAIL_RELEASED',
        playerId,
        payload: { reason: 'Fine paid', cost: 50 }
      });

      const nextState: MonopolyState = {
        ...currentState,
        subState: 'WAITING_FOR_ROLL',
        gameSpecificState: {
          ...currentState.gameSpecificState,
          cash: updatedCash,
          vacationCashPool: nextVacationPool,
          inJail: updatedInJail,
          jailTurns: updatedJailTurns
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'DECLARE_BANKRUPTCY') {
      if (currentState.subState !== 'DEBT_OR_BANKRUPT') {
        return { isValid: false, error: 'You are not in debt/bankruptcy state.', events: [] };
      }

      const creditor = currentState.gameSpecificState.debtOwedTo;
      const updatedBankrupt = { ...currentState.gameSpecificState.bankrupt, [playerId]: true };
      const updatedProperties = { ...currentState.gameSpecificState.properties };
      const updatedCash = { ...currentState.gameSpecificState.cash };

      events.push({
        type: 'BANKRUPTCY_DECLARED',
        playerId,
        payload: { creditor }
      });

      if (creditor && creditor !== 'bank') {
        // Transfer all properties and remaining cash to creditor
        let totalRefund = 0;
        Object.entries(updatedProperties).forEach(([idx, p]) => {
          const spaceIdx = parseInt(idx, 10);
          const space = MONOPOLY_BOARD[spaceIdx];
          if (p.ownerId === playerId) {
            // Sell houses for half refund to creditor
            if (p.houses > 0) {
              totalRefund += p.houses * Math.floor((space.houseCost || 0) / 2);
            }
            updatedProperties[spaceIdx] = { ownerId: creditor, mortgaged: p.mortgaged, houses: 0 };
          }
        });

        // Transfer final assets and adjust creditor's cash (adding debtor's remaining cash balance, which is negative, to deduct the shortfall from rent payment)
        updatedCash[creditor] += totalRefund + updatedCash[playerId];
        updatedCash[playerId] = 0;

        events.push({
          type: 'ASSETS_TRANSFERRED',
          playerId: creditor,
          payload: { from: playerId, cashTransferred: totalRefund }
        });
      } else {
        // Return properties to bank
        Object.entries(updatedProperties).forEach(([idx, p]) => {
          const spaceIdx = parseInt(idx, 10);
          if (p.ownerId === playerId) {
            updatedProperties[spaceIdx] = { ownerId: null, mortgaged: false, houses: 0 };
          }
        });
        updatedCash[playerId] = 0;
      }

      // Check if only 1 active player remains
      const activePlayers = currentState.turnOrder.filter(pid => !updatedBankrupt[pid]);

      if (activePlayers.length === 1) {
        // Handled via winnerId in post-process, but we update status
        const nextState: MonopolyState = {
          ...currentState,
          winnerId: activePlayers[0],
          status: 'GAME_OVER',
          gameSpecificState: {
            ...currentState.gameSpecificState,
            properties: updatedProperties,
            cash: updatedCash,
            bankrupt: updatedBankrupt,
            debtOwedTo: null,
            debtAmount: 0
          }
        };
        return { isValid: true, newState: nextState, events };
      }

      // Advance turn to next active player
      let nextTurnIndex = currentState.turnIndex;
      do {
        nextTurnIndex = (nextTurnIndex + 1) % currentState.turnOrder.length;
      } while (updatedBankrupt[currentState.turnOrder[nextTurnIndex]]);

      const nextPlayerId = currentState.turnOrder[nextTurnIndex];
      const nextSubState = currentState.gameSpecificState.inJail[nextPlayerId] ? 'WAITING_FOR_JAIL_DECISION' : 'WAITING_FOR_ROLL';

      const nextState: MonopolyState = {
        ...currentState,
        activePlayerId: nextPlayerId,
        turnIndex: nextTurnIndex,
        subState: nextSubState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          properties: updatedProperties,
          cash: updatedCash,
          bankrupt: updatedBankrupt,
          doubleRollCount: 0,
          debtOwedTo: null,
          debtAmount: 0
        }
      };

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'BID') {
      if (currentState.subState !== 'AUCTION') {
        return { isValid: false, error: 'No auction is currently active.', events: [] };
      }

      const auctionSpaceIndex = currentState.gameSpecificState.auctionSpaceIndex!;
      const auctionCurrentBid = currentState.gameSpecificState.auctionCurrentBid ?? 0;
      const auctionBidders = currentState.gameSpecificState.auctionBidders || [];
      const auctionActiveBidderIndex = currentState.gameSpecificState.auctionActiveBidderIndex ?? 0;
      const activeBidderId = auctionBidders[auctionActiveBidderIndex];

      if (playerId !== activeBidderId) {
        return { isValid: false, error: 'It is not your turn to bid.', events: [] };
      }

      const amount = payload.amount;
      if (typeof amount !== 'number' || amount <= auctionCurrentBid) {
        return { isValid: false, error: `Bid must be greater than the current bid of $${auctionCurrentBid}.`, events: [] };
      }

      const playerCash = currentState.gameSpecificState.cash[playerId] || 0;
      if (playerCash < amount) {
        return { isValid: false, error: 'You do not have enough cash to place this bid.', events: [] };
      }

      // Valid bid! Update current bid and highest bidder, advance bidder index
      const nextActiveBidderIndex = (auctionActiveBidderIndex + 1) % auctionBidders.length;

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          auctionCurrentBid: amount,
          auctionHighestBidderId: playerId,
          auctionActiveBidderIndex: nextActiveBidderIndex
        }
      };

      events.push({
        type: 'AUCTION_BID',
        playerId,
        payload: { amount, nextBidderId: auctionBidders[nextActiveBidderIndex] || '' }
      });

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'FOLD') {
      if (currentState.subState !== 'AUCTION') {
        return { isValid: false, error: 'No auction is currently active.', events: [] };
      }

      const auctionSpaceIndex = currentState.gameSpecificState.auctionSpaceIndex!;
      const auctionCurrentBid = currentState.gameSpecificState.auctionCurrentBid ?? 0;
      const auctionHighestBidderId = currentState.gameSpecificState.auctionHighestBidderId ?? null;
      const auctionBidders = currentState.gameSpecificState.auctionBidders || [];
      const auctionActiveBidderIndex = currentState.gameSpecificState.auctionActiveBidderIndex ?? 0;
      const auctionOriginPlayerId = currentState.gameSpecificState.auctionOriginPlayerId!;
      const activeBidderId = auctionBidders[auctionActiveBidderIndex];

      if (playerId !== activeBidderId) {
        return { isValid: false, error: 'It is not your turn to bid/fold.', events: [] };
      }

      // Remove this bidder from the auction
      const nextBidders = auctionBidders.filter((id: string) => id !== playerId);
      events.push({ type: 'AUCTION_FOLDED', playerId, payload: {} });

      // Check if auction is resolved
      if (nextBidders.length === 0 || (nextBidders.length === 1 && auctionHighestBidderId !== null)) {
        // Auction is resolved!
        const winnerId = nextBidders[0] || auctionHighestBidderId;
        const finalBid = auctionCurrentBid;

        const updatedProperties = { ...currentState.gameSpecificState.properties };
        const updatedCash = { ...currentState.gameSpecificState.cash };

        if (winnerId && finalBid > 0) {
          updatedProperties[auctionSpaceIndex] = { ownerId: winnerId, mortgaged: false, houses: 0 };
          updatedCash[winnerId] -= finalBid;

          events.push({
            type: 'PROPERTY_BOUGHT',
            playerId: winnerId,
            payload: { spaceIndex: auctionSpaceIndex, price: finalBid }
          });
          events.push({
            type: 'AUCTION_RESOLVED',
            playerId: winnerId,
            payload: { spaceIndex: auctionSpaceIndex, price: finalBid }
          });
        } else {
          events.push({
            type: 'AUCTION_CANCELLED',
            payload: { spaceIndex: auctionSpaceIndex }
          });
        }

        // Return to standard WAITING_FOR_TURN_END for the original active player
        const nextState: MonopolyState = {
          ...currentState,
          subState: 'WAITING_FOR_TURN_END',
          activePlayerId: auctionOriginPlayerId,
          gameSpecificState: {
            ...currentState.gameSpecificState,
            properties: updatedProperties,
            cash: updatedCash,
            auctionSpaceIndex: undefined,
            auctionCurrentBid: undefined,
            auctionHighestBidderId: undefined,
            auctionActiveBidderIndex: undefined,
            auctionBidders: undefined,
            auctionOriginPlayerId: undefined
          }
        };

        return { isValid: true, newState: nextState, events };
      }

      // Auction is not resolved yet. Update active bidder index
      const nextActiveBidderIndex = auctionActiveBidderIndex % nextBidders.length;

      const nextState: MonopolyState = {
        ...currentState,
        gameSpecificState: {
          ...currentState.gameSpecificState,
          auctionBidders: nextBidders,
          auctionActiveBidderIndex: nextActiveBidderIndex
        }
      };

      events.push({
        type: 'AUCTION_NEXT_BIDDER',
        payload: { nextBidderId: nextBidders[nextActiveBidderIndex] || '' }
      });

      return { isValid: true, newState: nextState, events };
    }

    if (type === 'END_TURN') {
      const isPlayerInJail = currentState.gameSpecificState.inJail[playerId];

      if (currentState.subState === 'WAITING_FOR_BUY_OR_PASS') {
        // Acts as passing the property
        events.push({ type: 'PROPERTY_PASSED', playerId, payload: { spaceIndex: currentState.gameSpecificState.positions[playerId] } });
        
        const config = currentState.gameSpecificState.config || {};
        if (config.auction) {
          const position = currentState.gameSpecificState.positions[playerId];
          const activeBidders = currentState.turnOrder.filter(id => !currentState.gameSpecificState.bankrupt[id]);
          if (activeBidders.length > 0) {
            const nextState: MonopolyState = {
              ...currentState,
              subState: 'AUCTION',
              gameSpecificState: {
                ...currentState.gameSpecificState,
                auctionSpaceIndex: position,
                auctionCurrentBid: 0,
                auctionHighestBidderId: null,
                auctionActiveBidderIndex: 0,
                auctionBidders: activeBidders,
                auctionOriginPlayerId: playerId
              }
            };
            events.push({ type: 'AUCTION_STARTED', payload: { spaceIndex: position, bidders: activeBidders } });
            return { isValid: true, newState: nextState, events };
          }
        }

        const nextState = { ...currentState, subState: 'WAITING_FOR_TURN_END' };
        return { isValid: true, newState: nextState as MonopolyState, events };
      }

      if (currentState.subState !== 'WAITING_FOR_TURN_END') {
        return { isValid: false, error: 'Cannot end turn right now.', events: [] };
      }

      if (currentState.gameSpecificState.cash[playerId] < 0) {
        return { isValid: false, error: 'Must resolve negative cash before ending turn.', events: [] };
      }

      // Check if doubles roll grants extra turn (and player is not in jail)
      const lastRoll = currentState.gameSpecificState.lastRoll;
      const isDoubles = lastRoll[0] === lastRoll[1];

      if (isDoubles && !isPlayerInJail && currentState.gameSpecificState.doubleRollCount > 0) {
        events.push({ type: 'EXTRA_ROLL_DUE_TO_DOUBLES', playerId, payload: {} });
        const nextState: MonopolyState = {
          ...currentState,
          subState: 'WAITING_FOR_ROLL'
        };
        return { isValid: true, newState: nextState, events };
      } else {
        // Pass turn
        let nextTurnIndex = currentState.turnIndex;
        do {
          nextTurnIndex = (nextTurnIndex + 1) % currentState.turnOrder.length;
        } while (currentState.gameSpecificState.bankrupt[currentState.turnOrder[nextTurnIndex]]);

        const nextPlayerId = currentState.turnOrder[nextTurnIndex];
        let nextInJail = currentState.gameSpecificState.inJail[nextPlayerId];
        let nextJailTurns = currentState.gameSpecificState.jailTurns[nextPlayerId];
        let nextJailCards = currentState.gameSpecificState.jailCards[nextPlayerId] || 0;

        if (nextInJail && nextJailCards > 0) {
          nextInJail = false;
          nextJailTurns = 0;
          nextJailCards--;
          events.push({ type: 'JAIL_RELEASED', playerId: nextPlayerId, payload: { reason: 'Pardon card used' } });
        }

        const nextSubState = nextInJail ? 'WAITING_FOR_JAIL_DECISION' : 'WAITING_FOR_ROLL';

        const updatedInJail = { ...currentState.gameSpecificState.inJail, [nextPlayerId]: nextInJail };
        const updatedJailTurns = { ...currentState.gameSpecificState.jailTurns, [nextPlayerId]: nextJailTurns };
        const updatedJailCards = { ...currentState.gameSpecificState.jailCards, [nextPlayerId]: nextJailCards };

        const nextState: MonopolyState = {
          ...currentState,
          activePlayerId: nextPlayerId,
          turnIndex: nextTurnIndex,
          subState: nextSubState,
          gameSpecificState: {
            ...currentState.gameSpecificState,
            inJail: updatedInJail,
            jailTurns: updatedJailTurns,
            jailCards: updatedJailCards,
            doubleRollCount: 0,
            lastRoll: [0, 0]
          }
        };

        return { isValid: true, newState: nextState, events };
      }
    }

    return { isValid: false, error: 'Unknown action type.', events: [] };
  }

  public getPlayerState(currentState: MonopolyState, playerId: string): Record<string, any> {
    return currentState; // Monopoly has open state
  }

  public checkWinConditions(currentState: MonopolyState): string | null {
    const bankrupt = currentState.gameSpecificState.bankrupt;
    const activePlayers = currentState.turnOrder.filter(pid => !bankrupt[pid]);
    if (currentState.players.length > 1 && activePlayers.length === 1) {
      return activePlayers[0];
    }
    return null;
  }

  private resolveCardAction(state: MonopolyState, playerId: string, card: any, rng: DeterministicRNG, events: GameEvent[]): MonopolyState {
    const cash = { ...state.gameSpecificState.cash };
    const positions = { ...state.gameSpecificState.positions };
    const inJail = { ...state.gameSpecificState.inJail };
    const jailCards = { ...state.gameSpecificState.jailCards };

    events.push({ type: 'CHANCE_CARD', playerId, payload: { text: card.text } });

    switch (card.action.type) {
      case 'move-to-block': {
        const oldPos = positions[playerId];
        const targetPos = card.action.blockIndex;
        positions[playerId] = targetPos;
        events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: targetPos } });
        
        if (card.action.collectGo) {
          if (targetPos === 0) {
            cash[playerId] += 300;
            events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 300, landed: true } });
          } else if (targetPos < oldPos) {
            cash[playerId] += 200;
            events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 200 } });
          }
        }
        
        state.gameSpecificState.positions = positions;
        state.gameSpecificState.cash = cash;
        
        state = this.resolveSpaceLanding(state, playerId, targetPos, 0, rng, events);
        break;
      }
      case 'money-event': {
        const amount = card.action.amount;
        if (card.action.moneyType === 'earn') {
          cash[playerId] += amount;
          events.push({ type: 'MONEY_EARNED', playerId, payload: { amount } });
        } else {
          cash[playerId] -= amount;
          events.push({ type: 'TAX_PAID', playerId, payload: { name: 'Card Fine', fine: amount } });
          if (cash[playerId] < 0) {
            state.subState = 'DEBT_OR_BANKRUPT';
            state.gameSpecificState.debtOwedTo = 'bank';
            state.gameSpecificState.debtAmount = amount;
          }
        }
        state.gameSpecificState.cash = cash;
        if (state.subState !== 'DEBT_OR_BANKRUPT') {
          state.subState = 'WAITING_FOR_TURN_END';
        }
        break;
      }
      case 'go-to-prison': {
        const oldPos = positions[playerId];
        const prisonIdx = MONOPOLY_BOARD.findIndex(s => s.type === 'jail');
        inJail[playerId] = true;
        positions[playerId] = prisonIdx >= 0 ? prisonIdx : 12;
        state.gameSpecificState.doubleRollCount = 0;
        events.push({ type: 'SENT_TO_JAIL', playerId, payload: { reason: 'Card directive' } });
        events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: positions[playerId] } });
        
        state.gameSpecificState.inJail = inJail;
        state.gameSpecificState.positions = positions;
        state.subState = 'WAITING_FOR_TURN_END';
        break;
      }
      case 'collect-from-each-player': {
        const amount = card.action.amount;
        let totalCollected = 0;
        state.players.forEach(p => {
          if (p.id !== playerId && !state.gameSpecificState.bankrupt[p.id]) {
            cash[p.id] -= amount;
            totalCollected += amount;
            events.push({ type: 'TAX_PAID', playerId: p.id, payload: { name: 'Party Fee', fine: amount } });
          }
        });
        cash[playerId] += totalCollected;
        state.gameSpecificState.cash = cash;
        state.subState = 'WAITING_FOR_TURN_END';
        break;
      }
      case 'pay-each-player': {
        const amount = card.action.amount;
        let totalPaid = 0;
        state.players.forEach(p => {
          if (p.id !== playerId && !state.gameSpecificState.bankrupt[p.id]) {
            cash[p.id] += amount;
            totalPaid += amount;
          }
        });
        cash[playerId] -= totalPaid;
        state.gameSpecificState.cash = cash;
        if (cash[playerId] < 0) {
          state.subState = 'DEBT_OR_BANKRUPT';
          state.gameSpecificState.debtOwedTo = 'bank';
          state.gameSpecificState.debtAmount = totalPaid;
        } else {
          state.subState = 'WAITING_FOR_TURN_END';
        }
        break;
      }
      case 'repairs': {
        const perHouse = card.action.perHouse;
        const perHotel = card.action.perHotel;
        let housesCount = 0;
        let hotelsCount = 0;
        
        Object.entries(state.gameSpecificState.properties).forEach(([idx, prop]) => {
          if (prop.ownerId === playerId && !prop.mortgaged) {
            if (prop.houses === 5) {
              hotelsCount++;
            } else {
              housesCount += prop.houses;
            }
          }
        });
        
        const totalCost = (housesCount * perHouse) + (hotelsCount * perHotel);
        cash[playerId] -= totalCost;
        events.push({ type: 'TAX_PAID', playerId, payload: { name: 'Property Repairs', fine: totalCost } });
        
        state.gameSpecificState.cash = cash;
        if (cash[playerId] < 0) {
          state.subState = 'DEBT_OR_BANKRUPT';
          state.gameSpecificState.debtOwedTo = 'bank';
          state.gameSpecificState.debtAmount = totalCost;
        } else {
          state.subState = 'WAITING_FOR_TURN_END';
        }
        break;
      }
      case 'get-pardon-card': {
        jailCards[playerId] = (jailCards[playerId] || 0) + 1;
        state.gameSpecificState.jailCards = jailCards;
        state.subState = 'WAITING_FOR_TURN_END';
        break;
      }
      case 'move-steps': {
        const oldPos = positions[playerId];
        const steps = card.action.steps;
        const boardLen = MONOPOLY_BOARD.length;
        const targetPos = (oldPos + steps + boardLen) % boardLen;
        positions[playerId] = targetPos;
        events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: targetPos } });
        
        state.gameSpecificState.positions = positions;
        state = this.resolveSpaceLanding(state, playerId, targetPos, 0, rng, events);
        break;
      }
      case 'move-to-next-grouped': {
        const oldPos = positions[playerId];
        const group = card.action.group;
        const boardLen = MONOPOLY_BOARD.length;
        let targetPos = oldPos;
        
        for (let i = 1; i <= boardLen; i++) {
          const checkPos = (oldPos + i) % boardLen;
          const s = MONOPOLY_BOARD[checkPos];
          if (group === 'company' && s.type === 'utility') {
            targetPos = checkPos;
            break;
          }
          if (group === 'airport' && s.type === 'railroad') {
            targetPos = checkPos;
            break;
          }
        }
        
        positions[playerId] = targetPos;
        events.push({ type: 'PLAYER_MOVED', playerId, payload: { from: oldPos, to: targetPos } });
        
        if (targetPos < oldPos) {
          cash[playerId] += 200;
          events.push({ type: 'PASSED_GO', playerId, payload: { bonus: 200 } });
        }
        
        state.gameSpecificState.positions = positions;
        state.gameSpecificState.cash = cash;
        state = this.resolveSpaceLanding(state, playerId, targetPos, 0, rng, events);
        break;
      }
      default:
        state.subState = 'WAITING_FOR_TURN_END';
        break;
    }
    
    return state;
  }

  private resolveSpaceLanding(state: MonopolyState, playerId: string, position: number, rollSum: number, rng: DeterministicRNG, events: GameEvent[]): MonopolyState {
    const space = MONOPOLY_BOARD[position];
    const properties = { ...state.gameSpecificState.properties };
    const cash = { ...state.gameSpecificState.cash };

    if (space.type === 'go_to_jail') {
      state.gameSpecificState.inJail[playerId] = true;
      state.gameSpecificState.positions[playerId] = MONOPOLY_BOARD.findIndex(s => s.type === 'jail');
      state.gameSpecificState.doubleRollCount = 0;
      state.subState = 'WAITING_FOR_TURN_END';
      events.push({ type: 'SENT_TO_JAIL', playerId, payload: { reason: 'Landed on Go To Jail' } });
      return state;
    }

    if (space.type === 'tax') {
      let fine = space.price || 0;
      if (space.name === 'Earnings Tax') {
        fine = Math.max(0, Math.floor(cash[playerId] * 0.1));
      }
      cash[playerId] -= fine;

      const config = state.gameSpecificState.config || {};
      let nextVacationPool = state.gameSpecificState.vacationCashPool || 0;
      if (config.vacationCash) {
        nextVacationPool += fine;
        events.push({ type: 'TAX_PAID', playerId, payload: { name: space.name, fine, addedToVacationPool: true } });
      } else {
        events.push({ type: 'TAX_PAID', playerId, payload: { name: space.name, fine } });
      }

      state.gameSpecificState.cash = cash;
      state.gameSpecificState.vacationCashPool = nextVacationPool;
      if (cash[playerId] < 0) {
        state.subState = 'DEBT_OR_BANKRUPT';
        state.gameSpecificState.debtOwedTo = 'bank';
        state.gameSpecificState.debtAmount = fine;
      } else {
        state.subState = 'WAITING_FOR_TURN_END';
      }
      return state;
    }

    if (space.type === 'chance' || space.type === 'community_chest') {
      const isChance = space.type === 'chance';
      const deck = isChance ? SURPRISE_DECK : TREASURE_DECK;
      const cardIdx = rng.rollRange(0, deck.length - 1);
      const card = deck[cardIdx];
      state = this.resolveCardAction(state, playerId, card, rng, events);
      return state;
    }

    if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
      const propState = properties[position];
      if (propState.ownerId === null) {
        state.subState = 'WAITING_FOR_BUY_OR_PASS';
      } else if (propState.ownerId !== playerId) {
        // Pay rent
        if (propState.mortgaged) {
          events.push({ type: 'RENT_SKIPPED', playerId, payload: { spaceIndex: position, reason: 'Property is mortgaged' } });
          state.subState = 'WAITING_FOR_TURN_END';
          return state;
        }

        const owner = propState.ownerId;
        const config = state.gameSpecificState.config || {};
        if (config.prisonRent && state.gameSpecificState.inJail[owner]) {
          events.push({ type: 'RENT_SKIPPED', playerId, payload: { spaceIndex: position, reason: 'Owner is in jail' } });
          state.subState = 'WAITING_FOR_TURN_END';
          return state;
        }

        let rentOwed = 0;

        if (space.type === 'property') {
          if (propState.houses > 0) {
            rentOwed = space.rent ? space.rent[propState.houses] : 0;
          } else {
            // Double rent check
            const groupSpaces = MONOPOLY_BOARD.filter(s => s.group === space.group);
            const ownsAll = groupSpaces.every(s => {
              const idx = MONOPOLY_BOARD.indexOf(s);
              return state.gameSpecificState.properties[idx].ownerId === owner;
            });
            const baseRent = space.rent ? space.rent[0] : 0;
            const doubleRentRule = config.doubleRentRule !== undefined ? config.doubleRentRule : true;
            rentOwed = (ownsAll && doubleRentRule) ? baseRent * 2 : baseRent;
          }
        } else if (space.type === 'railroad') {
          // Count railroads owned by owner
          const rrIndices = MONOPOLY_BOARD.map((s, idx) => s.type === 'railroad' ? idx : -1).filter(idx => idx !== -1);
          const count = rrIndices.filter(idx => properties[idx].ownerId === owner).length;
          rentOwed = count > 0 ? 25 * Math.pow(2, count - 1) : 0; // 1->25, 2->50, 3->100, 4->200
        } else if (space.type === 'utility') {
          const utilIndices = MONOPOLY_BOARD.map((s, idx) => s.type === 'utility' ? idx : -1).filter(idx => idx !== -1);
          const count = utilIndices.filter(idx => properties[idx].ownerId === owner).length;
          const multipliers = [4, 10, 20];
          const mult = multipliers[Math.min(count, 3) - 1] || 4;
          rentOwed = mult * rollSum;
        }

        cash[playerId] -= rentOwed;
        cash[owner] += rentOwed;

        events.push({
          type: 'RENT_PAID',
          playerId,
          payload: { spaceIndex: position, recipient: owner, rent: rentOwed }
        });

        state.gameSpecificState.cash = cash;

        if (cash[playerId] < 0) {
          state.subState = 'DEBT_OR_BANKRUPT';
          state.gameSpecificState.debtOwedTo = owner;
          state.gameSpecificState.debtAmount = rentOwed;
        } else {
          state.subState = 'WAITING_FOR_TURN_END';
        }
      } else {
        // Landed on own property
        state.subState = 'WAITING_FOR_TURN_END';
      }
      return state;
    }

    if (position === 20) {
      const config = state.gameSpecificState.config || {};
      if (config.vacationCash && state.gameSpecificState.vacationCashPool > 0) {
        const poolAmount = state.gameSpecificState.vacationCashPool;
        cash[playerId] += poolAmount;
        state.gameSpecificState.vacationCashPool = 0;
        state.gameSpecificState.cash = cash;
        events.push({ type: 'VACATION_POOL_EARNED', playerId, payload: { amount: poolAmount } });
      }
      state.subState = 'WAITING_FOR_TURN_END';
      return state;
    }

    state.subState = 'WAITING_FOR_TURN_END';
    return state;
  }
}
