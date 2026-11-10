import { isCell, key } from './board.js';

// Offsets [dx, dr] from a piece's origin, in doubled coordinates.
export const SHAPES = {
  drop: [[0, 0], [2, 0], [1, 1]],
  bar: [[-2, 0], [0, 0], [2, 0]],
  arc: [[-2, 0], [0, 0], [1, 1], [3, 1]],
  hook: [[-2, 0], [0, 0], [2, 0], [3, 1]],
  fork: [[-2, 0], [0, 0], [1, 1], [-1, 1]],
  petal: [[0, 0], [2, 0], [-2, 0], [1, 1], [-1, 1]],
  chain: [[-1, -1], [0, 0], [2, 0], [3, 1], [5, 1]],
};

// One 60° clockwise turn through cube coordinates. Adding 0 turns -0 into 0.
export function rotate(offsets) {
  return offsets.map(([dx, dr]) => {
    const q = (dx - dr) / 2;
    const s = -q - dr;
    const nextQ = -dr;
    const nextR = -s;
    return [2 * nextQ + nextR + 0, nextR + 0];
  });
}

export function place(offsets, x, r) {
  return offsets.map(([dx, dr]) => [x + dx, r + dr]);
}

export function fits(cells, filled) {
  return cells.every(([x, r]) => isCell(x, r) && !filled.has(key(x, r)));
}
