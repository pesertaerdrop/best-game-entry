// All sound is synthesised with WebAudio: no audio files, no network.
// A soft music loop (plucked melody over a low bass) and one sound per action.
const MELODY = [0, 3, 5, 7, 10, 7, 5, 3]; // minor pentatonic steps
const ROOT = 220; // A3
const STEP_RATIO = Math.pow(2, 1 / 12);

function stepToFreq(step) {
  return ROOT * Math.pow(STEP_RATIO, step);
}

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let beat = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.14;
      musicGain.connect(master);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol, when = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = vol;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
  }

  // The pluck ladder climbs with the combo, so a streak sounds like one.
  function pickup(combo) {
    if (!ensure()) return;
    const step = MELODY[Math.min(combo, MELODY.length - 1)] + 12;
    tone(stepToFreq(step), 0.22, 'sine', 0.5);
    tone(stepToFreq(step + 7), 0.18, 'triangle', 0.22, 0.03);
  }

  function startMusic() {
    if (!ensure() || musicTimer) return;
    musicTimer = window.setInterval(() => {
      if (muted || !ctx) return;
      const step = MELODY[beat % MELODY.length];
      const bass = beat % 4 === 0 ? stepToFreq(-12) : stepToFreq(-5);
      tone(stepToFreq(step + 12), 0.34, 'triangle', 0.5);
      tone(bass, 0.5, 'sine', 0.4);
      beat += 1;
    }, 340);
  }

  function stopMusic() {
    if (musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    unlock() {
      if (ensure()) startMusic();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    get muted() {
      return muted;
    },
    jump() {
      if (!ensure()) return;
      tone(320, 0.16, 'sine', 0.35, 0, 640);
    },
    slide() {
      if (!ensure()) return;
      noise(0.14, 0.18);
    },
    pickup,
    heart() {
      if (!ensure()) return;
      tone(523, 0.16, 'sine', 0.45);
      tone(659, 0.16, 'sine', 0.45, 0.09);
      tone(784, 0.3, 'sine', 0.45, 0.18);
    },
    shield() {
      if (!ensure()) return;
      tone(392, 0.2, 'triangle', 0.4);
      tone(587, 0.26, 'triangle', 0.4, 0.08);
    },
    hit() {
      if (!ensure()) return;
      noise(0.25, 0.5);
      tone(160, 0.3, 'sawtooth', 0.35, 0, 55);
    },
    win() {
      if (!ensure()) return;
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(stepToFreq(s), 0.4, 'triangle', 0.45, i * 0.11));
    },
    lose() {
      if (!ensure()) return;
      [12, 10, 7, 3, 0].forEach((s, i) => tone(stepToFreq(s), 0.42, 'triangle', 0.4, i * 0.16));
    },
    click() {
      if (!ensure()) return;
      tone(660, 0.07, 'square', 0.18);
    },
    stopMusic,
  };
}
