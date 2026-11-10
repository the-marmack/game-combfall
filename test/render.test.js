import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { WIDTHS, rowCells } from '../web/js/engine/board.js';
import { cellCenter, fitSize, hexPoints } from '../web/js/ui/render.js';

test('hex cells touch their neighbours', () => {
  const origin = cellCenter(0, 0, 10);
  const distanceTo = (x, r) => {
    const { px, py } = cellCenter(x, r, 10);
    return Math.hypot(px - origin.px, py - origin.py);
  };

  assert.ok(Math.abs(distanceTo(2, 0) - distanceTo(1, 1)) < 1e-9);
  // Two pointy-top hexagons share an edge when their centres are √3 × size apart.
  assert.ok(Math.abs(distanceTo(2, 0) - 10 * Math.sqrt(3)) < 1e-9);
});

test('the comb fits the space', () => {
  const size = fitSize(360, 640);
  const corners = WIDTHS.flatMap((_, row) =>
    rowCells(row).flatMap(([x, r]) => {
      const { px, py } = cellCenter(x, r, size);
      return hexPoints(px, py, size);
    }),
  );
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);

  assert.ok(width <= 360 + 1e-9, `width ${width}`);
  assert.ok(height <= 640 + 1e-9, `height ${height}`);
  // The largest size that fits touches at least one side of the space.
  assert.ok(Math.abs(Math.max(width / 360, height / 640) - 1) < 1e-9);
});

test('the page names only Combfall', async () => {
  const page = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');

  assert.match(page, /Combfall/);
  assert.doesNotMatch(page, /tetris/i);
  assert.doesNotMatch(page, /tetromino/i);
});
