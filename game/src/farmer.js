// Farmer Baste: chases at the stage's pace, hurries when he falls far behind, winds up and throws
// carving knives high or low, stops to wolf down any pie Pepper drops, and when the lights go
// out walks the dark with a lantern beam, charging the moment it lands on an unhidden turkey.

import { FARMER, GROUND_Y, TURKEY } from './config.js';

export function createFarmer(turkeyX) {
  return {
    x: turkeyX - FARMER.startGap,
    mode: 'chase',        // chase | windup | eating | search | grab | tripped
    t: 0,
    knifeTimer: 4,
    lane: 'low',
    boost: 0,
    beamAngle: 0.3,
    runPhase: 0,
    alert: 0,             // shows the "!" above his head
    mouthful: 0,
  };
}

export function farmerGap(f, turkey) {
  return turkey.x - f.x;
}

export function startSearch(f, turkey) {
  f.mode = 'search';
  f.t = 0;
  f.x = Math.min(f.x, turkey.x - 1050); // out of lantern range: a moment to find cover
}

export function endSearch(f, turkey, spotted) {
  f.mode = 'chase';
  f.knifeTimer = 3;
  if (!spotted) f.x = Math.min(f.x, turkey.x - 760);
}

export function spotTurkey(f, turkey) {
  f.mode = 'chase';
  f.alert = 1.4;
  f.boost = 0;
  f.x = Math.max(f.x, turkey.x - FARMER.spottedGap);
  f.knifeTimer = 2.5;
}

// The lantern: a cone from his raised hand that sweeps between the floor near him and far ahead.
// While he backtracks he faces the other way, and so does the beam.
export function beamGeometry(f) {
  const back = (f.backTrack ?? 0) > 0;
  const ox = back ? f.x - 52 : f.x + 52;
  const oy = GROUND_Y - 158;
  return { ox, oy, angle: back ? Math.PI - f.beamAngle : f.beamAngle, half: FARMER.beamHalfAngle, length: FARMER.beamLength, back };
}

export function pointInBeam(f, px, py) {
  const b = beamGeometry(f);
  const dx = px - b.ox;
  const dy = py - b.oy;
  const dist = Math.hypot(dx, dy);
  if (dist > b.length || (b.back ? dx >= 0 : dx <= 0)) return false;
  return Math.abs(Math.atan2(dy, dx) - b.angle) < b.half;
}

// One step. `stage` gives the pace; returns events such as {name:'throw', lane}.
// `groundClear` says no hazard is about to need a jump, so a knife that must be ducked is fair.
export function updateFarmer(f, dt, turkey, stage, pies, rng, groundClear = true) {
  const events = [];
  f.t += dt;
  f.alert = Math.max(0, f.alert - dt);
  f.boost = Math.max(0, f.boost - dt);
  f.mouthful = Math.max(0, f.mouthful - dt);
  const gap = farmerGap(f, turkey);

  if (f.mode === 'tripped') {
    f.x += Math.max(0, 200 - f.t * 260) * dt;
    return events;
  }

  if (f.mode === 'grab') {
    f.x += (TURKEY.baseSpeed * 2.2) * dt;
    f.runPhase += dt * 16;
    if (farmerGap(f, turkey) < FARMER.catchGap) events.push({ name: 'caught' });
    return events;
  }

  if (f.mode === 'search') {
    // Standing right beside a hidden turkey for a while, he gives up and wanders back to look elsewhere.
    f.puzzled = gap < 280 ? (f.puzzled ?? 0) + dt : Math.max(0, (f.puzzled ?? 0) - dt * 0.5);
    if (f.puzzled > 1.6) { f.backTrack = 2.4; f.puzzled = 0; events.push({ name: 'farmerGivesUp' }); }
    f.backTrack = Math.max(0, (f.backTrack ?? 0) - dt);
    const walk = f.backTrack > 0 ? -FARMER.searchWalk * 1.2 : gap > 600 ? FARMER.searchHurry : gap < 260 ? 0 : FARMER.searchWalk;
    f.x += walk * dt;
    f.runPhase += walk * dt * 0.03;
    f.beamAngle = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(f.t * 1.7));
    return events;
  }

  if (f.mode === 'eating') {
    if (f.t > FARMER.pieStop) { f.mode = 'chase'; f.t = 0; }
    return events;
  }

  // Chasing (and winding up a throw while still running).
  let speed = TURKEY.baseSpeed * stage.farmerMul;
  if (gap > 640) speed += 60;
  if (f.boost > 0) speed *= 1.3;
  f.x += speed * dt;
  f.runPhase += speed * dt * 0.04;
  if (farmerGap(f, turkey) > FARMER.maxGap) f.x = turkey.x - FARMER.maxGap;

  for (const pie of pies) {
    if (!pie.eaten && pie.landed && f.x + 40 >= pie.x) {
      pie.eaten = true;
      f.mode = 'eating';
      f.t = 0;
      f.mouthful = FARMER.pieStop;
      events.push({ name: 'farmerEats' });
      return events;
    }
  }

  if (f.mode === 'chase') {
    f.knifeTimer -= dt;
    if (f.knifeTimer <= 0 && gap > FARMER.minThrowGap + 40) {
      f.mode = 'windup';
      f.t = 0;
      f.lane = groundClear && rng.next() < 0.5 ? 'high' : 'low';
      events.push({ name: 'windup', lane: f.lane });
    }
  } else if (f.mode === 'windup' && f.t > FARMER.windup * 4) {
    // never found a fair moment: he lowers the knife and tries again soon
    f.mode = 'chase';
    f.t = 0;
    f.knifeTimer = 1.2;
  } else if (f.mode === 'windup' && f.t > FARMER.windup && groundClear && gap > FARMER.minThrowGap) {
    // he holds the throw until the ground ahead is clear, so a knife never lands on top of a jump
    f.mode = 'chase';
    f.t = 0;
    const [a, b] = stage.knifeEvery ?? [6, 8];
    f.knifeTimer = rng.range(a, b);
    events.push({ name: 'throw', lane: f.lane, x: f.x + 40 });
  }

  if (farmerGap(f, turkey) < FARMER.catchGap) events.push({ name: 'caught' });
  return events;
}
