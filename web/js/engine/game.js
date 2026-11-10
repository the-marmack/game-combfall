import { WIDTHS, isCell, key, rowCells } from './board.js';
import { SHAPES, fits, place, rotate } from './pieces.js';

export function scoreFor(rows, level) {
  return 50 * rows * (rows + 1) * level;
}

export function levelFor(rows) {
  return 1 + Math.floor(rows / 8);
}

export function fallDelay(level) {
  return 800 * 0.85 ** (level - 1);
}

function shuffledBag(rng) {
  const bag = Object.keys(SHAPES);
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// Takes the next name, refilling an empty bag.
function deal(bag, rng) {
  const [name, ...rest] = bag.length > 0 ? bag : shuffledBag(rng);
  return { name, bag: rest };
}

function spawn(name) {
  return { name, offsets: SHAPES[name], x: 0, r: 2, side: 1 };
}

function pieceFits(piece, filled) {
  return fits(place(piece.offsets, piece.x, piece.r), filled);
}

export function createGame({ rng = Math.random } = {}) {
  const first = deal([], rng);
  const second = deal(first.bag, rng);
  return {
    filled: new Set(),
    piece: spawn(first.name),
    next: second.name,
    bag: second.bag,
    score: 0,
    level: 1,
    rows: 0,
    over: false,
    paused: false,
    events: [],
  };
}

function shifted(state, dx) {
  const piece = { ...state.piece, x: state.piece.x + dx };
  return pieceFits(piece, state.filled) ? { ...state, piece } : state;
}

function turned(state) {
  const offsets = rotate(state.piece.offsets);
  for (const dx of [0, 2, -2]) {
    const piece = { ...state.piece, offsets, x: state.piece.x + dx };
    if (pieceFits(piece, state.filled)) return { ...state, piece };
  }
  return state;
}

// The piece one row down, or null when both ways down are blocked.
function fallen(piece, filled) {
  for (const dx of [piece.side, -piece.side]) {
    const moved = { ...piece, x: piece.x + dx, r: piece.r + 1, side: -piece.side };
    if (pieceFits(moved, filled)) return moved;
  }
  return null;
}

function fullRows(filled) {
  return WIDTHS.flatMap((_, r) => (rowCells(r).every(([x]) => filled.has(key(x, r))) ? [r] : []));
}

function settleCell(filled, startX, startR) {
  let x = startX;
  let r = startR;
  for (;;) {
    const inward = x >= 0 ? -1 : 1;
    const free = [x + inward, x - inward].find((nx) => isCell(nx, r + 1) && !filled.has(key(nx, r + 1)));
    if (free === undefined) return;
    filled.delete(key(x, r));
    filled.add(key(free, r + 1));
    x = free;
    r += 1;
  }
}

// Removes full rows and settles the cells above them until no row is full.
function sealRows(startFilled) {
  const filled = new Set(startFilled);
  let sealed = 0;
  for (let full = fullRows(filled); full.length > 0; full = fullRows(filled)) {
    for (const r of full) {
      for (const [x] of rowCells(r)) filled.delete(key(x, r));
    }
    sealed += full.length;

    const top = full[0];
    const above = [...filled]
      .map((cell) => cell.split(',').map(Number))
      .filter(([, r]) => r < top)
      .sort(([ax, ar], [bx, br]) => br - ar || Math.abs(ax) - Math.abs(bx) || ax - bx);
    for (const [x, r] of above) settleCell(filled, x, r);
  }
  return { filled, sealed };
}

function lock(state, piece, rng) {
  const landed = new Set(state.filled);
  for (const [x, r] of place(piece.offsets, piece.x, piece.r)) landed.add(key(x, r));
  const { filled, sealed } = sealRows(landed);

  const events = ['lock'];
  const rows = state.rows + sealed;
  const level = levelFor(rows);
  if (sealed > 0) events.push(`seal:${sealed}`);
  if (level > state.level) events.push('level');

  const newPiece = spawn(state.next);
  const dealt = deal(state.bag, rng);
  const over = !pieceFits(newPiece, filled);
  if (over) events.push('over');

  return {
    ...state,
    filled,
    piece: newPiece,
    next: dealt.name,
    bag: dealt.bag,
    score: state.score + scoreFor(sealed, state.level),
    level,
    rows,
    over,
    events,
  };
}

function fall(state, rng) {
  const piece = fallen(state.piece, state.filled);
  return piece ? { ...state, piece } : lock(state, state.piece, rng);
}

function drop(state, rng) {
  let piece = state.piece;
  for (let below = fallen(piece, state.filled); below; below = fallen(piece, state.filled)) {
    piece = below;
  }
  return lock(state, piece, rng);
}

export function act(previous, action, rng = Math.random) {
  const state = { ...previous, events: [] };
  if (action === 'restart') return createGame({ rng });
  if (action === 'pause') return { ...state, paused: !state.paused };
  if (state.paused || state.over) return state;
  switch (action) {
    case 'left':
      return shifted(state, -2);
    case 'right':
      return shifted(state, 2);
    case 'rotate':
      return turned(state);
    case 'fall':
      return fall(state, rng);
    case 'drop':
      return drop(state, rng);
    default:
      return state;
  }
}
