// All sound is synthesised with Web Audio, so the game ships no audio files: a gobble, jumps and
// flaps, knife whooshes, oven roars, crunches and stings, and a plucky barn-dance loop whose
// tempo climbs with each stage and turns hushed and spooky while the farmer searches.

let ac = null;
let master = null;
let musicBus = null;
let muted = false;
let musicTimer = null;
let step = 0;
let nextTime = 0;
let musicStyle = 'chase';
let tempo = 132;

let paused = false;

// Safe to call from any user gesture: creates the context once, resumes it if the browser
// suspended it, and quietly does nothing where Web Audio is missing or blocked.
export function unlockAudio() {
  try {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ac = new Ctx();
  } catch {
    ac = null;
    return;
  }
  master = ac.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(ac.destination);
  musicBus = ac.createGain();
  musicBus.gain.value = 0.32;
  musicBus.connect(master);
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.6;
  return muted;
}

export function isMuted() { return muted; }

// While paused the music stops being scheduled (and resumes in time when play does).
export function setAudioPaused(on) { paused = on; }

function tone(freq, dur, { type = 'square', vol = 0.2, slide = 0, at = 0, bus = master, attack = 0.005 } = {}) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.2, filter = 1200, q = 1, at = 0, type = 'bandpass', bus = master } = {}) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(bus);
  src.start(t);
}

function gobble(at = 0, pitch = 1) {
  for (let i = 0; i < 5; i++) tone((520 - i * 30) * pitch, 0.07, { type: 'sawtooth', vol: 0.12, slide: -160, at: at + i * 0.065 });
}

const SFX = {
  jump: () => tone(380, 0.14, { type: 'triangle', vol: 0.22, slide: 380 }),
  flap: () => { noise(0.12, { vol: 0.25, filter: 900 }); tone(520, 0.1, { type: 'triangle', vol: 0.12, slide: 300 }); },
  land: () => noise(0.06, { vol: 0.12, filter: 300 }),
  hit: () => { noise(0.25, { vol: 0.5, filter: 400 }); gobble(0.05, 1.3); },
  windup: () => tone(900, 0.25, { type: 'sine', vol: 0.12, slide: 600 }),
  throw: () => noise(0.35, { vol: 0.3, filter: 2400, q: 4 }),
  closeShave: () => { tone(880, 0.08, { vol: 0.12 }); tone(1320, 0.12, { vol: 0.12, at: 0.07 }); },
  corn: () => tone(1180 + Math.random() * 200, 0.07, { type: 'triangle', vol: 0.14 }),
  pickup: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.16, at: i * 0.06 })),
  feather: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.16, at: i * 0.07 })),
  pieDrop: () => noise(0.15, { vol: 0.3, filter: 500 }),
  farmerEats: () => { for (let i = 0; i < 5; i++) noise(0.06, { vol: 0.3, filter: 700, at: i * 0.18 }); tone(140, 0.4, { type: 'sawtooth', vol: 0.12, slide: -40, at: 0.9 }); },
  ovenBlast: () => noise(0.9, { vol: 0.35, filter: 260, type: 'lowpass' }),
  knifeDrop: () => tone(1500, 0.18, { type: 'sine', vol: 0.08, slide: -900 }),
  knifeThunk: () => { noise(0.05, { vol: 0.3, filter: 1800 }); tone(220, 0.08, { vol: 0.1 }); },
  slide: () => tone(300, 0.5, { type: 'sine', vol: 0.12, slide: 500 }),
  hide: () => noise(0.25, { vol: 0.25, filter: 1400 }),
  unhide: () => noise(0.12, { vol: 0.15, filter: 1600 }),
  phew: () => tone(700, 0.35, { type: 'sine', vol: 0.12, slide: -300 }),
  slip: () => [392, 523, 659].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.16, at: i * 0.09 })),
  spotted: () => { tone(220, 0.5, { type: 'sawtooth', vol: 0.2 }); tone(233, 0.5, { type: 'sawtooth', vol: 0.2 }); tone(1200, 0.15, { type: 'square', vol: 0.1 }); },
  lightsOut: () => tone(200, 0.6, { type: 'sine', vol: 0.2, slide: -120 }),
  stage: () => gobble(0, 1),
  caught: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, { type: 'sawtooth', vol: 0.16, at: i * 0.22 })),
  escaped: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.18, at: i * 0.1 })); gobble(0.6, 1.1); },
  click: () => tone(660, 0.06, { type: 'triangle', vol: 0.14 }),
  start: () => gobble(0, 0.9),
};

export function playSfx(name) {
  const fn = SFX[name];
  if (!fn || !ac || muted) return;
  try { fn(); } catch { /* a sound is never worth a crash */ }
}

// The music: a little banjo-ish pluck over a bass and a brushed snare, scheduled ahead of time.
const CHASE_MELODY = [0, 4, 7, 9, 7, 4, 2, 4, 0, 4, 7, 12, 9, 7, 4, 2];
const SEARCH_MELODY = [0, -1, 3, -1, 6, -1, 3, -1, 0, -1, 8, -1, 6, -1, 3, -1];
const BASS = [0, 0, 7, 7, 5, 5, 7, 7];

function schedule() {
  if (!ac) return;
  try { scheduleBeats(); } catch { /* keep the game running without music */ }
}

function scheduleBeats() {
  // A throttled or suspended tab lets the clock run ahead: skip the missed beats, never burst them.
  if (nextTime < ac.currentTime) nextTime = ac.currentTime + 0.05;
  if (muted || paused || ac.state !== 'running') return;
  while (nextTime < ac.currentTime + 0.2) {
    const spb = 60 / tempo / 2;
    const at = nextTime - ac.currentTime;
    const search = musicStyle === 'search';
    const quiet = musicStyle === 'menu';
    const root = 196;
    const n = (search ? SEARCH_MELODY : CHASE_MELODY)[step % 16];
    if (n >= 0 && (!quiet || step % 2 === 0)) {
      tone(root * 2 * Math.pow(2, n / 12), search ? 0.3 : 0.16, { type: search ? 'sine' : 'triangle', vol: search ? 0.1 : 0.16, at, bus: musicBus });
    }
    if (step % 2 === 0) tone(root / 2 * Math.pow(2, BASS[(step / 2) % 8] / 12), 0.22, { type: 'square', vol: search ? 0.05 : 0.09, at, bus: musicBus });
    if (!search && !quiet && step % 4 === 2) noise(0.08, { vol: 0.12, filter: 4000, at, bus: musicBus });
    if (search && step % 8 === 0) tone(55, 0.8, { type: 'sine', vol: 0.15, at, bus: musicBus });
    nextTime += spb;
    step += 1;
  }
}

export function setMusic(style, stageIndex = 0) {
  musicStyle = style;
  tempo = style === 'search' ? 92 : style === 'menu' ? 110 : 128 + stageIndex * 8;
  if (!ac || musicTimer) return;
  nextTime = ac.currentTime + 0.05;
  musicTimer = setInterval(schedule, 50);
}
