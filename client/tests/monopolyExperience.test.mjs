import assert from 'node:assert/strict';
import test from 'node:test';
import { groupPortfolio, buildingBlockReason } from '../src/features/games/monopoly/portfolio.ts';
import { formatMonopolyAnnouncement } from '../src/features/games/monopoly/announcements.ts';

const board = [
  { name: 'START', type: 'go' },
  { name: 'Tel Aviv', type: 'property', group: 'israel', houseCost: 50 },
  { name: 'TLV Airport', type: 'railroad' },
  { name: 'Haifa', type: 'property', group: 'israel', houseCost: 50 },
  { name: 'Jerusalem', type: 'property', group: 'israel', houseCost: 50 },
  { name: 'MUC Airport', type: 'railroad' }
];
const state = () => ({ activePlayerId: 'a', subState: 'WAITING_FOR_ROLL', gameSpecificState: {
  config: { evenBuild: true }, cash: { a: 500 }, properties: {
    1: { ownerId: 'a', houses: 0, mortgaged: false },
    2: { ownerId: 'a', houses: 0, mortgaged: false },
    3: { ownerId: 'a', houses: 0, mortgaged: false },
    4: { ownerId: 'b', houses: 0, mortgaged: false },
    5: { ownerId: null, houses: 0, mortgaged: false }
  }
} });

test('portfolio groups scattered streets and lists the missing member and airport progress', () => {
  const groups = groupPortfolio(board, state(), 'a');
  assert.deepEqual(groups.map(group => [group.label, group.owned, group.missing]), [
    ['Israel', [1, 3], [4]], ['Airports', [2], [5]]
  ]);
  assert.deepEqual(groupPortfolio(board, state(), 'spectator'), []);
});

test('building waits for the complete unmortgaged set and obeys even building', () => {
  const game = state();
  assert.match(buildingBlockReason(board, game, 'a', 1), /Complete/);
  game.gameSpecificState.properties[4].ownerId = 'a';
  assert.equal(buildingBlockReason(board, game, 'a', 1), undefined);
  game.gameSpecificState.properties[3].mortgaged = true;
  assert.match(buildingBlockReason(board, game, 'a', 1), /Unmortgage/);
  game.gameSpecificState.properties[3].mortgaged = false;
  game.gameSpecificState.properties[1].houses = 1;
  assert.match(buildingBlockReason(board, game, 'a', 1), /evenly/);
  game.activePlayerId = 'b';
  assert.match(buildingBlockReason(board, game, 'a', 3), /your turn/);
});

test('board announcements identify both traders, assets, cash, and hotel builds', () => {
  const name = id => ({ a: 'Alpha', b: 'Beta' }[id] ?? 'A player');
  const trade = { type: 'TRADE_ACCEPTED', playerId: 'b', payload: { proposerId: 'a', receiverId: 'b',
    offer: { cash: 100, properties: [1] }, request: { cash: 0, properties: [4] } } };
  assert.equal(formatMonopolyAnnouncement(trade, board, name), 'Alpha traded with Beta: Tel Aviv + $100 ↔ Jerusalem.');
  assert.equal(formatMonopolyAnnouncement({ ...trade, type: 'TRADE_INITIATED', playerId: 'a', payload: { targetPlayerId: 'b', offer: trade.payload.offer, request: trade.payload.request } }, board, name), 'Alpha offered Tel Aviv + $100 for Jerusalem with Beta.');
  assert.equal(formatMonopolyAnnouncement({ type: 'HOUSE_BUILT', playerId: 'a', payload: { spaceIndex: 3, housesCount: 5 } }, board, name), 'Alpha built a hotel on Haifa.');
  assert.equal(formatMonopolyAnnouncement({ type: 'DICE_ROLLED', payload: {} }, board, name), null);
});
