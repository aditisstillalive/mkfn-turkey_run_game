// Lays the course down just ahead of the camera: hazards picked from the current stage's mix,
// corn trails to collect (often arcing over a hazard to reward a jump), pies to drop as decoys,
// hiding spots during a search and the door that ends it, and the woods gate at the very end.

import { GROUND_Y, PX_PER_M } from './config.js';
import { STAGES, COURSE_END_M, stageAt } from './stages.js';
import { makeHazard } from './hazards.js';

export function createLevel(rng) {
  return { rng, nextX: 900, hazards: [], corn: [], pies: [], feathers: [], hides: [], doors: [], spawnedStages: new Set(), gateX: COURSE_END_M * PX_PER_M };
}

function weightedPick(rng, table) {
  const entries = Object.entries(table);
  let total = 0;
  for (const [, w] of entries) total += w;
  let roll = rng.next() * total;
  for (const [type, w] of entries) {
    roll -= w;
    if (roll <= 0) return type;
  }
  return entries[0][0];
}

function addCornArc(level, x, width, peak) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    level.corn.push({ x: x + u * width, y: GROUND_Y - 40 - peak * Math.sin(u * Math.PI), taken: false });
  }
}

function addCornLine(level, x, count, y) {
  for (let i = 0; i < count; i++) level.corn.push({ x: x + i * 46, y, taken: false });
}

function layoutSearch(level, stage) {
  const rng = level.rng;
  const start = stage.from * PX_PER_M;
  const end = stage.to * PX_PER_M;
  let x = start + 150;
  while (x < end - 200) {
    level.hides.push({ type: stage.hide, x, w: stage.hide === 'cupboard' ? 110 : 128, used: false });
    if (rng.chance(0.6)) addCornLine(level, x + 170, 3, GROUND_Y - 30);
    x += rng.range(330, 430);
  }
  level.doors.push({ x: end - 40, theme: stage.theme, stageId: stage.id });
}

// Fill the course up to `untilX` (world px). Difficulty creeps up within each stage too.
export function extendLevel(level, untilX) {
  const rng = level.rng;
  while (level.nextX < untilX && level.nextX < level.gateX - 500) {
    const meters = level.nextX / PX_PER_M;
    const stage = stageAt(meters);
    if (stage.mode === 'search') {
      if (!level.spawnedStages.has(stage.id)) {
        level.spawnedStages.add(stage.id);
        layoutSearch(level, stage);
      }
      level.nextX = stage.to * PX_PER_M + 420;
      continue;
    }
    const stageStartX = stage.from * PX_PER_M;
    if (level.nextX < stageStartX + 300 && stage.from > 0) level.nextX = stageStartX + 300;

    const progress = (meters - stage.from) / (stage.to - stage.from);
    const tighten = 1 - 0.22 * progress;
    const type = weightedPick(rng, stage.hazards);
    const hz = makeHazard(type, level.nextX, rng);
    level.hazards.push(hz);

    // Rewards that pull the player into a choice: corn over a hazard asks for a clean jump.
    if (hz.kind === 'low' && rng.chance(0.55)) addCornArc(level, hz.x - 70, hz.w + 140, 120);
    else if (hz.kind === 'high' && rng.chance(0.5)) addCornLine(level, hz.x - 40, 3, GROUND_Y - 22);
    else if (rng.chance(0.4)) addCornLine(level, hz.x + hz.w + 80, 4, GROUND_Y - 34);

    // A pair now and then: a second hazard close behind the first.
    let gap = rng.range(stage.spacing[0], stage.spacing[1]) * tighten;
    if (type === 'oven') gap += hz.flameLen;
    if (type === 'knifeRack') gap += 60;
    if (progress > 0.35 && rng.chance(0.18) && hz.kind === 'low') {
      const follow = makeHazard(rng.pick(['hay', 'fence', 'crate'].filter((t) => stage.hazards[t]).concat(['pitchfork'])), hz.x + hz.w + 250, rng);
      level.hazards.push(follow);
      gap += 260;
    }
    if (rng.chance(0.09)) level.pies.push({ x: level.nextX + gap * 0.5, y: GROUND_Y - 110, taken: false });
    if (rng.chance(0.035)) level.feathers.push({ x: level.nextX + gap * 0.5, y: GROUND_Y - 150, taken: false });
    level.nextX += gap + hz.w;
  }
}

// Drop everything well behind the camera so long runs stay light.
export function pruneLevel(level, behindX) {
  const keep = (o) => o.x + (o.w ?? 0) > behindX;
  level.hazards = level.hazards.filter(keep);
  level.corn = level.corn.filter((c) => keep(c) && !c.taken);
  level.pies = level.pies.filter((p) => keep(p) && !p.taken);
  level.feathers = level.feathers.filter((p) => keep(p) && !p.taken);
  level.hides = level.hides.filter(keep);
}

export function stageStartX(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  return stage.from * PX_PER_M;
}
