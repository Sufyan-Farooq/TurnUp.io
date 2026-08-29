// Shared types for the Monopoly feature slice.
// Mirrors the server contract in server/src/engine/monopoly.ts / interfaces.ts,
// plus the lightweight client-side Room/Player shapes used across App.tsx.

export interface MonopolyPlayer {
  id: string;
  name: string;
  connected?: boolean;
  ready?: boolean;
  color?: string;
  isBot?: boolean;
  avatarUrl?: string;
}

export interface MonopolyRoom {
  id: string;
  name?: string;
  hostId: string;
  status?: 'LOBBY' | 'PLAYING' | 'ENDED';
  gameType?: string;
  players: MonopolyPlayer[];
  lobbySettings?: Record<string, any>;
}

export interface PropertyState {
  ownerId: string | null;
  mortgaged: boolean;
  houses: number; // 0-5 (5 === hotel)
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

export interface MonopolyConfig {
  startingCash: number;
  doubleRentRule: boolean;
  vacationCash: boolean;
  auction: boolean;
  prisonRent: boolean;
  evenBuild: boolean;
  mortgage: boolean;
}

export interface MonopolyGameSpecificState {
  positions: Record<string, number>;
  cash: Record<string, number>;
  inJail: Record<string, boolean>;
  jailTurns: Record<string, number>;
  jailCards: Record<string, number>;
  bankrupt: Record<string, boolean>;
  properties: Record<number, PropertyState>;
  doubleRollCount: number;
  lastRoll: [number, number];
  debtOwedTo: string | null;
  debtAmount: number;
  vacationCashPool: number;
  auctionSpaceIndex?: number;
  auctionCurrentBid?: number;
  auctionHighestBidderId?: string | null;
  auctionActiveBidderIndex?: number;
  auctionBidders?: string[];
  auctionOriginPlayerId?: string;
  activeTrade?: TradeOffer;
  config: MonopolyConfig;
}

export interface MonopolyGameState {
  gameId?: string;
  gameType?: string;
  status?: string;
  activePlayerId: string;
  turnOrder: string[];
  turnIndex?: number;
  subState: string;
  winnerId: string | null;
  historyLength?: number;
  gameSpecificState: MonopolyGameSpecificState;
}

// Board space definition. Matches App.tsx's MONOPOLY_BOARD entries, which extend
// the server's MonopolySpace with a client-only `flag` image path.
export interface MonopolySpace {
  name: string;
  type: 'go' | 'property' | 'chance' | 'community_chest' | 'tax' | 'railroad' | 'utility' | 'jail' | 'go_to_jail' | 'free_parking';
  group?: string;
  price?: number;
  rent?: number[]; // [base, 1h, 2h, 3h, 4h, hotel]
  houseCost?: number;
  mortgageValue?: number;
  flag?: string;
}

export interface TradeSide {
  cash: number;
  properties: number[];
}

// Action callback contract shared by every Monopoly sub-component.
// No component may call `socket.emit` directly - all mutation goes through these.
export interface MonopolyActionHandlers {
  onRollDice: () => void;
  onBuyProperty: () => void;
  onEndTurn: () => void;
  onPayJailFine: () => void;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onSellProperty: (spaceIndex: number) => void;
  onBuildHouse: (spaceIndex: number) => void;
  onSellHouse: (spaceIndex: number) => void;
  onDeclareBankruptcy: () => void;
  onInitiateTrade: (targetPlayerId: string, offer: TradeSide, request: TradeSide) => void;
  onAcceptTrade: () => void;
  onRejectTrade: () => void;
  onBid: (amount: number) => void;
  onFold: () => void;
}
