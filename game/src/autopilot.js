// A simple bot that plays Pepper: it jumps low hazards and low knives, ducks lanterns and high
// knives, waits out oven blasts, and hides when the lantern beam swings close. The screenshot
// scenes use it to play real runs of the game, and it doubles as a smoke test of the course.

import { GROUND_Y } from './config.js';
import { runMode } from './run.js';
import { beamGeometry } from './farmer.js';

export function autopilotControls(run) {
  const t = run.turkey;
  const c = { left: false, right: false, down: false, jump: false, jumpPressed: false, downPressed: false, piePressed: false };
  if (run.state !== 'play') return c;

  if (runMode(run) === 'search') {
    // Hide while the farmer is within lantern range; move on when he is far off or backtracking.
    const f = run.farmer;
    const gap = t.x - f.x;
    const safe = (f.backTrack ?? 0) > 0.3 || gap > 900;
    const spot = run.level.hides.find((h) => t.x > h.x && t.x < h.x + h.w);
    if (t.hidden) return safe ? { ...c, right: true } : c;
    if (!safe && spot) return { ...c, down: true, downPressed: true };
    c.right = true;
    return c;
  }

  for (const h of run.level.hazards) {
    const dx = h.x - t.x;
    if (h.type === 'oven') {
      // The flame strip is a hazard only if it will be lit when Pepper gets there: then jump it and glide.
      const zoneStart = h.x + h.w - 10;
      const zoneEnd = zoneStart + h.flameLen;
      if (zoneEnd < t.x - 30 || zoneStart > t.x + 400) continue;
      const v = Math.max(200, t.speed);
      const p = h.t % h.cycle;
      const arrive = Math.max(0, (zoneStart - (t.x + 30)) / v);
      const leave = (zoneEnd - (t.x - 30)) / v;
      const lit = (q) => { const m = q % h.cycle; return m > 2.05 && m < 2.15 + (h.cycle - 2.15) * 0.92; };
      let danger = false;
      for (let s = arrive; s <= leave; s += 0.05) if (lit(p + s)) danger = true;
      const centre = (zoneStart + zoneEnd) / 2 - t.x;
      if (danger && centre > 0 && centre < v * 0.36) c.jumpPressed = true;
      if (t.x > zoneStart - 40 && t.x < zoneEnd + 20 && !t.onGround) c.glide = true;
      continue;
    }
    // take off so the top of the jump lands over the middle of the hazard
    const centre = h.x + h.w / 2 - t.x;
    const closing = t.speed - (h.vx || 0);
    if (h.kind === 'low' && h.x + h.w > t.x - 20 && centre < closing * 0.36 && centre > 0) c.jumpPressed = true;
    if (h.kind === 'high' && dx > -h.w - 50 && dx < 110) c.down = true;
    if (h.type === 'knifeRack') {
      for (const k of h.knives) {
        const kdx = h.x + k.dx - t.x;
        if (k.state === 'stuck' && kdx > 30 && kdx < 90) c.jumpPressed = true;
      }
    }
  }
  for (const k of run.knives) {
    const dx = t.x - k.x;
    if (k.lane === 'high' && dx > -80 && dx < 180) c.down = true;
    if (k.lane === 'low' && dx > 40 && dx < 130) c.jumpPressed = true;
  }
  c.jump = c.jumpPressed || (!t.onGround && (t.vy < 0 || c.glide)); // no gliding: it would carry Pepper onto the next hazard
  if (c.down) c.jumpPressed = false;
  if (!t.onGround) c.down = false;
  if (!c.left && t.stamina > 0.6 && run.farmer.x > t.x - 200) c.right = true;
  return c;
}
