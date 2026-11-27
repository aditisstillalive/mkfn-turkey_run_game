// The dangers on the course: what each one is, how it moves or fires, and the boxes that hurt.
// Static ones (fences, hay, crates) are jumped; lanterns are ducked; ovens blast flame on a
// glowing cycle; knife racks drop carving knives as Pepper nears; mud and gravy change footing.

import { GROUND_Y, FARMER } from './config.js';

const SPECS = {
  fence: { w: 40, h: 74, kind: 'low' },
  hay: { w: 100, h: 60, kind: 'low' },
  crate: { w: 74, h: 74, kind: 'low' },
  pumpkin: { w: 60, h: 56, kind: 'low', roll: -130 },
  pitchfork: { w: 84, h: 36, kind: 'low' },
  pot: { w: 70, h: 54, kind: 'low' },
  rollingPin: { w: 76, h: 28, kind: 'low', roll: -210 },
  lantern: { w: 44, h: 96, kind: 'high', top: GROUND_Y - 160 },
  oven: { w: 150, h: 150, kind: 'oven' },
  knifeRack: { w: 230, h: 40, kind: 'rack' },
  mud: { w: 190, h: 14, kind: 'surface' },
  gravy: { w: 220, h: 12, kind: 'surface' },
};

export function hazardKinds() {
  return Object.keys(SPECS);
}

export function makeHazard(type, x, rng) {
  const spec = SPECS[type];
  const h = { type, x, w: spec.w, h: spec.h, kind: spec.kind, vx: spec.roll ?? 0, t: 0, hit: false, passed: false, clearance: Infinity, spin: 0 };
  if (type === 'oven') {
    h.cycle = 3.1;
    h.t = rng.range(0, h.cycle);
    h.flameLen = 160;
  }
  if (type === 'knifeRack') {
    h.knives = [0, 1, 2].map((i) => ({ dx: 60 + i * 55, state: 'hang', t: 0, y: 140 }));
    h.armed = false;
  }
  return h;
}

// Oven phases: 'cool' then 'glow' (a warning) then 'blast'. The flame fills the floor ahead of the door.
export function ovenPhase(h) {
  const p = h.t % h.cycle;
  if (p < 1.35) return { phase: 'cool', k: p / 1.35 };
  if (p < 2.15) return { phase: 'glow', k: (p - 1.35) / 0.8 };
  return { phase: 'blast', k: (p - 2.15) / (h.cycle - 2.15) };
}

export function updateHazard(h, dt, turkeyX, events) {
  h.t += dt;
  if (h.vx && h.x - turkeyX < 760) {
    h.x += h.vx * dt;
    h.spin += h.vx * dt / 30;
  }
  if (h.type === 'oven') {
    const before = h.prevPhase;
    h.prevPhase = ovenPhase(h).phase;
    if (before !== 'blast' && h.prevPhase === 'blast' && Math.abs(h.x - turkeyX) < 900) events.push({ name: 'ovenBlast', x: h.x });
  }
  if (h.type === 'knifeRack') {
    if (!h.armed && turkeyX > h.x - 560) {
      h.armed = true;
      h.knives.forEach((k, i) => { k.state = 'shake'; k.t = -i * 0.08; });
    }
    for (const k of h.knives) {
      k.t += dt;
      if (k.state === 'shake' && k.t > 0.55) { k.state = 'fall'; k.vy = 300; events.push({ name: 'knifeDrop', x: h.x + k.dx }); }
      if (k.state === 'fall') {
        k.vy += 4200 * dt;
        k.y += k.vy * dt;
        if (k.y >= GROUND_Y - 4) { k.y = GROUND_Y - 4; k.state = 'stuck'; events.push({ name: 'knifeThunk', x: h.x + k.dx }); }
      }
    }
  }
}

// The boxes that hurt Pepper this frame, in world coordinates.
export function hazardHitboxes(h) {
  switch (h.type) {
    case 'mud':
    case 'gravy':
      return [];
    case 'lantern':
      return [{ x: h.x + 4, y: SPECS.lantern.top, w: h.w - 8, h: GROUND_Y - 52 - SPECS.lantern.top }];
    case 'oven': {
      const { phase, k } = ovenPhase(h);
      if (phase !== 'blast' || k > 0.92) return [];
      return [{ x: h.x + h.w - 4, y: GROUND_Y - 44, w: (h.flameLen - 12) * Math.min(1, k * 6), h: 44 }];
    }
    case 'knifeRack':
      return h.knives.filter((k) => k.state === 'fall' || k.state === 'stuck').map((k) => (
        k.state === 'fall'
          ? { x: h.x + k.dx - 7, y: k.y - 70, w: 14, h: 70 }
          : { x: h.x + k.dx - 9, y: GROUND_Y - 44, w: 18, h: 44 }
      ));
    case 'pumpkin':
      return [{ x: h.x + 6, y: GROUND_Y - h.h + 8, w: h.w - 12, h: h.h - 8 }];
    case 'fence':
      return [{ x: h.x + 4, y: GROUND_Y - h.h + 4, w: h.w - 8, h: h.h - 4 }];
    default:
      return [{ x: h.x + 6, y: GROUND_Y - h.h + 6, w: h.w - 12, h: h.h - 6 }];
  }
}

// A carving knife the farmer throws from behind: low ones are jumped, high ones are ducked.
// It always reaches Pepper about the same time after the throw, so the warning is a fixed rhythm.
export function makeThrownKnife(x, lane, turkeyX, turkeySpeed) {
  const vx = turkeySpeed + Math.max(FARMER.knifeSpeed - 330, (turkeyX - x) / FARMER.knifeFlight);
  return { x, lane, y: lane === 'high' ? GROUND_Y - 62 : GROUND_Y - 20, vx, spin: 0, hit: false, passed: false };
}

export function thrownKnifeBox(k) {
  return { x: k.x - 30, y: k.y - 6, w: 60, h: 12 };
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
