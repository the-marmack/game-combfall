const KEYS = new Map([
  ['ArrowLeft', 'left'],
  ['ArrowRight', 'right'],
  ['ArrowUp', 'rotate'],
  ['ArrowDown', 'fall'],
  [' ', 'drop'],
  ['p', 'pause'],
]);

const SIDEWAYS_SWIPE = 24;
const DOWNWARD_SWIPE = 48;

export function actionForKey(key) {
  return KEYS.get(key) ?? null;
}

// A swipe far enough both ways counts as the way it moved most.
export function actionForSwipe(dx, dy) {
  if (dy >= DOWNWARD_SWIPE && dy > Math.abs(dx)) return 'drop';
  if (Math.abs(dx) >= SIDEWAYS_SWIPE) return dx < 0 ? 'left' : 'right';
  return 'rotate';
}
