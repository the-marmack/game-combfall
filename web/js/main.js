import { act, createGame, fallDelay } from './engine/game.js';
import { actionForKey, actionForSwipe } from './ui/input.js';
import { draw, drawNext, fitSize } from './ui/render.js';
import { createSound } from './ui/sound.js';
import { createStore } from './ui/store.js';

// Held down, these would drop piece after piece or flicker the pause.
const NO_REPEAT = new Set(['drop', 'pause']);

const element = (id) => document.getElementById(id);
const combContext = element('comb').getContext('2d');
const nextContext = element('next').getContext('2d');
const cellSize = fitSize(combContext.canvas.width, combContext.canvas.height);

// Goes through localStorage on each call, because even naming it can throw.
const store = createStore({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
const sound = createSound(() => new AudioContext());

let state = createGame();
let best = store.best();
let muted = store.muted();
let fallTimer;

sound.setMuted(muted);

function paint() {
  draw(combContext, state, cellSize);
  drawNext(nextContext, state.next);
  element('score').textContent = String(state.score);
  element('level').textContent = String(state.level);
  element('best').textContent = String(best);
  element('pause').textContent = state.paused ? 'Resume' : 'Pause';
  element('mute').textContent = muted ? 'Unmute' : 'Mute';
}

function apply(action) {
  state = act(state, action);
  for (const event of state.events) sound.play(event.split(':')[0]);
  if (state.score > best) {
    best = state.score;
    store.saveBest(best);
  }
  paint();
}

// Waits one fall at a time, so a new level's speed applies from the next fall.
function armFall() {
  clearTimeout(fallTimer);
  fallTimer = setTimeout(() => {
    apply('fall');
    armFall();
  }, fallDelay(state.level));
}

function restart() {
  apply('restart');
  armFall();
}

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const action = actionForKey(event.key);
  if (action === null) return;
  // Also stops the arrows and the space scrolling the page.
  event.preventDefault();
  if (event.repeat && NO_REPEAT.has(action)) return;
  apply(action);
});

// A space must not also click the button that was pressed last.
document.addEventListener('keyup', (event) => {
  if (event.key === ' ') event.preventDefault();
});

for (const action of ['left', 'right', 'rotate', 'drop', 'pause']) {
  element(action).addEventListener('click', () => apply(action));
}
element('restart').addEventListener('click', restart);
element('mute').addEventListener('click', () => {
  muted = !muted;
  sound.setMuted(muted);
  store.setMuted(muted);
  paint();
});

let swipe = null;
const comb = element('comb');

comb.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' || swipe !== null) return;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

comb.addEventListener('pointerup', (event) => {
  if (swipe === null || event.pointerId !== swipe.id) return;
  const action = actionForSwipe(event.clientX - swipe.x, event.clientY - swipe.y);
  swipe = null;
  apply(action);
});

comb.addEventListener('pointercancel', (event) => {
  if (swipe !== null && event.pointerId === swipe.id) swipe = null;
});

paint();
armFall();
