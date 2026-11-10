import { WIDTHS, isCell, key, rowCells } from '../engine/board.js';
import { SHAPES, place } from '../engine/pieces.js';

// Combfall's canvas palette; web/style.css holds the same colours for the page.
const COLORS = {
  hive: '#17100a',
  cell: '#2a1d10',
  wax: '#4a3218',
  sealed: '#c9780f',
  sealedGlow: '#e59a2b',
  piece: '#ffc93c',
  pieceGlow: '#ffe8a3',
  veil: 'rgba(23, 16, 10, 0.78)',
  text: '#ffe8a3',
};

// Cells are drawn a little small so a line of wax shows between them.
const WALL = 0.92;
const GLOW = 0.5;

const COMB_WIDTH = Math.max(...WIDTHS) * Math.sqrt(3);
const COMB_HEIGHT = (WIDTHS.length - 1) * 1.5 + 2;

export function cellCenter(x, r, size) {
  return { px: (x * size * Math.sqrt(3)) / 2, py: r * size * 1.5 };
}

export function hexPoints(px, py, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return [px + size * Math.cos(angle), py + size * Math.sin(angle)];
  });
}

export function fitSize(width, height) {
  return Math.min(width / COMB_WIDTH, height / COMB_HEIGHT);
}

function fillHex(ctx, px, py, size, color) {
  ctx.beginPath();
  hexPoints(px, py, size).forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// A cell of honey: the body, then a lighter hexagon set towards the top.
function fillHoney(ctx, px, py, size, body, glow) {
  fillHex(ctx, px, py, size * WALL, body);
  fillHex(ctx, px, py - size * 0.14, size * GLOW, glow);
}

function fillBackground(ctx) {
  ctx.fillStyle = COLORS.hive;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawNotice(ctx, text, size) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = COLORS.veil;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 ${size * 1.8}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
}

// Draws the comb centred on the canvas. `size` is in canvas pixels, as is the
// value fitSize returns when given the canvas's width and height.
export function draw(ctx, state, size) {
  const originX = ctx.canvas.width / 2;
  const originY = (ctx.canvas.height - COMB_HEIGHT * size) / 2 + size;
  const at = (x, r) => {
    const { px, py } = cellCenter(x, r, size);
    return [originX + px, originY + py];
  };

  fillBackground(ctx);
  WIDTHS.forEach((_, row) => {
    for (const [x, r] of rowCells(row)) {
      const [px, py] = at(x, r);
      fillHex(ctx, px, py, size, COLORS.wax);
      if (state.filled.has(key(x, r))) {
        fillHoney(ctx, px, py, size, COLORS.sealed, COLORS.sealedGlow);
      } else {
        fillHex(ctx, px, py, size * WALL, COLORS.cell);
      }
    }
  });

  if (!state.over) {
    for (const [x, r] of place(state.piece.offsets, state.piece.x, state.piece.r)) {
      if (!isCell(x, r)) continue;
      const [px, py] = at(x, r);
      fillHoney(ctx, px, py, size, COLORS.piece, COLORS.pieceGlow);
    }
  }

  if (state.over) drawNotice(ctx, 'Comb full', size);
  else if (state.paused) drawNotice(ctx, 'Paused', size);
}

// Draws the named piece, with a margin, centred on its own canvas.
export function drawNext(ctx, name) {
  const { width, height } = ctx.canvas;
  const centres = SHAPES[name].map(([dx, dr]) => cellCenter(dx, dr, 1));
  const xs = centres.map(({ px }) => px);
  const ys = centres.map(({ py }) => py);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const size = 0.85 * Math.min(width / (maxX - minX + Math.sqrt(3)), height / (maxY - minY + 2));

  fillBackground(ctx);
  for (const { px, py } of centres) {
    fillHoney(
      ctx,
      width / 2 + (px - (minX + maxX) / 2) * size,
      height / 2 + (py - (minY + maxY) / 2) * size,
      size,
      COLORS.piece,
      COLORS.pieceGlow,
    );
  }
}
