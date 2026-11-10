// The comb in doubled coordinates (x, r): r is the row, 0 at the top, and x is
// centred on 0. Neighbours are (x±2, r) and (x±1, r±1).

export const WIDTHS = [11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 9, 8, 7];

export function isCell(x, r) {
  const width = WIDTHS[r];
  if (width === undefined) return false;
  return Math.abs(x) <= width - 1 && (x - (width - 1)) % 2 === 0;
}

export function rowCells(r) {
  const width = WIDTHS[r];
  const cells = [];
  for (let i = 0; i < width; i += 1) {
    cells.push([2 * i - (width - 1), r]);
  }
  return cells;
}

export function key(x, r) {
  return `${x},${r}`;
}
