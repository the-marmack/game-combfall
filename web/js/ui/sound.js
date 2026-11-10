// Each tone is a run of [frequency in hertz, milliseconds], made for Combfall.
export const TONES = {
  lock: [[180, 70]],
  seal: [
    [587, 70],
    [740, 70],
    [988, 130],
  ],
  level: [
    [440, 80],
    [554, 80],
    [659, 80],
    [880, 180],
  ],
  over: [
    [349, 150],
    [277, 150],
    [185, 300],
  ],
};

const VOLUME = 0.2;
const SILENCE = 0.001;
// Browsers allow audio only after one of these. A touch counts when it ends, so its start is not enough.
const STARTING_INPUTS = ['keydown', 'pointerdown', 'pointerup', 'touchend'];

function playNote(context, frequency, at, seconds) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(VOLUME, at);
  envelope.gain.exponentialRampToValueAtTime(SILENCE, at + seconds);
  oscillator.connect(envelope).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + seconds);
}

// Without a page to listen to, as in a test, the audio starts at the first tone.
export function createSound(audioContextFactory, input = globalThis.document) {
  let context = null;
  let muted = false;

  function start() {
    context ??= audioContextFactory();
    if (context.state === 'suspended') context.resume();
  }

  // Capturing, so the audio is up before the same input plays a tone.
  for (const type of input ? STARTING_INPUTS : []) input.addEventListener(type, start, true);

  return {
    play(name) {
      if (muted) return;
      if (!input) start();
      if (context === null) return;
      let at = context.currentTime;
      for (const [frequency, milliseconds] of TONES[name]) {
        playNote(context, frequency, at, milliseconds / 1000);
        at += milliseconds / 1000;
      }
    },
    setMuted(flag) {
      muted = Boolean(flag);
    },
  };
}
