import assert from 'node:assert/strict';
import test from 'node:test';
import { getSixLudoCoords, sixTrackCenter, sixBaseCenter, SIX_BASE_SLOT_OFFSETS } from './sixPlayerGeometry.ts';
import { getTokenDestination, getTokenStackOffset } from './tokenPlacement.ts';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('the 78-cell six-player track has unique, non-overlapping cell centers', () => {
  const cells = Array.from({ length: 78 }, (_, position) => sixTrackCenter(position));
  for (let first = 0; first < cells.length; first++) {
    for (let second = first + 1; second < cells.length; second++) {
      assert.ok(distance(cells[first], cells[second]) >= 43.9, `track cells ${first} and ${second} overlap`);
    }
    assert.ok(distance(cells[first], cells[(first + 1) % 78]) <= 64, `track gap after ${first} is too large`);
  }
});

test('each seat has five distinct lane cells between the track and its finish', () => {
  const track = Array.from({ length: 78 }, (_, position) => sixTrackCenter(position));
  const lanes = [];
  for (let seat = 0; seat < 6; seat++) {
    const lane = Array.from({ length: 5 }, (_, step) => getSixLudoCoords(seat, 78 + step, 0));
    for (let step = 0; step < lane.length; step++) {
      assert.ok(distance(lane[step], getSixLudoCoords(seat, 83, 0)) > 40);
      assert.ok(track.every(cell => distance(cell, lane[step]) >= 43.9), `seat ${seat} lane ${step} overlaps the track`);
    }
    lanes.push(...lane);
  }
  for (let first = 0; first < lanes.length; first++) {
    for (let second = first + 1; second < lanes.length; second++) {
      assert.ok(distance(lanes[first], lanes[second]) >= 43.9, `lane cells ${first} and ${second} overlap`);
    }
  }
});

test('all six bases provide four distinct pawn sockets away from the track', () => {
  const track = Array.from({ length: 78 }, (_, position) => sixTrackCenter(position));
  for (let seat = 0; seat < 6; seat++) {
    const base = sixBaseCenter(seat);
    const sockets = SIX_BASE_SLOT_OFFSETS.map((_, token) => getSixLudoCoords(seat, -1, token));
    for (let first = 0; first < sockets.length; first++) {
      assert.ok(distance(sockets[first], base) < 50);
      assert.ok(track.every(cell => distance(cell, sockets[first]) > 65));
      for (let second = first + 1; second < sockets.length; second++) {
        assert.ok(distance(sockets[first], sockets[second]) >= 57.9);
      }
    }
  }
});

test('stacked pawns have distinct positions for two, three, and four tokens', () => {
  for (const count of [2, 3, 4]) {
    const offsets = Array.from({ length: count }, (_, index) => getTokenStackOffset(index, count));
    for (let first = 0; first < offsets.length; first++) {
      for (let second = first + 1; second < offsets.length; second++) {
        assert.ok(distance(offsets[first], offsets[second]) >= 26);
      }
    }
  }
});

test('client move destinations follow the server path in four- and six-seat games', () => {
  for (const [trackLength, seats] of [[52, 4], [78, 6]]) {
    for (let seat = 0; seat < seats; seat++) {
      const start = seat * 13;
      assert.equal(getTokenDestination(trackLength, seat, -1, 6), start);
      assert.equal(getTokenDestination(trackLength, seat, -1, 5), null);
      assert.equal(getTokenDestination(trackLength, seat, start, 1), (start + 1) % trackLength);
      assert.equal(getTokenDestination(trackLength, seat, (start - 1 + trackLength) % trackLength, 1), trackLength);
      assert.equal(getTokenDestination(trackLength, seat, (start - 1 + trackLength) % trackLength, 6), trackLength + 5);
      assert.equal(getTokenDestination(trackLength, seat, trackLength + 4, 1), trackLength + 5);
      assert.equal(getTokenDestination(trackLength, seat, trackLength + 4, 2), null);
      assert.equal(getTokenDestination(trackLength, seat, trackLength + 5, 1), null);
    }
  }
});
