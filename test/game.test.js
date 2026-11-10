import assert from 'node:assert/strict';
import { test } from 'node:test';
import { key, rowCells } from '../web/js/engine/board.js';
import { SHAPES, rotate } from '../web/js/engine/pieces.js';
import { act, createGame, fallDelay, levelFor, scoreFor } from '../web/js/engine/game.js';

const rng = () => 0;

const keys = (...cells) => new Set(cells.map(([x, r]) => key(x, r)));

// A row of the comb, with the x positions in `gaps` left empty.
const rowWithout = (r, ...gaps) => rowCells(r).filter(([x]) => !gaps.includes(x));

function setup(name, x, r, cells = []) {
  const piece = { name, offsets: SHAPES[name], x, r, side: 1 };
  return { ...createGame({ rng }), piece, filled: keys(...cells) };
}

test('a piece spawns at the top of the comb and the bag deals every shape once', () => {
  let state = createGame({ rng });
  assert.equal(state.piece.x, 0);
  assert.equal(state.piece.r, 2);
  assert.deepEqual(state.piece.offsets, SHAPES[state.piece.name]);

  const dealt = [state.piece.name];
  while (dealt.length < Object.keys(SHAPES).length) {
    state = act(state, 'drop', rng);
    dealt.push(state.piece.name);
  }
  assert.deepEqual([...dealt].sort(), Object.keys(SHAPES).sort());
});

test('act does not change the state it is given', () => {
  const state = setup('bar', 0, 16);
  const filled = new Set(state.filled);
  const piece = { ...state.piece };
  act(state, 'fall', rng);
  assert.deepEqual(state.filled, filled);
  assert.deepEqual(state.piece, piece);
});

test('left and right move by 2 and stop at the side and at sealed cells', () => {
  const start = setup('bar', 0, 4);
  assert.equal(act(start, 'left', rng).piece.x, -2);
  assert.equal(act(start, 'right', rng).piece.x, 2);

  const atSide = setup('bar', 8, 4);
  assert.equal(act(atSide, 'right', rng).piece.x, 8);

  const blocked = setup('bar', 0, 4, [[4, 4]]);
  assert.equal(act(blocked, 'right', rng).piece.x, 0);
});

test('rotate turns in place, then beside, and otherwise does nothing', () => {
  const free = act(setup('bar', 0, 4), 'rotate', rng);
  assert.deepEqual(free.piece.offsets, rotate(SHAPES.bar));
  assert.equal(free.piece.x, 0);

  const right = act(setup('bar', 0, 4, [[1, 5]]), 'rotate', rng);
  assert.deepEqual(right.piece.offsets, rotate(SHAPES.bar));
  assert.equal(right.piece.x, 2);

  const left = act(setup('bar', 0, 4, [[1, 5], [3, 5]]), 'rotate', rng);
  assert.equal(left.piece.x, -2);

  const stuck = act(setup('bar', 0, 4, [[1, 5], [3, 5], [-1, 5]]), 'rotate', rng);
  assert.deepEqual(stuck.piece.offsets, SHAPES.bar);
  assert.equal(stuck.piece.x, 0);
});

test('fall drifts from side to side and takes the other side when one is blocked', () => {
  const first = act(setup('drop', 0, 2), 'fall', rng);
  assert.deepEqual([first.piece.x, first.piece.r, first.piece.side], [1, 3, -1]);
  const second = act(first, 'fall', rng);
  assert.deepEqual([second.piece.x, second.piece.r, second.piece.side], [0, 4, 1]);

  const other = act(setup('drop', 0, 2, [[3, 3]]), 'fall', rng);
  assert.deepEqual([other.piece.x, other.piece.r, other.piece.side], [-1, 3, -1]);
});

test('a piece stops on the floor and on sealed cells', () => {
  const floor = act(setup('bar', 0, 16), 'fall', rng);
  assert.deepEqual(floor.filled, keys([-2, 16], [0, 16], [2, 16]));
  assert.deepEqual(floor.events, ['lock']);
  assert.equal(floor.piece.r, 2);

  const onCells = act(setup('bar', 1, 15, [[0, 16], [2, 16]]), 'fall', rng);
  assert.deepEqual(onCells.filled, keys([0, 16], [2, 16], [-1, 15], [1, 15], [3, 15]));
  assert.deepEqual(onCells.events, ['lock']);

  const dropped = act(setup('bar', 0, 2), 'drop', rng);
  assert.deepEqual(dropped.events, ['lock']);
  for (const cell of dropped.filled) {
    assert.ok(Number(cell.split(',')[1]) >= 15, `${cell} is near the floor`);
  }
  assert.equal(dropped.filled.size, 3);
});

test('a completed row seals, the cells above settle and the score rises', () => {
  const cells = [...rowWithout(16, -2, 0, 2), [1, 15]];
  const state = act(setup('bar', 0, 16, cells), 'fall', rng);
  assert.deepEqual(state.filled, keys([0, 16]));
  assert.equal(state.score, 100);
  assert.equal(state.rows, 1);
  assert.deepEqual(state.events, ['lock', 'seal:1']);
});

test('a settling cell goes to the free cell nearest the centre, x - 1 first at x = 0', () => {
  const sealRow16 = rowWithout(16, -2, 0, 2);

  const centre = act(setup('bar', 0, 16, [...sealRow16, [0, 14]]), 'fall', rng);
  assert.deepEqual(centre.filled, keys([0, 16]));

  const floor = [[-2, 16], [0, 16], [2, 16]];
  const sealRow13 = [...rowWithout(13, -1, 1, 3), [2, 14], ...floor, [0, 12]];
  const atZero = act(setup('bar', 1, 13, sealRow13), 'fall', rng);
  assert.deepEqual(atZero.filled, keys([2, 14], ...floor, [-1, 15]));

  const sides = act(setup('bar', 0, 16, [...sealRow16, [3, 15], [-3, 15]]), 'fall', rng);
  assert.deepEqual(sides.filled, keys([2, 16], [-2, 16]));
});

test('cells below the topmost sealed row do not settle', () => {
  const cells = [...rowWithout(14, -2, 0, 2), [1, 15]];
  const state = act(setup('bar', 0, 14, cells), 'fall', rng);
  assert.deepEqual(state.filled, keys([1, 15]));
  assert.deepEqual(state.events, ['lock', 'seal:1']);
});

test('all rows of one lock count together, also rows that settling completes', () => {
  const both = [...rowWithout(15, -1, 1), ...rowWithout(16, 0, 2)];
  const twoRows = act(setup('fork', 1, 15, both), 'fall', rng);
  assert.equal(twoRows.filled.size, 0);
  assert.equal(twoRows.score, scoreFor(2, 1));
  assert.deepEqual(twoRows.events, ['lock', 'seal:2']);

  const cascade = [...rowWithout(16, -2, 0, 2), ...rowWithout(15, 7)];
  const settled = act(setup('bar', 0, 16, cascade), 'fall', rng);
  assert.equal(settled.filled.size, 0);
  assert.equal(settled.rows, 2);
  assert.equal(settled.score, scoreFor(2, 1));
  assert.deepEqual(settled.events, ['lock', 'seal:2']);
});

test('sealing more rows at once scores more per row', () => {
  assert.ok(scoreFor(2, 1) / 2 > scoreFor(1, 1));
  assert.ok(scoreFor(3, 1) / 3 > scoreFor(2, 1) / 2);
  assert.equal(scoreFor(2, 3), 900);
});

test('a piece that cannot spawn ends the game and restart begins again', () => {
  const over = act(setup('bar', 0, 16, [[0, 2]]), 'fall', rng);
  assert.equal(over.over, true);
  assert.deepEqual(over.events, ['lock', 'over']);

  const still = act(over, 'left', rng);
  assert.equal(still.piece.x, over.piece.x);
  assert.deepEqual(still.events, []);

  const again = act({ ...over, score: 500, rows: 9, level: 2 }, 'restart', rng);
  assert.equal(again.over, false);
  assert.equal(again.filled.size, 0);
  assert.equal(again.score, 0);
  assert.equal(again.rows, 0);
  assert.equal(again.level, 1);
  assert.deepEqual(again.events, []);
});

test('each level is faster than the one before', () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(7), 1);
  assert.equal(levelFor(8), 2);
  assert.equal(fallDelay(1), 800);
  for (let n = 1; n <= 30; n += 1) {
    assert.ok(fallDelay(n + 1) < fallDelay(n), `level ${n}`);
  }

  const cells = rowWithout(16, -2, 0, 2);
  const state = { ...setup('bar', 0, 16, cells), rows: 7 };
  const raised = act(state, 'fall', rng);
  assert.equal(raised.rows, 8);
  assert.equal(raised.level, 2);
  assert.equal(raised.score, scoreFor(1, 1));
  assert.deepEqual(raised.events, ['lock', 'seal:1', 'level']);
});

test('pause stops play and the next piece is known', () => {
  const paused = act(setup('bar', 0, 4), 'pause', rng);
  assert.equal(paused.paused, true);
  assert.deepEqual(act(paused, 'fall', rng), paused);

  const resumed = act(paused, 'pause', rng);
  assert.equal(resumed.paused, false);
  assert.equal(act(resumed, 'fall', rng).piece.r, 5);

  const state = setup('bar', 0, 16);
  const locked = act(state, 'fall', rng);
  assert.equal(locked.piece.name, state.next);
  assert.ok(Object.keys(SHAPES).includes(locked.next));
});
