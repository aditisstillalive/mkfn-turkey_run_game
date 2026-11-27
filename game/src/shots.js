// Screenshot scenes, chosen with ?shot=<name>&seed=<n>. Each one plays the real game (the
// autopilot drives Pepper with a fixed time step) until a moment worth showing, then freezes
// there. Nothing is painted on top: what you see is the game's own frame.

import { createRun, updateRun } from './run.js';
import { autopilotControls } from './autopilot.js';
import { hazardHitboxes } from './hazards.js';

const DT = 1 / 120;

function play(run, seconds, until) {
  for (let i = 0; i < seconds / DT; i++) {
    updateRun(run, DT, autopilotControls(run));
    if (until && until(run)) return true;
  }
  return false;
}

const onScreen = (run, x) => x > run.camX + 40 && x < run.camX + 1240;

const SCENES = {
  farm: (seed) => {
    const run = createRun(seed, { startMeters: 40 });
    play(run, 4);
    play(run, 40, (r) => r.knives.some((k) => k.x > r.turkey.x - 260 && k.x < r.turkey.x - 90) && r.farmer.x > r.camX + 20);
    return run;
  },
  barn: (seed) => {
    const run = createRun(seed, { startMeters: 690 });
    play(run, 40, (r) => r.turkey.hidden && r.hiddenBeamTime > 0.05 && r.farmer.x > r.camX - 30 && r.fx.banners.length === 0);
    return run;
  },
  kitchen: (seed) => {
    const run = createRun(seed, { startMeters: 800 });
    play(run, 3);
    play(run, 40, (r) => r.stage.id === 'kitchen' && r.level.hazards.some((h) => h.type === 'oven' && hazardHitboxes(h).length && hazardHitboxes(h)[0].w > 90 && onScreen(r, h.x + h.w + 100) && h.x > r.turkey.x - 200) && r.farmer.x > r.camX - 20);
    return run;
  },
  caught: (seed) => {
    const run = createRun(seed, { startMeters: 900 });
    run.turkey.lives = 1;
    // hands off the controls: Pepper runs straight into the next hazard
    for (let i = 0; i < 60 / DT && run.state !== 'over'; i++) updateRun(run, DT, {});
    return run;
  },
  escaped: (seed) => {
    const run = createRun(seed);
    play(run, 400, (r) => r.state === 'over');
    return run;
  },
};

export function readShot() {
  const q = new URLSearchParams(location.search);
  const name = q.get('shot');
  if (!name) return null;
  return { name, seed: Number(q.get('seed') ?? 1) || 1 };
}

export function buildShotRun(shot) {
  const scene = SCENES[shot.name];
  return scene ? scene(shot.seed) : null;
}
