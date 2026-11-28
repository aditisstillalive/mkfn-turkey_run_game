// Renders one screenshot scene (tools/shots.js) with the game's own drawing code and holds it,
// then sets window.__shotReady for tools/take-screenshots.mjs. Not part of the shipped game.

import { VIEW } from '../game/src/config.js';
import { runResult } from '../game/src/run.js';
import { drawRun } from '../game/src/render.js';
import { drawTitle, drawEnd } from '../game/src/screens.js';
import { recordRun } from '../game/src/save.js';
import { readShot, buildShotRun } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.w;
canvas.height = VIEW.h;
const mouse = { x: 0, y: 0, clicked: false, down: false };
const shot = readShot() ?? { name: 'title', seed: 1 };

let draw;
if (shot.name === 'title') {
  draw = () => drawTitle(ctx, 1.25, mouse, { score: 0, meters: 0, escapes: 0 });
} else {
  const run = buildShotRun(shot);
  if (run.state === 'over') {
    const result = runResult(run);
    const endInfo = recordRun({ score: 0, meters: 0, escapes: 0 }, result);
    draw = () => { drawRun(ctx, run, run.time); drawEnd(ctx, run.time, mouse, result, endInfo); };
  } else {
    draw = () => drawRun(ctx, run, run.time);
  }
}
draw();
window.__shotReady = true;
