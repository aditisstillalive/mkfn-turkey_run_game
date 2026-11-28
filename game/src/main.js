// Gobble Getaway: boots the canvas and runs the game's screens (title, play, pause, end) on a
// fixed-step loop, turning keyboard and mouse into Pepper's controls and run events into sound.

import { VIEW } from './config.js';
import { createInput } from './input.js';
import { createRun, updateRun, runResult } from './run.js';
import { stageIndex } from './stages.js';
import { drawRun } from './render.js';
import { drawTitle, drawPause, drawEnd, hitButton, TITLE_BUTTONS, PAUSE_BUTTONS, END_BUTTONS } from './screens.js';
import { unlockAudio, playSfx, setMusic, toggleMute, setAudioPaused } from './audio.js';
import { loadBest, saveBest, recordRun } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

const input = createInput(canvas);
const STEP = 1 / 120;

const game = {
  screen: 'title',      // title | play | paused | end
  run: null,
  best: loadBest(),
  endInfo: null,
  result: null,
  time: 0,
  seed: (Date.now() % 100000) | 0,
};

// Browsers only let sound start inside a user gesture, so unlock on the very first key or click.
window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('keydown', unlockAudio, true);

function setScreen(screen) {
  game.screen = screen;
  setAudioPaused(screen === 'paused');
}

// Switching tabs or windows mid-run pauses it: Pepper is never caught while you look away.
function autoPause() {
  if (game.screen === 'play') { setScreen('paused'); announce('Paused.'); }
}
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });

function announce(message) {
  if (status) status.textContent = message;
}

function startRun() {
  unlockAudio();
  game.seed += 1;
  game.run = createRun(game.seed);
  setScreen('play');
  setMusic('chase', 0);
  playSfx('start');
  announce('Run! Farmer Baste is right behind you.');
}

function endRun() {
  game.result = runResult(game.run);
  const { best, newRecord } = recordRun(game.best, game.result);
  game.best = best;
  saveBest(best);
  game.endInfo = { best, newRecord };
  setScreen('end');
  setMusic('menu');
  announce(game.result.outcome === 'escaped' ? `Escaped! Score ${game.result.score}.` : `Caught! Score ${game.result.score}.`);
}

function goTitle() {
  setScreen('title');
  game.run = null;
  setMusic('menu');
}

function playControls() {
  return {
    left: input.isHeld('left'),
    right: input.isHeld('right'),
    down: input.isHeld('down'),
    jump: input.isHeld('jump'),
    jumpPressed: input.wasPressed('jump'),
    downPressed: input.wasPressed('down'),
    piePressed: input.wasPressed('pie') || input.mouse.clicked,
  };
}

function handleRunEvents(run) {
  for (const e of run.events) {
    playSfx(e.name);
    if (e.name === 'stage' || e.name === 'slip' || e.name === 'spotted') {
      setMusic(run.stage.mode === 'search' && !run.spotted ? 'search' : 'chase', stageIndex(run.stage));
    }
    if (e.name === 'lightsOut') { setMusic('search'); announce('The lights are out. Hide when the lantern swings your way.'); }
    if (e.name === 'spotted') announce('Spotted! Run!');
    if (e.name === 'hit') announce(`Hit! ${run.turkey.lives} feathers left.`);
  }
}

function update(dt) {
  if (game.screen !== 'paused') game.time += dt; // animations hold still while paused
  if (input.wasPressed('mute')) toggleMute();
  const clicked = input.mouse.clicked ? input.mouse : null;

  if (game.screen === 'title') {
    if (input.wasPressed('confirm') || (clicked && hitButton(TITLE_BUTTONS, clicked) === 'start')) { playSfx('click'); startRun(); }
    else if (input.anyPressed()) { unlockAudio(); setMusic('menu'); }
  } else if (game.screen === 'play') {
    if (input.wasPressed('pause')) { setScreen('paused'); playSfx('click'); return; }
    const controls = playControls();
    let acc = dt;
    while (acc > 1e-6) {
      const h = Math.min(STEP, acc);
      updateRun(game.run, h, controls);
      handleRunEvents(game.run);
      controls.jumpPressed = controls.downPressed = controls.piePressed = false;
      acc -= h;
    }
    if (game.run.state === 'over') endRun();
  } else if (game.screen === 'paused') {
    const id = clicked && hitButton(PAUSE_BUTTONS, clicked);
    if (input.wasPressed('pause') || id === 'resume') setScreen('play');
    else if (input.wasPressed('title') || id === 'title') goTitle();
  } else if (game.screen === 'end') {
    const id = clicked && hitButton(END_BUTTONS, clicked);
    if (input.wasPressed('restart') || input.wasPressed('confirm') || id === 'again') { playSfx('click'); startRun(); }
    else if (input.wasPressed('title') || id === 'title') goTitle();
  }
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  if (game.screen === 'title') drawTitle(ctx, game.time, input.mouse, game.best);
  else {
    drawRun(ctx, game.run, game.time);
    if (game.screen === 'paused') drawPause(ctx, game.time, input.mouse);
    if (game.screen === 'end') drawEnd(ctx, game.time, input.mouse, game.result, game.endInfo);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  input.endFrame();
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
