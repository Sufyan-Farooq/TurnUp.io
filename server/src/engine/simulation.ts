import { LudoRuleset, LudoState } from './ludo';
import { UnoRuleset, UnoState, UnoCard } from './uno';
import { MonopolyRuleset, MonopolyState } from './monopoly';
import { GameAction, IPlayer, GameEngineManager, GameState } from './interfaces';
import { DeterministicRNG } from './rng';
import * as assert from 'assert';

// Mock utility to force roll values for test determinism
const originalRollRange = DeterministicRNG.prototype.rollRange;
let mockRollValue: number | null = null;

function mockRoll(value: number) {
  mockRollValue = value;
}

function clearMockRoll() {
  mockRollValue = null;
}

DeterministicRNG.prototype.rollRange = function (min: number, max: number): number {
  if (mockRollValue !== null) {
    return mockRollValue;
  }
  return originalRollRange.call(this, min, max);
};

// Logger helper
function logSection(title: string) {
  console.log(`\n========================================`);
  console.log(`Testing: ${title}`);
  console.log(`========================================`);
}

/**
 * ----------------------------------------------------
 * LUDO SIMULATION TESTS
 * ----------------------------------------------------
 */
function testLudo() {
  logSection('LUDO RULESET SIMULATION');

  const p1: IPlayer = { id: 'p1', name: 'Alice', isBot: false };
  const p2: IPlayer = { id: 'p2', name: 'Bob', isBot: false };
  const players = [p1, p2];

  const ruleset = new LudoRuleset();
  const manager = new GameEngineManager(ruleset);
  let state = manager.initGame(players, { gameId: 'ludo-test-room' }, 42) as LudoState;

  // Assert initial state
  assert.strictEqual(state.status, 'ACTIVE');
  assert.strictEqual(state.activePlayerId, 'p1');
  assert.strictEqual(state.subState, 'WAITING_FOR_ROLL');
  assert.deepStrictEqual(state.gameSpecificState.tokens['p1'], [-1, -1, -1, -1]);

  console.log('✓ Initialization successful.');

  // 1. Roll 6 and release a token from base to start cell (index 0)
  mockRoll(6);
  let action: GameAction = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  let result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  assert.strictEqual(state.subState, 'WAITING_FOR_TOKEN_MOVE');
  assert.strictEqual(state.gameSpecificState.lastRoll, 6);

  action = {
    type: 'MOVE_TOKEN',
    playerId: 'p1',
    payload: { tokenIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  // Player 1's index is 0, so start cell is 0 * 13 = 0
  assert.strictEqual(state.gameSpecificState.tokens['p1'][0], 0);
  assert.strictEqual(state.activePlayerId, 'p1'); // Extra turn because rolled 6
  assert.strictEqual(state.subState, 'WAITING_FOR_ROLL');
  console.log('✓ Roll 6 and release token to cell 0 works.');

  // 2. Move token forward
  mockRoll(4);
  action = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  
  action = {
    type: 'MOVE_TOKEN',
    playerId: 'p1',
    payload: { tokenIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  assert.strictEqual(state.gameSpecificState.tokens['p1'][0], 4);
  assert.strictEqual(state.activePlayerId, 'p2'); // Turn passes to Bob (p2) since roll wasn't 6
  console.log('✓ Token moves forward successfully.');

  // 3. Overshoot bounce-back at the home stretch
  // Home stretch positions are 52-56. 57 is home.
  // Set token 0 to 55, and token 1 to 10 (so p1 has at least one valid move with roll 4)
  state = manager.getCurrentState() as LudoState;
  state.gameSpecificState.tokens['p1'][0] = 55;
  state.gameSpecificState.tokens['p1'][1] = 10;
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  // Roll 4
  mockRoll(4);
  action = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  assert.strictEqual(state.subState, 'WAITING_FOR_TOKEN_MOVE');

  // Try to move token 0 (at 55). Should be invalid (overshoot).
  action = {
    type: 'MOVE_TOKEN',
    playerId: 'p1',
    payload: { tokenIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, false);
  console.log('✓ Overshoot at home stretch is correctly rejected.');

  // Complete the turn by moving token 1 (at 10)
  action = {
    type: 'MOVE_TOKEN',
    playerId: 'p1',
    payload: { tokenIndex: 1 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  assert.strictEqual(state.gameSpecificState.tokens['p1'][1], 14);

  // Now, test exact land on 57 (from 55) by rolling 2
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(2); // 55 + 2 = 57
  action = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  manager.handleIncomingAction(action);

  action = {
    type: 'MOVE_TOKEN',
    playerId: 'p1',
    payload: { tokenIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  assert.strictEqual(state.gameSpecificState.tokens['p1'][0], 57);
  console.log('✓ Landing exactly on Home (57) works.');

  // 4. Token Collision (Capture) on common track
  state = manager.getCurrentState() as LudoState;
  state.gameSpecificState.tokens['p1'][0] = 10;
  state.gameSpecificState.tokens['p2'][0] = 15;
  state.activePlayerId = 'p1';
  state.turnIndex = 0; // align turnIndex with p1
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(5); // Roll 5: p1 moves token 0 from 10 to 15 (lands on p2's token)
  action = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  manager.handleIncomingAction(action);

  action = {
    type: 'MOVE_TOKEN',
    playerId: 'p1',
    payload: { tokenIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  assert.strictEqual(state.gameSpecificState.tokens['p1'][0], 15);
  assert.strictEqual(state.gameSpecificState.tokens['p2'][0], -1); // Sent back to base
  assert.strictEqual(state.activePlayerId, 'p1'); // Extra turn because of capture
  
  // Verify token capture event was emitted
  const captureEvent = result.events.find(e => e.type === 'TOKEN_CAPTURED');
  assert.ok(captureEvent);
  assert.strictEqual(captureEvent.playerId, 'p2');
  console.log('✓ Token collision (capture, return to base, extra turn) works.');

  // 5. Consecutive 6 rolls (3 consecutive sixes forfeits the turn)
  state = manager.getCurrentState() as LudoState;
  state.activePlayerId = 'p1';
  state.turnIndex = 0; // align turnIndex with p1
  state.subState = 'WAITING_FOR_ROLL';
  state.gameSpecificState.consecutiveSixes = 2; // already rolled two 6s
  manager.setCurrentState(state);

  mockRoll(6); // third 6
  action = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as LudoState;
  
  // Turn should be forfeited, turn passed to p2, consecutiveSixes reset to 0
  assert.strictEqual(state.activePlayerId, 'p2');
  assert.strictEqual(state.gameSpecificState.consecutiveSixes, 0);
  assert.strictEqual(state.subState, 'WAITING_FOR_ROLL');
  
  const forfeitEvent = result.events.find(e => e.type === 'TURN_FORFEITED');
  assert.ok(forfeitEvent);
  console.log('✓ Three consecutive sixes forfeits the turn.');
}

/**
 * ----------------------------------------------------
 * UNO SIMULATION TESTS
 * ----------------------------------------------------
 */
function testUno() {
  logSection('UNO RULESET SIMULATION');

  const p1: IPlayer = { id: 'p1', name: 'Alice', isBot: false };
  const p2: IPlayer = { id: 'p2', name: 'Bob', isBot: false };
  const p3: IPlayer = { id: 'p3', name: 'Charlie', isBot: false };
  const players = [p1, p2, p3];

  const ruleset = new UnoRuleset();
  const manager = new GameEngineManager(ruleset);
  let state = manager.initGame(players, { gameId: 'uno-test-room' }, 123) as UnoState;

  // 1. Hands distribution
  assert.strictEqual(state.gameSpecificState.hands['p1'].length, 7);
  assert.strictEqual(state.gameSpecificState.hands['p2'].length, 7);
  assert.strictEqual(state.gameSpecificState.hands['p3'].length, 7);
  console.log('✓ Hands distribution (7 cards each) verified.');

  // 2. Play card matching top card (color, value, symbol)
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.currentCard = { color: 'red', value: '5' };
  state.gameSpecificState.hands['p1'] = [
    { color: 'red', value: '7' },
    { color: 'blue', value: '5' },
    { color: 'green', value: '9' }
  ];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  // Play matching color: Red 7
  let action: GameAction = {
    type: 'PLAY_CARD',
    playerId: 'p1',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  let result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.currentCard.value, '7');
  assert.strictEqual(state.gameSpecificState.currentColor, 'red');
  console.log('✓ Playing matching color card works.');

  // Play matching value: Blue 5 on Red 5 (reset top card first)
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.currentCard = { color: 'red', value: '5' };
  state.gameSpecificState.hands['p1'] = [
    { color: 'blue', value: '5' },
    { color: 'red', value: '9' }
  ];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'PLAY_CARD',
    playerId: 'p1',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.currentColor, 'blue');
  console.log('✓ Playing matching value card works.');

  // 3. Card actions (Skip, Reverse, Draw 2, Wild)
  // Skip: p1 plays red skip. p2 is skipped, p3 gets turn.
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.currentCard = { color: 'red', value: '2' };
  state.gameSpecificState.hands['p1'] = [{ color: 'red', value: 'skip' }, { color: 'red', value: '9' }];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.gameSpecificState.direction = 1;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'PLAY_CARD',
    playerId: 'p1',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.activePlayerId, 'p3'); // p2 skipped
  assert.ok(result.events.find(e => e.type === 'PLAYER_SKIPPED'));
  console.log('✓ Skip card skips the next player.');

  // Reverse: direction reverses. p3 plays reverse, direction becomes -1, next player is p2 (going backwards from 2)
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.currentCard = { color: 'red', value: 'skip' };
  state.gameSpecificState.hands['p3'] = [{ color: 'red', value: 'reverse' }, { color: 'red', value: '9' }];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p3';
  state.turnIndex = 2;
  state.gameSpecificState.direction = 1;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'PLAY_CARD',
    playerId: 'p3',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.direction, -1);
  assert.strictEqual(state.activePlayerId, 'p2');
  console.log('✓ Reverse card reverses player turn direction.');

  // Draw 2: p2 plays draw2. pendingDrawCount becomes 2. next player p1 must draw 2 and skip turn.
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.currentCard = { color: 'red', value: 'reverse' };
  state.gameSpecificState.hands['p2'] = [{ color: 'red', value: 'draw2' }, { color: 'red', value: '9' }];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p2';
  state.turnIndex = 1;
  state.gameSpecificState.direction = -1;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'PLAY_CARD',
    playerId: 'p2',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.pendingDrawCount, 2);
  assert.strictEqual(state.activePlayerId, 'p1'); // going backward from 1 (p2) is 0 (p1)

  // p1 draws cards (penalty)
  action = {
    type: 'DRAW_CARD',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  const sizeBefore = state.gameSpecificState.hands['p1'].length;
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.hands['p1'].length, sizeBefore + 2);
  assert.strictEqual(state.gameSpecificState.pendingDrawCount, 0);
  assert.strictEqual(state.activePlayerId, 'p3'); // p1 skipped, turn goes to p3
  console.log('✓ Draw 2 adds 2 cards to next player and skips their turn.');

  // Wild: play wild and choose blue color
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.hands['p3'] = [{ color: 'wild', value: 'wild' }, { color: 'red', value: '9' }];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p3';
  state.turnIndex = 2;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'PLAY_CARD',
    playerId: 'p3',
    payload: { cardIndex: 0, selectedColor: 'blue' },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.currentColor, 'blue');
  console.log('✓ Wild card changes current game color.');

  // 4. Drawing card and optionally playing it
  // Player draws a card. If playable, subState is PLAY_OR_PASS.
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.currentColor = 'blue';
  state.gameSpecificState.currentCard = { color: 'wild', value: 'wild' };
  state.gameSpecificState.hands['p1'] = [{ color: 'red', value: '9' }];
  state.gameSpecificState.deck = [{ color: 'blue', value: '3' }];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'DRAW_CARD',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.subState, 'PLAY_OR_PASS');

  // Play the drawn card (blue 3 at index 1)
  action = {
    type: 'PLAY_CARD',
    playerId: 'p1',
    payload: { cardIndex: 1 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.currentCard.value, '3');
  console.log('✓ Drawing playable card transitions to PLAY_OR_PASS and allows playing it.');

  // 5. Deck exhaustion / replenish
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.deck = [];
  state.gameSpecificState.discardPile = [
    { color: 'red', value: '1' },
    { color: 'blue', value: '2' },
    { color: 'green', value: '3' } // Top card
  ];
  state.gameSpecificState.currentCard = { color: 'green', value: '3' };
  state.gameSpecificState.hands['p1'] = [{ color: 'yellow', value: '9' }];
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_PLAY';
  manager.setCurrentState(state);

  action = {
    type: 'DRAW_CARD',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  // Discard pile had 3 cards. Top card (green 3) is preserved. Remaining 2 are shuffled and put to deck.
  // Player draws 1. So deck length should be 1. Discard pile has 1.
  assert.strictEqual(state.gameSpecificState.deck.length, 1);
  assert.strictEqual(state.gameSpecificState.discardPile.length, 1);
  assert.strictEqual(state.gameSpecificState.discardPile[0].value, '3');
  console.log('✓ Deck exhaustion replenishes and shuffles cards from discard pile.');

  // 6. Uno declaration and challenge checks
  // Setup safe Uno: Player calls DECLARE_UNO first, then plays to 1 card.
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.hands['p1'] = [
    { color: 'red', value: '5' },
    { color: 'blue', value: '5' }
  ];
  state.gameSpecificState.hands['p2'] = [{ color: 'red', value: '9' }]; // Bob has 1 card to avoid empty hand win trigger
  state.gameSpecificState.unoDeclared['p1'] = false;
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_PLAY';
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.deck = [
    { color: 'red', value: '1' },
    { color: 'red', value: '2' },
    { color: 'red', value: '3' },
    { color: 'red', value: '4' },
    { color: 'red', value: '5' }
  ];
  manager.setCurrentState(state);

  // Call DECLARE_UNO
  action = {
    type: 'DECLARE_UNO',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);

  // Play card
  action = {
    type: 'PLAY_CARD',
    playerId: 'p1',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  const playResult = manager.handleIncomingAction(action);
  if (!playResult.isValid) {
    console.error('Play card failed with error:', playResult.error);
  }
  assert.strictEqual(playResult.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.hands['p1'].length, 1);
  assert.strictEqual(state.gameSpecificState.unoDeclared['p1'], true);

  // Challenge should fail -> challenger p2 draws 2
  action = {
    type: 'CHALLENGE_UNO',
    playerId: 'p2',
    payload: { targetPlayerId: 'p1' },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.hands['p2'].length, 3); // Bob had 1 card, got 2 penalty cards -> 3
  console.log('✓ Declaring Uno makes player safe. Challenge fails and challenger is penalized.');

  // Setup unsafe Uno: Player plays to 1 card WITHOUT declaring Uno.
  state.status = 'ACTIVE';
  state.winnerId = null;
  state.gameSpecificState.hands['p1'] = [
    { color: 'red', value: '5' },
    { color: 'blue', value: '5' }
  ];
  state.gameSpecificState.unoDeclared['p1'] = false;
  state.gameSpecificState.pendingDrawCount = 0; // Reset
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_PLAY';
  state.gameSpecificState.currentColor = 'red';
  state.gameSpecificState.hands['p2'] = [{ color: 'red', value: '9' }]; // Bob has 1 card to avoid empty hand win trigger
  state.gameSpecificState.deck = [
    { color: 'red', value: '1' },
    { color: 'red', value: '2' },
    { color: 'red', value: '3' },
    { color: 'red', value: '4' },
    { color: 'red', value: '5' }
  ];
  manager.setCurrentState(state);

  // Play card
  action = {
    type: 'PLAY_CARD',
    playerId: 'p1',
    payload: { cardIndex: 0 },
    timestamp: Date.now()
  };
  manager.handleIncomingAction(action);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.hands['p1'].length, 1);
  assert.strictEqual(state.gameSpecificState.unoDeclared['p1'], false);

  // Challenge succeeds -> p1 draws 2
  action = {
    type: 'CHALLENGE_UNO',
    playerId: 'p2',
    payload: { targetPlayerId: 'p1' },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as UnoState;
  assert.strictEqual(state.gameSpecificState.hands['p1'].length, 3); // 1 + 2 penalty
  console.log('✓ Failing to declare Uno leaves player vulnerable. Challenge succeeds and player draws 2.');

  // 7. Verify getPlayerState (Fog-of-War filtering)
  const audited = ruleset.getPlayerState(state, 'p1');
  assert.ok(Array.isArray(audited.gameSpecificState.hands['p1'])); // p1 sees their own cards
  assert.strictEqual(typeof audited.gameSpecificState.hands['p2'], 'number'); // p1 sees p2 card count only
  assert.strictEqual(typeof audited.gameSpecificState.deck, 'number'); // p1 sees deck size only
  console.log('✓ getPlayerState successfully hides other hands and deck cards (fog-of-war).');
}

/**
 * ----------------------------------------------------
 * MONOPOLY SIMULATION TESTS
 * ----------------------------------------------------
 */
function testMonopoly() {
  logSection('MONOPOLY RULESET SIMULATION');

  const p1: IPlayer = { id: 'p1', name: 'Alice', isBot: false };
  const p2: IPlayer = { id: 'p2', name: 'Bob', isBot: false };
  const players = [p1, p2];

  const ruleset = new MonopolyRuleset();
  const manager = new GameEngineManager(ruleset);
  let state = manager.initGame(players, { gameId: 'monopoly-test-room' }, 777) as MonopolyState;

  // 1. Move around the board
  state.gameSpecificState.positions['p1'] = 0;
  manager.setCurrentState(state);

  mockRoll(3); // rolls 3 + 3 = 6 (Oriental Avenue)
  let action: GameAction = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  let result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.positions['p1'], 6);
  assert.strictEqual(state.subState, 'WAITING_FOR_BUY_OR_PASS');
  console.log('✓ Players move around the board by rolling dice.');

  // 2. Buy unowned property
  action = {
    type: 'BUY_PROPERTY',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.properties[6].ownerId, 'p1');
  assert.strictEqual(state.gameSpecificState.cash['p1'], 1400); // 1500 - 100
  console.log('✓ Land on unowned property and buy it works.');

  // 3. Land on opponent\'s property and pay rent
  state.gameSpecificState.positions['p2'] = 0;
  state.gameSpecificState.doubleRollCount = 0;
  state.activePlayerId = 'p2';
  state.turnIndex = 1;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(3); // rolls 3 + 3 = 6
  action = {
    type: 'ROLL_DICE',
    playerId: 'p2',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  // rent base for index 6 is 6.
  assert.strictEqual(state.gameSpecificState.cash['p2'], 1494); // 1500 - 6
  assert.strictEqual(state.gameSpecificState.cash['p1'], 1406); // 1400 + 6
  console.log('✓ Land on opponent property and pay rent works.');

  // Rent calculations (double rent for full color group)
  // spaces in light blue are 6, 8, 9.
  state.gameSpecificState.properties[6].ownerId = 'p1';
  state.gameSpecificState.properties[8].ownerId = 'p1';
  state.gameSpecificState.properties[9].ownerId = 'p1';
  state.gameSpecificState.positions['p2'] = 0;
  state.gameSpecificState.cash['p2'] = 1500;
  state.gameSpecificState.cash['p1'] = 1000;
  state.gameSpecificState.doubleRollCount = 0;
  state.activePlayerId = 'p2';
  state.turnIndex = 1;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(3); // rolls 6
  action = {
    type: 'ROLL_DICE',
    playerId: 'p2',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.cash['p2'], 1488); // 1500 - 12 (rent is doubled)
  assert.strictEqual(state.gameSpecificState.cash['p1'], 1012); // 1000 + 12
  console.log('✓ Rent is doubled if full color group is owned.');

  // Rent calculations (increases with houses built)
  // Build a house on space 6.
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  action = {
    type: 'BUILD_HOUSE',
    playerId: 'p1',
    payload: { spaceIndex: 6 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.properties[6].houses, 1);
  assert.strictEqual(state.gameSpecificState.cash['p1'], 962); // 1012 - 50 (house cost is 50)

  // land p2 on index 6
  state.gameSpecificState.positions['p2'] = 0;
  state.gameSpecificState.cash['p2'] = 1500;
  state.gameSpecificState.doubleRollCount = 0;
  state.activePlayerId = 'p2';
  state.turnIndex = 1;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(3); // rolls 6
  action = {
    type: 'ROLL_DICE',
    playerId: 'p2',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  // rent with 1 house is rent[1] = 30.
  assert.strictEqual(state.gameSpecificState.cash['p2'], 1470); // 1500 - 30
  console.log('✓ Rent increases with houses built.');

  // 4. Mortgaging/Unmortgaging properties
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  // sell house first
  action = {
    type: 'SELL_HOUSE',
    playerId: 'p1',
    payload: { spaceIndex: 6 },
    timestamp: Date.now()
  };
  manager.handleIncomingAction(action);

  // mortgage Oriental Avenue
  action = {
    type: 'MORTGAGE',
    playerId: 'p1',
    payload: { spaceIndex: 6 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.properties[6].mortgaged, true);
  
  // land p2 on index 6, verify rent skipped
  state.gameSpecificState.positions['p2'] = 0;
  state.gameSpecificState.cash['p2'] = 1500;
  state.gameSpecificState.doubleRollCount = 0;
  state.activePlayerId = 'p2';
  state.turnIndex = 1;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(3);
  action = {
    type: 'ROLL_DICE',
    playerId: 'p2',
    payload: {},
    timestamp: Date.now()
  };
  manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.cash['p2'], 1500); // no rent paid
  console.log('✓ Mortgaging property suspends rent charges.');

  // unmortgage property
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  state.gameSpecificState.cash['p1'] = 1000;
  manager.setCurrentState(state);

  action = {
    type: 'UNMORTGAGE',
    playerId: 'p1',
    payload: { spaceIndex: 6 },
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.properties[6].mortgaged, false);
  assert.strictEqual(state.gameSpecificState.cash['p1'], 945); // 1000 - 55 (mortgage value 50 * 1.1 = 55)
  console.log('✓ Unmortgaging property works.');

  // 5. Jail mechanics
  // 3 double rolls in a row sends to jail
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  state.gameSpecificState.positions['p1'] = 0;
  state.gameSpecificState.doubleRollCount = 0;
  state.gameSpecificState.inJail['p1'] = false;
  manager.setCurrentState(state);

  // Roll 1: doubles
  mockRoll(2); // 2 and 2
  action = { type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now() };
  manager.handleIncomingAction(action);
  action = { type: 'END_TURN', playerId: 'p1', payload: {}, timestamp: Date.now() };
  manager.handleIncomingAction(action);
  
  // Roll 2: doubles
  mockRoll(3); // 3 and 3
  action = { type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now() };
  manager.handleIncomingAction(action);
  action = { type: 'END_TURN', playerId: 'p1', payload: {}, timestamp: Date.now() };
  manager.handleIncomingAction(action);

  // Roll 3: doubles -> Sent to jail!
  mockRoll(4); // 4 and 4
  action = { type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now() };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.inJail['p1'], true);
  assert.strictEqual(state.gameSpecificState.positions['p1'], 10);
  console.log('✓ 3 double rolls in a row sends player to jail.');

  // Pay $50 to get out of jail
  state.subState = 'WAITING_FOR_JAIL_DECISION';
  state.gameSpecificState.cash['p1'] = 1000;
  manager.setCurrentState(state);

  action = {
    type: 'PAY_JAIL_FINE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  assert.strictEqual(result.isValid, true);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.inJail['p1'], false);
  assert.strictEqual(state.gameSpecificState.cash['p1'], 950);
  assert.strictEqual(state.subState, 'WAITING_FOR_ROLL');
  console.log('✓ Paying $50 to get out of jail works.');

  // Roll doubles to get out of jail
  state.gameSpecificState.inJail['p1'] = true;
  state.subState = 'WAITING_FOR_JAIL_DECISION';
  manager.setCurrentState(state);

  mockRoll(3); // 3 and 3
  action = {
    type: 'ROLL_DICE',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.inJail['p1'], false);
  assert.strictEqual(state.gameSpecificState.positions['p1'], 16); // 10 + 6
  console.log('✓ Rolling doubles to get out of jail works.');

  // 6. Draw Chance card
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  state.gameSpecificState.positions['p1'] = 1;
  state.gameSpecificState.cash['p1'] = 1000;
  state.gameSpecificState.doubleRollCount = 0;
  manager.setCurrentState(state);

  mockRoll(3); // roll sum = 6, lands on index 7 (Chance), cardType = 3 (speeding fine pay $15)
  action = { type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now() };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.positions['p1'], 7);
  assert.strictEqual(state.gameSpecificState.cash['p1'], 985); // 1000 - 15
  console.log('✓ Chance card resolves and applies effect successfully.');

  // 7. Debt & Bankruptcy
  // Setup debt: land on owned property and go negative
  state.gameSpecificState.properties[6].ownerId = 'p2';
  state.gameSpecificState.properties[6].houses = 1; // rent = 30
  state.gameSpecificState.properties[6].mortgaged = false;
  state.gameSpecificState.positions['p1'] = 0;
  state.gameSpecificState.cash['p1'] = 10;
  state.gameSpecificState.doubleRollCount = 0;
  state.activePlayerId = 'p1';
  state.turnIndex = 0;
  state.subState = 'WAITING_FOR_ROLL';
  manager.setCurrentState(state);

  mockRoll(3); // rolls 6, lands on Oriental Avenue index 6
  action = { type: 'ROLL_DICE', playerId: 'p1', payload: {}, timestamp: Date.now() };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.gameSpecificState.cash['p1'], -20);
  assert.strictEqual(state.subState, 'DEBT_OR_BANKRUPT');
  console.log('✓ Debt state triggers when cash falls below 0.');

  // Declare Bankruptcy
  action = {
    type: 'DECLARE_BANKRUPTCY',
    playerId: 'p1',
    payload: {},
    timestamp: Date.now()
  };
  result = manager.handleIncomingAction(action);
  state = manager.getCurrentState() as MonopolyState;
  assert.strictEqual(state.status, 'GAME_OVER');
  assert.strictEqual(state.winnerId, 'p2');
  assert.strictEqual(state.gameSpecificState.bankrupt['p1'], true);
  console.log('✓ Bankruptcy eliminates player and ends game if one remains.');
}

/**
 * ----------------------------------------------------
 * CONNECTION RECOVERY TESTS
 * ----------------------------------------------------
 */
interface PlayerSession {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  handshakeToken: string;
}

interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  players: PlayerSession[];
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  gameType: 'UNO';
  engineManager: GameEngineManager;
  seed: number;
}

class ConnectionRecoverySimulator {
  public rooms: Record<string, GameRoom> = {};
  public disconnectTimers: Record<string, NodeJS.Timeout> = {};

  public disconnectPlayer(roomId: string, playerId: string, gracePeriodMs: number, onTimeoutCallback: Function) {
    const room = this.rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.connected = false;
      this.disconnectTimers[playerId] = setTimeout(() => {
        this.handlePermanentLeave(roomId, playerId);
        onTimeoutCallback();
      }, gracePeriodMs);
    }
  }

  public reconnectPlayer(roomId: string, playerId: string, token: string): any {
    const room = this.rooms[roomId];
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.handshakeToken !== token) {
      throw new Error('Invalid session token');
    }

    if (this.disconnectTimers[playerId]) {
      clearTimeout(this.disconnectTimers[playerId]);
      delete this.disconnectTimers[playerId];
    }

    player.connected = true;

    return {
      success: true,
      room: {
        id: room.id,
        name: room.name,
        players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected }))
      },
      gameState: room.engineManager.getAuditedState(playerId)
    };
  }

  private handlePermanentLeave(roomId: string, playerId: string) {
    const room = this.rooms[roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    delete this.disconnectTimers[playerId];
  }
}

async function testConnectionRecovery(): Promise<void> {
  logSection('CONNECTION RECOVERY SYSTEM');

  const p1: IPlayer = { id: 'p1', name: 'Alice', isBot: false };
  const p2: IPlayer = { id: 'p2', name: 'Bob', isBot: false };

  const ruleset = new UnoRuleset();
  const engineManager = new GameEngineManager(ruleset);
  engineManager.initGame([p1, p2], { gameId: 'room123' }, 999);

  const simulator = new ConnectionRecoverySimulator();
  const room: GameRoom = {
    id: 'room123',
    name: 'Test Room',
    hostId: 'p1',
    players: [
      { id: 'p1', name: 'Alice', connected: true, ready: true, handshakeToken: 'token-alice' },
      { id: 'p2', name: 'Bob', connected: true, ready: true, handshakeToken: 'token-bob' }
    ],
    status: 'PLAYING',
    gameType: 'UNO',
    engineManager,
    seed: 999
  };

  simulator.rooms['room123'] = room;

  // 1. Simulate Alice Disconnecting
  let timerTriggered = false;
  // Use a short 100ms grace period for fast testing
  simulator.disconnectPlayer('room123', 'p1', 100, () => {
    timerTriggered = true;
  });

  const sessionP1 = room.players.find(p => p.id === 'p1');
  assert.ok(sessionP1);
  assert.strictEqual(sessionP1.connected, false);
  assert.ok(simulator.disconnectTimers['p1']);
  console.log('✓ Player disconnection sets state to connected = false and registers timer.');

  // 2. Wait and verify timer triggers permanent removal
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.strictEqual(timerTriggered, true);
  assert.strictEqual(room.players.length, 1); // Only Bob remains
  console.log('✓ Grace period expiry triggers player removal.');

  // 3. Reset and test Reconnection recovery state
  room.players = [
    { id: 'p1', name: 'Alice', connected: true, ready: true, handshakeToken: 'token-alice' },
    { id: 'p2', name: 'Bob', connected: true, ready: true, handshakeToken: 'token-bob' }
  ];
  timerTriggered = false;

  simulator.disconnectPlayer('room123', 'p1', 500, () => {
    timerTriggered = true;
  });

  // Reconnect Alice before 500ms
  await new Promise(resolve => setTimeout(resolve, 100));
  const recoveryResponse = simulator.reconnectPlayer('room123', 'p1', 'token-alice');

  assert.strictEqual(recoveryResponse.success, true);
  assert.strictEqual(room.players.find(p => p.id === 'p1')?.connected, true);
  assert.strictEqual(simulator.disconnectTimers['p1'], undefined); // timer cleared
  
  // Verify Alice received the CORRECT filtered fog-of-war state
  const recoveredState = recoveryResponse.gameState;
  assert.ok(recoveredState);
  assert.strictEqual(typeof recoveredState.gameSpecificState.hands['p2'], 'number'); // Bob hand details hidden
  assert.ok(Array.isArray(recoveredState.gameSpecificState.hands['p1'])); // Alice sees her own cards

  // Wait to verify timer never triggers now
  await new Promise(resolve => setTimeout(resolve, 500));
  assert.strictEqual(timerTriggered, false);
  assert.strictEqual(room.players.length, 2); // Both remain in room
  console.log('✓ Reconnection successfully cancels timer and returns filtered game state (fog-of-war).');
}

/**
 * ----------------------------------------------------
 * RUN ALL TESTS
 * ----------------------------------------------------
 */
async function runAll() {
  try {
    testLudo();
    testUno();
    testMonopoly();
    await testConnectionRecovery();
    console.log(`\n========================================`);
    console.log(`ALL TESTS PASSED SUCCESSFULLY!`);
    console.log(`========================================`);
  } catch (error) {
    console.error(`\nTest suite failed:`, error);
    process.exit(1);
  }
}

runAll();
clearMockRoll();
