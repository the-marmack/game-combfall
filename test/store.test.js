import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createStore } from '../web/js/ui/store.js';

function fakeStorage() {
  const items = new Map();
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
  };
}

const brokenStorage = {
  getItem() {
    throw new Error('refused');
  },
  setItem() {
    throw new Error('refused');
  },
};

test('best score and mute survive a reload', () => {
  const storage = fakeStorage();
  const before = createStore(storage);
  before.saveBest(1200);
  before.setMuted(true);

  const after = createStore(storage);
  assert.equal(after.best(), 1200);
  assert.equal(after.muted(), true);
  assert.equal(storage.items.get('combfall.best'), '1200');
  assert.equal(storage.items.get('combfall.muted'), 'true');

  after.setMuted(false);
  assert.equal(createStore(storage).muted(), false);
});

test('a new store starts with no best and sound on', () => {
  const store = createStore(fakeStorage());
  assert.equal(store.best(), 0);
  assert.equal(store.muted(), false);
});

test('a lower score does not replace the best', () => {
  const store = createStore(fakeStorage());
  store.saveBest(500);
  store.saveBest(300);
  assert.equal(store.best(), 500);
  store.saveBest(700);
  assert.equal(store.best(), 700);
});

test('a saved best that is not a score counts as none', () => {
  for (const saved of ['honey', 'Infinity', '-5']) {
    const storage = fakeStorage();
    storage.setItem('combfall.best', saved);
    assert.equal(createStore(storage).best(), 0, saved);
  }
});

test('a storage that throws is treated as empty', () => {
  const store = createStore(brokenStorage);
  assert.equal(store.best(), 0);
  assert.equal(store.muted(), false);
  assert.doesNotThrow(() => store.saveBest(100));
  assert.doesNotThrow(() => store.setMuted(true));
});
