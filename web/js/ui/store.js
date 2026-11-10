const BEST_KEY = 'combfall.best';
const MUTED_KEY = 'combfall.muted';

// Storage can be missing or refused, as in a private window; the game still runs.
export function createStore(storage) {
  function read(key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      storage.setItem(key, String(value));
    } catch {
      // The value then lasts only until the page is closed.
    }
  }

  function best() {
    const saved = Number(read(BEST_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  }

  return {
    best,
    saveBest(score) {
      if (score > best()) write(BEST_KEY, score);
    },
    muted: () => read(MUTED_KEY) === 'true',
    setMuted(flag) {
      write(MUTED_KEY, Boolean(flag));
    },
  };
}
