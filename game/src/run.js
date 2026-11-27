// One escape attempt from the farmyard to the woods: ties Pepper, Farmer Baste, the course and
// the effects together, scores the run, and decides when it ends caught or escaped.

import { FARMER, GROUND_Y, PX_PER_M, SCORE, TURKEY } from './config.js';
import { makeRng } from './rng.js';
import { STAGES, COURSE_END_M, stageAt } from './stages.js';
import { createLevel, extendLevel, pruneLevel } from './level.js';
import { createTurkey, updateTurkey, hurtTurkey, turkeyBox } from './turkey.js';
import { createFarmer, updateFarmer, farmerGap, startSearch, endSearch, spotTurkey, pointInBeam } from './farmer.js';
import { updateHazard, hazardHitboxes, makeThrownKnife, thrownKnifeBox, overlaps } from './hazards.js';
import { createEffects, updateEffects, burst, floatText, banner, shake, flash } from './effects.js';

export function createRun(seed, { startMeters = 0 } = {}) {
  const rng = makeRng(seed);
  const turkey = createTurkey();
  turkey.x = startMeters * PX_PER_M + 200;
  const level = createLevel(rng);
  level.nextX = turkey.x + 700;
  const run = {
    seed, rng, level, turkey,
    farmer: createFarmer(turkey.x),
    fx: createEffects(seed + 11),
    knives: [],
    droppedPies: [],
    time: 0,
    camX: turkey.x - TURKEY.screenX,
    stage: stageAt(startMeters),
    spotted: false,
    hiddenBeamTime: 0,
    pies: 1,
    stats: { corn: 0, closeShaves: 0, phews: 0, slips: 0, hits: 0, bonus: 0 },
    state: 'play',        // play | ending | over
    outcome: null,        // 'caught' | 'escaped'
    endT: 0,
    events: [],
  };
  if (run.stage.mode === 'search') startSearch(run.farmer, turkey);
  banner(run.fx, run.stage.name, run.stage.tip, '#f2b632', 3);
  extendLevel(level, turkey.x + 2200);
  return run;
}

export function runMeters(run) {
  return Math.max(0, Math.floor(run.turkey.x / PX_PER_M));
}

export function runScore(run) {
  return Math.min(runMeters(run), COURSE_END_M) * SCORE.perMeter + run.stats.bonus;
}

export function runMode(run) {
  return run.stage.mode === 'search' && !run.spotted ? 'search' : 'chase';
}

export function stageProgress(run) {
  return Math.min(1, run.turkey.x / PX_PER_M / COURSE_END_M);
}

function addBonus(run, points, text, color, x, y) {
  run.stats.bonus += points;
  floatText(run.fx, `${text} +${points}`, x, y, color);
}

function emit(run, name, data = {}) {
  run.events.push({ name, ...data });
}

function enterStage(run, next) {
  const prev = run.stage;
  run.stage = next;
  if (prev.mode === 'search') {
    if (!run.spotted) {
      run.stats.slips += 1;
      addBonus(run, SCORE.slipAway, 'Slipped away!', '#9fe27a', run.turkey.x, GROUND_Y - 150);
      emit(run, 'slip');
    }
    endSearch(run.farmer, run.turkey, run.spotted);
  }
  run.spotted = false;
  if (next.mode === 'search') {
    startSearch(run.farmer, run.turkey);
    emit(run, 'lightsOut');
  }
  banner(run.fx, next.name, next.tip, next.mode === 'search' ? '#8fc8ff' : '#f2b632', 3);
  emit(run, 'stage', { stage: next.id });
}

function finish(run, outcome) {
  if (run.state !== 'play') return;
  run.state = 'ending';
  run.outcome = outcome;
  run.endT = 0;
  if (outcome === 'escaped') {
    run.stats.bonus += SCORE.escape + run.turkey.lives * SCORE.perFeather;
    run.farmer.mode = 'tripped';
    run.farmer.t = 0;
    banner(run.fx, 'ESCAPED!', 'Pepper is a free bird!', '#9fe27a', 3);
    emit(run, 'escaped');
  } else {
    banner(run.fx, 'CAUGHT!', 'Into the roasting pan...', '#e53b2c', 3);
    shake(run.fx, 18);
    flash(run.fx, '#e53b2c', 0.6);
    emit(run, 'caught');
  }
}

function hitTurkey(run, what) {
  const t = run.turkey;
  if (t.invuln > 0 || run.state !== 'play') return;
  hurtTurkey(t);
  run.stats.hits += 1;
  if (what !== 'spotted') run.farmer.x = Math.min(run.farmer.x + FARMER.hitLunge, t.x - FARMER.catchGap - 4);
  burst(run.fx, 'feather', t.x, t.y - 40, 14);
  shake(run.fx, 12);
  flash(run.fx, '#ff5a3c', 0.35);
  floatText(run.fx, what === 'knife' ? 'Yikes! A knife!' : what === 'flame' ? 'Ow, hot hot hot!' : what === 'spotted' ? 'He grabbed a feather!' : 'Ouch!', t.x, t.y - 110, '#ffb199');
  emit(run, 'hit', { what });
  if (t.lives <= 0) {
    run.farmer.mode = 'grab';
    banner(run.fx, 'OUT OF FEATHERS!', 'Farmer Baste lunges...', '#e53b2c', 2);
  }
}

function checkHazards(run, dt, box) {
  const t = run.turkey;
  t.surface = null;
  const evs = [];
  for (const h of run.level.hazards) {
    updateHazard(h, dt, t.x, evs);
    if (h.kind === 'surface') {
      if (t.x > h.x && t.x < h.x + h.w) t.surface = h.type;
      if (t.surface === 'gravy' && !h.passed && t.onGround) { h.passed = true; floatText(run.fx, 'Wheee!', t.x, t.y - 100, '#ffe9b0'); emit(run, 'slide'); }
      continue;
    }
    if (h.hit || t.hidden) continue;
    for (const hb of hazardHitboxes(h)) {
      if (overlaps(box, hb)) {
        h.hit = true;
        hitTurkey(run, h.type === 'oven' ? 'flame' : h.type === 'knifeRack' ? 'knife' : h.type);
        break;
      }
      if (box.x < hb.x + hb.w && box.x + box.w > hb.x) {
        const clear = hb.y >= box.y + box.h ? hb.y - (box.y + box.h) : box.y - (hb.y + hb.h);
        h.clearance = Math.min(h.clearance, Math.max(0, clear));
      }
    }
    if (!h.passed && h.x + h.w < box.x) {
      h.passed = true;
      if (!h.hit && h.clearance < 16) {
        run.stats.closeShaves += 1;
        addBonus(run, SCORE.closeShave, 'Close shave!', '#ffd36b', t.x, t.y - 120);
        emit(run, 'closeShave');
      }
    }
  }
  for (const e of evs) {
    if (e.name === 'ovenBlast') burst(run.fx, 'spark', e.x + 150, GROUND_Y - 30, 10);
    if (e.name === 'knifeThunk') burst(run.fx, 'dust', e.x, GROUND_Y - 4, 4);
    emit(run, e.name);
  }
}

function updateKnives(run, dt, box) {
  const t = run.turkey;
  for (const k of run.knives) {
    k.x += k.vx * dt;
    k.spin += dt * 14;
    if (k.hit || t.hidden) continue;
    const kb = thrownKnifeBox(k);
    if (overlaps(box, kb)) {
      k.hit = true;
      hitTurkey(run, 'knife');
    } else if (!k.passed && kb.x > box.x + box.w) {
      k.passed = true;
      const clear = k.lane === 'high' ? kb.y - (box.y + 0) : box.y + box.h - kb.y;
      if (Math.abs(clear) < 40 || (k.lane === 'high' && t.ducking)) {
        run.stats.closeShaves += 1;
        addBonus(run, SCORE.closeShave, 'Close shave!', '#ffd36b', t.x, t.y - 120);
        emit(run, 'closeShave');
      }
    }
  }
  run.knives = run.knives.filter((k) => k.x < t.x + 1400 && !k.hit);
}

function collectPickups(run) {
  const t = run.turkey;
  const cx = t.x;
  const cy = t.y - (t.ducking ? 20 : 38);
  for (const c of run.level.corn) {
    if (!c.taken && Math.abs(c.x - cx) < 38 && Math.abs(c.y - cy) < 50) {
      c.taken = true;
      run.stats.corn += 1;
      run.stats.bonus += SCORE.corn;
      burst(run.fx, 'spark', c.x, c.y, 4);
      emit(run, 'corn');
    }
  }
  for (const p of run.level.pies) {
    if (!p.taken && Math.abs(p.x - cx) < 48 && Math.abs(p.y - cy) < 70) {
      p.taken = true;
      run.pies = Math.min(3, run.pies + 1);
      floatText(run.fx, 'Pumpkin pie! (F / click to drop)', p.x, p.y - 30, '#ffd36b', 20);
      emit(run, 'pickup');
    }
  }
  for (const f of run.level.feathers) {
    if (!f.taken && Math.abs(f.x - cx) < 48 && Math.abs(f.y - cy) < 80) {
      f.taken = true;
      t.lives = Math.min(5, t.lives + 1);
      floatText(run.fx, 'Lucky feather! +1 life', f.x, f.y - 30, '#9fe27a', 22);
      emit(run, 'feather');
    }
  }
}

function updateSearch(run, dt) {
  const t = run.turkey;
  if (runMode(run) !== 'search') return;
  const inBeam = pointInBeam(run.farmer, t.x, t.y - 36) || pointInBeam(run.farmer, t.x, t.y - 6);
  if (inBeam && !t.hidden) {
    run.spotted = true;
    spotTurkey(run.farmer, t);
    hitTurkey(run, 'spotted');
    banner(run.fx, 'SPOTTED!', 'Run for it!', '#e53b2c', 1.8);
    shake(run.fx, 10);
    flash(run.fx, '#fff1b0', 0.4);
    emit(run, 'spotted');
    return;
  }
  if (inBeam && t.hidden) run.hiddenBeamTime += dt;
  else if (run.hiddenBeamTime > 0.15 && !run.phewSpot?.phewed) {
    if (run.phewSpot) run.phewSpot.phewed = true;
    run.hiddenBeamTime = 0;
    run.stats.phews += 1;
    addBonus(run, SCORE.phew, 'Phew!', '#8fc8ff', t.x, t.y - 110);
    emit(run, 'phew');
  } else run.hiddenBeamTime = 0;
}

function tryHide(run, controls) {
  const t = run.turkey;
  if (!controls.downPressed || t.hidden || !t.onGround || run.stage.mode !== 'search') return;
  const spot = run.level.hides.find((h) => t.x > h.x - 10 && t.x < h.x + h.w + 10);
  if (spot) {
    t.hidden = true;
    t.x = spot.x + spot.w / 2;
    t.speed = 0;
    spot.used = true;
    run.phewSpot = spot;
    emit(run, 'hide');
  }
}

function dropPie(run) {
  const t = run.turkey;
  if (run.pies <= 0 || t.hidden) return;
  run.pies -= 1;
  run.droppedPies.push({ x: t.x - 40, y: t.y - 50, vy: -260, landed: false, eaten: false });
  floatText(run.fx, 'Pie decoy!', t.x - 40, t.y - 100, '#ffd36b', 22);
  emit(run, 'pieDrop');
}

function updatePies(run, dt) {
  for (const p of run.droppedPies) {
    if (p.landed) continue;
    p.vy += 1800 * dt;
    p.y += p.vy * dt;
    p.x -= 60 * dt;
    if (p.y >= GROUND_Y - 6) { p.y = GROUND_Y - 6; p.landed = true; }
  }
  run.droppedPies = run.droppedPies.filter((p) => !p.eaten || run.farmer.mode === 'eating');
}

function updateCamera(run, dt) {
  const t = run.turkey;
  // In a search the camera pulls back so both the farmer's lantern and Pepper are in view.
  const target = runMode(run) === 'search'
    ? Math.max(t.x - 1000, Math.min(t.x - 560, (run.farmer.x + t.x) / 2 - 600))
    : t.x - TURKEY.screenX;
  run.camX += (target - run.camX) * Math.min(1, dt * (runMode(run) === 'search' ? 2.2 : 9));
}

// controls: { left, right, down, jump, jumpPressed, downPressed, piePressed }
export function updateRun(run, dt, controls) {
  run.events.length = 0;
  run.time += dt;
  updateEffects(run.fx, dt);
  const t = run.turkey;
  const f = run.farmer;

  if (run.state !== 'play') {
    run.endT += dt;
    if (run.outcome === 'escaped') {
      t.speed = TURKEY.baseSpeed * 1.2;
      updateTurkey(t, dt, { right: false, jump: run.endT < 0.1, jumpPressed: run.endT < 0.02 }, 'chase');
      updateFarmer(f, dt, t, run.stage, run.droppedPies, run.rng);
    }
    updateCamera(run, dt);
    if (run.endT > 2.2) run.state = 'over';
    return;
  }

  tryHide(run, controls);
  if (controls.piePressed) dropPie(run);
  for (const e of updateTurkey(t, dt, controls, runMode(run))) emit(run, e);
  if (t.onGround && Math.abs(t.speed) > 200 && run.rng.chance(dt * 8)) burst(run.fx, 'dust', t.x - 24, t.y - 4, 1);

  const next = stageAt(t.x / PX_PER_M);
  if (next !== run.stage) enterStage(run, next);

  extendLevel(run.level, t.x + 2200);
  pruneLevel(run.level, run.camX - 600);

  const box = turkeyBox(t);
  checkHazards(run, dt, box);
  updateKnives(run, dt, box);
  collectPickups(run);
  updatePies(run, dt);

  const chaseStage = run.stage.mode === 'search' ? { farmerMul: 1.08, knifeEvery: [4, 6] } : run.stage;
  const groundClear = t.onGround && !run.level.hazards.some((h) => (h.kind === 'low' || h.kind === 'high' || h.kind === 'oven' || h.kind === 'rack') && h.x + h.w + (h.flameLen ?? 0) > t.x - 140 && h.x < t.x + 700);
  for (const e of updateFarmer(f, dt, t, chaseStage, run.droppedPies, run.rng, groundClear)) {
    if (e.name === 'throw') run.knives.push(makeThrownKnife(e.x, e.lane, t.x, Math.max(t.speed, 200)));
    if (e.name === 'caught') { finish(run, 'caught'); break; }
    if (e.name === 'farmerGivesUp') floatText(run.fx, 'Hmm... where\'d that bird go?', f.x + 40, GROUND_Y - 250, '#fff3dc', 22);
    emit(run, e.name, e);
  }
  updateSearch(run, dt);

  if (t.x >= run.level.gateX + 60) finish(run, 'escaped');
  updateCamera(run, dt);
}

export function runResult(run) {
  return {
    outcome: run.outcome,
    score: runScore(run),
    meters: Math.min(runMeters(run), COURSE_END_M),
    stageName: run.stage.name,
    feathers: run.turkey.lives,
    time: run.time,
    ...run.stats,
  };
}

export function farmerDistanceMeters(run) {
  return Math.max(0, (farmerGap(run.farmer, run.turkey) - FARMER.catchGap) / PX_PER_M);
}

export { STAGES };
