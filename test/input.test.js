import assert from 'node:assert/strict';
import { test } from 'node:test';

import { actionForKey, actionForSwipe } from '../web/js/ui/input.js';

test('keys map to actions', () => {
  assert.equal(actionForKey('ArrowLeft'), 'left');
  assert.equal(actionForKey('ArrowRight'), 'right');
  assert.equal(actionForKey('ArrowUp'), 'rotate');
  assert.equal(actionForKey('ArrowDown'), 'fall');
  assert.equal(actionForKey(' '), 'drop');
  assert.equal(actionForKey('p'), 'pause');
  assert.equal(actionForKey('x'), null);
  // Names on Object.prototype are not keys either.
  assert.equal(actionForKey('constructor'), null);
});

test('swipes map to actions', () => {
  assert.equal(actionForSwipe(-24, 0), 'left');
  assert.equal(actionForSwipe(24, 0), 'right');
  assert.equal(actionForSwipe(0, 48), 'drop');
  assert.equal(actionForSwipe(23, 47), 'rotate');
  assert.equal(actionForSwipe(0, 0), 'rotate');
  // A slanted swipe goes the way it moved most.
  assert.equal(actionForSwipe(30, 60), 'drop');
  assert.equal(actionForSwipe(-60, 50), 'left');
});
