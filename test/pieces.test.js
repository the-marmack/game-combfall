import assert from 'node:assert/strict';
import { test } from 'node:test';
import { key } from '../web/js/engine/board.js';
import { SHAPES, fits, place, rotate } from '../web/js/engine/pieces.js';

test('no piece has four cells in a square-grid shape', () => {
  for (const [name, offsets] of Object.entries(SHAPES)) {
    assert.ok(offsets.length >= 3 && offsets.length <= 5, `${name} has ${offsets.length} cells`);
    for (const [dx, dr] of offsets) {
      assert.equal(Math.abs(dx + dr) % 2, 0, `${name} offset [${dx}, ${dr}]`);
    }
  }
});

test('rotating six times restores a piece', () => {
  for (const [name, offsets] of Object.entries(SHAPES)) {
    let turned = offsets;
    for (let i = 0; i < 6; i += 1) {
      turned = rotate(turned);
    }
    assert.deepEqual(turned, offsets, name);
  }
  assert.deepEqual(rotate([[2, 0]]), [[1, 1]]);
});

test('a rotated offset stays on the doubled grid', () => {
  for (const [name, offsets] of Object.entries(SHAPES)) {
    for (const [dx, dr] of rotate(offsets)) {
      assert.equal(Math.abs(dx + dr) % 2, 0, `${name} offset [${dx}, ${dr}]`);
    }
  }
});

test('place moves offsets to a position', () => {
  assert.deepEqual(place(SHAPES.drop, 2, 4), [
    [2, 4],
    [4, 4],
    [3, 5],
  ]);
});

test('a piece cannot enter a filled cell or leave the comb', () => {
  const cells = place(SHAPES.drop, 0, 0);
  assert.equal(fits(cells, new Set()), true);
  assert.equal(fits(cells, new Set([key(2, 0)])), false);
  assert.equal(fits(place(SHAPES.bar, 10, 0), new Set()), false);
  assert.equal(fits(place(SHAPES.bar, 0, -1), new Set()), false);
  assert.equal(fits(place(SHAPES.drop, 0, 16), new Set()), false);
});
