import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TONES, createSound } from '../web/js/ui/sound.js';

function fakeAudio() {
  const audio = { made: 0, played: [], resumed: 0 };
  audio.factory = () => {
    audio.made += 1;
    return {
      state: 'suspended',
      currentTime: 2,
      destination: {},
      resume() {
        audio.resumed += 1;
      },
      createOscillator: () => ({
        frequency: { value: 0 },
        connect: (node) => node,
        start(at) {
          audio.played.push({ frequency: this.frequency.value, at });
        },
        stop() {},
      }),
      createGain: () => ({
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect: (node) => node,
      }),
    };
  };
  return audio;
}

const press = (input) => input.dispatchEvent(new Event('keydown'));

test('every game event has a tone', () => {
  assert.deepEqual(Object.keys(TONES).sort(), ['level', 'lock', 'over', 'seal']);
  for (const [name, tones] of Object.entries(TONES)) {
    assert.ok(tones.length > 0, name);
    for (const [frequency, milliseconds] of tones) {
      assert.ok(frequency > 0 && milliseconds > 0, name);
    }

    const audio = fakeAudio();
    createSound(audio.factory).play(name);
    assert.deepEqual(
      audio.played.map(({ frequency }) => frequency),
      tones.map(([frequency]) => frequency),
      name,
    );
  }
});

test('the notes of a tone follow one another', () => {
  const audio = fakeAudio();
  createSound(audio.factory).play('seal');
  let at = 2;
  TONES.seal.forEach(([, milliseconds], index) => {
    assert.ok(Math.abs(audio.played[index].at - at) < 1e-9);
    at += milliseconds / 1000;
  });
});

test('no sound plays when muted', () => {
  const audio = fakeAudio();
  const sound = createSound(audio.factory);
  sound.setMuted(true);
  for (const name of Object.keys(TONES)) sound.play(name);
  assert.deepEqual(audio.played, []);

  sound.setMuted(false);
  sound.play('lock');
  assert.equal(audio.played.length, TONES.lock.length);
});

test('audio starts on the first user input', () => {
  const audio = fakeAudio();
  const input = new EventTarget();
  const sound = createSound(audio.factory, input);

  sound.play('lock');
  assert.equal(audio.made, 0);
  assert.deepEqual(audio.played, []);

  press(input);
  assert.equal(audio.made, 1);
  assert.equal(audio.resumed, 1);
  sound.play('lock');
  assert.equal(audio.played.length, TONES.lock.length);

  press(input);
  assert.equal(audio.made, 1);
});
