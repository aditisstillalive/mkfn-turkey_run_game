// Pepper the turkey: running speed, jump with one mid-air flap and a glide, ducking, hiding,
// stamina for sprints, and the hurt and invulnerable timers after a stumble.

import { GROUND_Y, TURKEY } from './config.js';

export function createTurkey() {
  return {
    x: 0,                 // world x of Pepper's centre
    y: GROUND_Y,          // feet
    vy: 0,
    speed: TURKEY.baseSpeed,
    onGround: true,
    ducking: false,
    hidden: false,
    canFlap: true,
    gliding: false,
    stamina: 1,
    sprinting: false,
    lives: TURKEY.lives,
    invuln: 0,
    stun: 0,
    sinceGround: 0,
    jumpBuffer: 0,
    surface: null,        // 'mud' | 'gravy' while standing in it
    runPhase: 0,
    squash: 0,
  };
}

export function turkeyHeight(t) {
  if (t.hidden) return 0;
  return t.ducking ? TURKEY.duckH : TURKEY.h;
}

export function turkeyBox(t) {
  const h = turkeyHeight(t);
  const w = t.ducking ? TURKEY.w + 14 : TURKEY.w;
  return { x: t.x - w / 2 + 6, y: t.y - h + 6, w: w - 12, h: h - 8 };
}

// Reads the player's intent and moves Pepper one step. `mode` is 'chase' or 'search'.
// Returns a list of event names ('jump', 'flap', 'land') for sound and effects.
export function updateTurkey(t, dt, controls, mode) {
  const events = [];
  t.invuln = Math.max(0, t.invuln - dt);
  t.stun = Math.max(0, t.stun - dt);
  t.squash = Math.max(0, t.squash - dt * 5);

  if (t.hidden) {
    t.speed = 0;
    t.stamina = Math.min(1, t.stamina + TURKEY.staminaRegen * dt);
    if (controls.jump || controls.right || controls.left) {
      t.hidden = false;
      events.push('unhide');
    }
    return events;
  }

  // Speed: the run keeps going by itself in a chase; in a search Pepper creeps only when told to.
  const wantsSprint = controls.right && t.stamina > 0.02 && t.stun <= 0;
  t.sprinting = wantsSprint && mode === 'chase';
  let target;
  if (mode === 'search') {
    target = controls.right ? TURKEY.sneakSpeed * (controls.sprint ? 1.35 : 1) : controls.left ? -TURKEY.sneakSpeed * 0.55 : 0;
  } else {
    target = TURKEY.baseSpeed * (t.sprinting ? TURKEY.sprintMul : controls.left ? TURKEY.slowMul : 1);
  }
  if (t.stun > 0) target *= 0.65;
  if (t.surface === 'mud' && t.onGround) target *= 0.55;
  if (t.surface === 'gravy' && t.onGround) target = Math.max(target, TURKEY.baseSpeed * 1.5);
  // momentum: little speed change in the air, so a jump lands where it was aimed
  const accel = !t.onGround ? 1.2 : t.surface === 'gravy' ? 1.5 : 7;
  t.speed += (target - t.speed) * Math.min(1, accel * dt);

  if (t.sprinting) t.stamina = Math.max(0, t.stamina - TURKEY.staminaDrain * dt);
  else t.stamina = Math.min(1, t.stamina + TURKEY.staminaRegen * dt);

  // Jumping: buffered presses and a short grace after leaving a ledge keep it forgiving.
  t.jumpBuffer = controls.jumpPressed ? TURKEY.jumpBuffer : Math.max(0, t.jumpBuffer - dt);
  t.sinceGround = t.onGround ? 0 : t.sinceGround + dt;
  t.ducking = controls.down && t.onGround && t.surface !== 'gravy';

  if (t.jumpBuffer > 0) {
    if (t.onGround || t.sinceGround < TURKEY.coyote) {
      t.vy = -TURKEY.jumpV;
      t.onGround = false;
      t.sinceGround = TURKEY.coyote;
      t.jumpBuffer = 0;
      t.ducking = false;
      events.push('jump');
    } else if (t.canFlap && controls.jumpPressed) {
      t.vy = Math.min(t.vy, -TURKEY.flapV);
      t.canFlap = false;
      t.jumpBuffer = 0;
      events.push('flap');
    }
  }

  if (!t.onGround) {
    if (controls.down) t.vy += TURKEY.gravity * 0.9 * dt; // fast-fall
    t.gliding = controls.jump && t.vy > 0;
    t.vy += (t.gliding ? TURKEY.glideGravity : TURKEY.gravity) * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.vy = 0;
      t.onGround = true;
      t.canFlap = true;
      t.gliding = false;
      t.squash = 1;
      events.push('land');
    }
  }

  t.x += t.speed * dt;
  t.runPhase += Math.abs(t.speed) * dt * 0.045;
  return events;
}

export function hurtTurkey(t) {
  t.lives -= 1;
  t.invuln = TURKEY.invuln;
  t.stun = TURKEY.stun;
  t.speed *= 0.7;
}
