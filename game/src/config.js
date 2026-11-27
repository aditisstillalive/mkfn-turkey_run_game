// Gobble Getaway: every tuning number in one place, so a narrow escape can be made fair by
// changing a value here rather than hunting through the code.

export const VIEW = { w: 1280, h: 720 };
export const GROUND_Y = 604;
export const PX_PER_M = 32;

export const TURKEY = {
  screenX: 500,         // where the camera keeps Pepper on screen
  w: 58,
  h: 74,
  duckH: 40,
  baseSpeed: 330,       // px/s at a plain run
  sprintMul: 1.42,
  slowMul: 0.62,
  sneakSpeed: 235,      // walking speed while the farmer searches
  jumpV: 930,
  flapV: 640,           // the one mid-air flap
  gravity: 2700,
  glideGravity: 980,    // holding jump while falling
  lives: 3,
  invuln: 1.4,
  stun: 0.35,
  staminaDrain: 0.36,   // per second of sprint
  staminaRegen: 0.2,
  coyote: 0.09,         // a jump pressed just after leaving the ground still counts
  jumpBuffer: 0.12,     // a jump pressed just before landing still counts
};

export const FARMER = {
  catchGap: 52,         // px between farmer and turkey that means caught
  startGap: 430,
  maxGap: 960,
  hitLunge: 100,        // how much closer he gets when Pepper stumbles
  pieStop: 1.7,         // seconds he stops to eat a dropped pie
  windup: 0.75,         // seconds of warning before a thrown knife
  knifeSpeed: 760,      // slowest a knife flies
  knifeFlight: 0.85,    // seconds from throw to reaching Pepper
  searchWalk: 150,
  searchHurry: 290,
  beamLength: 760,
  beamHalfAngle: 0.15,
  spottedGap: 300,
};

export const SCORE = {
  perMeter: 1,
  corn: 10,
  closeShave: 40,
  phew: 60,
  slipAway: 300,
  escape: 1500,
  perFeather: 250,
};

export const COLORS = {
  ink: '#2a1a12',
  cream: '#fff3dc',
  pumpkin: '#e8762b',
  rust: '#b5481f',
  gold: '#f2b632',
  cranberry: '#9c1f2e',
  moss: '#5f7a33',
  sky: '#f7c98b',
  danger: '#e53b2c',
};
