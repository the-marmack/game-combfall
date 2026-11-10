import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WIDTHS, isCell, key, rowCells } from '../web/js/engine/board.js';

test('the comb is a funnel', () => {
  for (let r = 1; r < WIDTHS.length; r += 1) {
    assert.equal(Math.abs(WIDTHS[r] - WIDTHS[r - 1]), 1, `rows ${r - 1} and ${r}`);
  }
  assert.equal(WIDTHS.at(-1), 7);
});

test('every row is centred and holds as many cells as its width', () => {
  WIDTHS.forEach((width, r) => {
    const cells = rowCells(r);
    assert.equal(cells.length, width, `row ${r}`);
    assert.deepEqual(cells[0], [-(width - 1), r]);
    assert.deepEqual(cells.at(-1), [width - 1, r]);
    for (const [x, row] of cells) {
      assert.equal(isCell(x, row), true, `(${x}, ${row})`);
    }
  });
});

test('x + r has one parity across the comb, so a piece keeps its shape when moved', () => {
  WIDTHS.forEach((_, r) => {
    for (const [x, row] of rowCells(r)) {
      assert.equal(Math.abs(x + row) % 2, 0, `(${x}, ${row})`);
    }
  });
});

test('isCell rejects the wrong parity, the sides and rows outside the comb', () => {
  assert.equal(isCell(1, 0), false);
  assert.equal(isCell(0, 1), false);
  assert.equal(isCell(12, 0), false);
  assert.equal(isCell(-12, 0), false);
  assert.equal(isCell(8, 16), false);
  assert.equal(isCell(0, -1), false);
  assert.equal(isCell(0, WIDTHS.length), false);
});

test('key tells cells apart', () => {
  assert.equal(key(1, 3), key(1, 3));
  assert.notEqual(key(1, 3), key(3, 1));
  assert.notEqual(key(-1, 3), key(1, 3));
});
