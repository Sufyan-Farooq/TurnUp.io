import assert from 'node:assert/strict';
import test from 'node:test';
import { getMonopolyTokenSlot } from '../src/features/games/monopoly/tokenGeometry.ts';
import { getSerpentineCoordinates, getSnakesTokenSlot } from '../src/features/games/snakes-ladders/boardGeometry.ts';

const assertSlotsFit = (slotFor, maxPlayers, halfCellWidth) => {
  for (let count = 1; count <= maxPlayers; count++) {
    const slots = Array.from({ length: count }, (_, index) => slotFor(index, count));
    for (const slot of slots) {
      assert.ok(Math.abs(slot.x) + slot.size / 2 <= halfCellWidth, `${count} players: piece exceeds square width`);
      assert.ok(Math.abs(slot.y) + slot.size / 2 <= 46, `${count} players: piece exceeds square height`);
    }
    for (let first = 0; first < slots.length; first++) {
      for (let second = first + 1; second < slots.length; second++) {
        const a = slots[first];
        const b = slots[second];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(distance >= (a.size + b.size) / 2, `${count} players: pieces ${first} and ${second} overlap`);
      }
    }
  }
};

test('Monopoly pieces fit and do not overlap on a narrow side tile', () => {
  assertSlotsFit(getMonopolyTokenSlot, 8, 37);
});

test('Snakes & Ladders pieces fit and do not overlap on a shared square', () => {
  assertSlotsFit(getSnakesTokenSlot, 8, 50);
});

test('Snakes & Ladders cell coordinates follow the serpentine path', () => {
  assert.deepEqual(getSerpentineCoordinates(1), { x: 50, y: 950 });
  assert.deepEqual(getSerpentineCoordinates(10), { x: 950, y: 950 });
  assert.deepEqual(getSerpentineCoordinates(11), { x: 950, y: 850 });
  assert.deepEqual(getSerpentineCoordinates(20), { x: 50, y: 850 });
  assert.deepEqual(getSerpentineCoordinates(100), { x: 50, y: 50 });
  const coords = Array.from({ length: 100 }, (_, index) => getSerpentineCoordinates(index + 1));
  assert.equal(new Set(coords.map(({ x, y }) => `${x},${y}`)).size, 100);
});
