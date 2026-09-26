import assert from 'node:assert/strict';
import test from 'node:test';
import { getSnakesStepPath } from '../src/features/games/snakes-ladders/snakesPath.ts';
import { getMonopolyStepPath } from '../src/features/games/monopoly/monopolyPath.ts';
import { getLudoStepPath } from '../src/features/games/ludo/ludoPath.ts';

test('Snakes & Ladders normal forward movement', () => {
  const result = getSnakesStepPath(5, 9, 4, {}, {});
  assert.deepEqual(result.steps, [6, 7, 8, 9]);
  assert.equal(result.isSnakeOrLadder, false);
  assert.equal(result.finalSquare, 9);
});

test('Snakes & Ladders ladder climb', () => {
  // Head at 21 has ladder to 42
  const ladders = { 21: 42 };
  const snakes = {};
  const result = getSnakesStepPath(18, 42, 3, snakes, ladders);
  assert.deepEqual(result.steps, [19, 20, 21]);
  assert.equal(result.isSnakeOrLadder, true);
  assert.equal(result.finalSquare, 42);
});

test('Snakes & Ladders snake slide', () => {
  // Snake at 16 goes to 6
  const snakes = { 16: 6 };
  const ladders = {};
  const result = getSnakesStepPath(14, 6, 2, snakes, ladders);
  assert.deepEqual(result.steps, [15, 16]);
  assert.equal(result.isSnakeOrLadder, true);
  assert.equal(result.finalSquare, 6);
});

test('Monopoly normal clockwise advance', () => {
  const result = getMonopolyStepPath(4, 9, false);
  assert.deepEqual(result.steps, [5, 6, 7, 8, 9]);
  assert.equal(result.isDirectTeleport, false);
  assert.equal(result.finalSpace, 9);
});

test('Monopoly perimeter wrap around Go (space 0)', () => {
  const result = getMonopolyStepPath(46, 2, false);
  assert.deepEqual(result.steps, [47, 0, 1, 2]);
  assert.equal(result.isDirectTeleport, false);
  assert.equal(result.finalSpace, 2);
});

test('Monopoly direct jail teleport', () => {
  const result = getMonopolyStepPath(36, 12, true);
  assert.deepEqual(result.steps, [12]);
  assert.equal(result.isDirectTeleport, true);
  assert.equal(result.finalSpace, 12);
});

test('Ludo base exit to start cell', () => {
  // Player 0 (startCell = 0)
  const result = getLudoStepPath(52, 0, -1, 0);
  assert.deepEqual(result.steps, [0]);
  assert.equal(result.type, 'base_exit');
  assert.equal(result.finalPos, 0);

  // Player 1 (startCell = 13)
  const resP1 = getLudoStepPath(52, 1, -1, 13);
  assert.deepEqual(resP1.steps, [13]);
  assert.equal(resP1.type, 'base_exit');
});

test('Ludo track stepping across lap and into home lane', () => {
  // 4-player game (trackLength 52), Player 0
  const result = getLudoStepPath(52, 0, 49, 53);
  assert.deepEqual(result.steps, [50, 51, 52, 53]);
  assert.equal(result.type, 'step_path');

  // 6-player game (trackLength 78), Player 1 (startCell = 13)
  // Reaching home stretch: cell 12 is stepsTaken 77, next is 78 (home stretch)
  const res6p = getLudoStepPath(78, 1, 10, 79);
  assert.deepEqual(res6p.steps, [11, 12, 78, 79]);
  assert.equal(res6p.type, 'step_path');
});

test('Ludo captured token returns to base', () => {
  const result = getLudoStepPath(52, 0, 24, -1);
  assert.deepEqual(result.steps, [-1]);
  assert.equal(result.type, 'retreat');
});
