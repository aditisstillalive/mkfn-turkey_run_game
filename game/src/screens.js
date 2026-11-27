// The menus: the title screen (a live farmyard chase behind the logo, the controls and the best
// score), the pause card, and the end card for CAUGHT or ESCAPED with the run's stats, a rank
// title, a new-record badge and the buttons to run again or go back to the title.

import { VIEW, GROUND_Y, COLORS } from './config.js';
import { drawScenery } from './art/scenery.js';
import { drawTurkey } from './art/turkeyArt.js';
import { drawFarmer, drawKnife } from './art/farmerArt.js';
import { panel, text, FONT } from './hud.js';
import { isMuted } from './audio.js';

const RANKS = [
  [0, 'Leftover Stuffing'],
  [500, 'Nervous Drumstick'],
  [1100, 'Wishbone Wiggler'],
  [1900, 'Feather Flash'],
  [2900, 'Free-Range Legend'],
];

export function rankTitle(score) {
  let title = RANKS[0][1];
  for (const [min, name] of RANKS) if (score >= min) title = name;
  return title;
}

function button(ctx, b, mouse, time) {
  const hover = mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h;
  const lift = hover ? -3 : 0;
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath(); ctx.roundRect(b.x, b.y + 6, b.w, b.h, 16); ctx.fill();
  ctx.fillStyle = b.primary ? (hover ? '#ff8a3a' : COLORS.pumpkin) : (hover ? '#8a5a34' : '#6e4426');
  ctx.beginPath(); ctx.roundRect(b.x, b.y + lift, b.w, b.h, 16); ctx.fill();
  ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 4; ctx.stroke();
  const pulse = b.primary ? 1 + Math.sin(time * 5) * 0.03 : 1;
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2 + 10 + lift);
  ctx.scale(pulse, pulse);
  text(ctx, b.label, 0, 0, b.size ?? 28, COLORS.cream, 'center', 900);
  ctx.restore();
  if (b.hint) text(ctx, b.hint, b.x + b.w / 2, b.y + b.h + 26, 15, '#f2d3a0', 'center', 700);
}

export function hitButton(buttons, mouse) {
  return buttons.find((b) => mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h)?.id ?? null;
}

function logo(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.04);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const wobble = Math.sin(time * 2) * 2;
  ctx.font = `900 118px ${FONT}`;
  ctx.lineWidth = 18; ctx.strokeStyle = '#2a1a12';
  ctx.strokeText('GOBBLE', 0, wobble);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText('GOBBLE', 0, wobble);
  ctx.font = `900 96px ${FONT}`;
  ctx.strokeText('GETAWAY!', 18, 96 - wobble);
  const g = ctx.createLinearGradient(0, 40, 0, 100);
  g.addColorStop(0, '#ff9a3a'); g.addColorStop(1, COLORS.rust);
  ctx.fillStyle = g;
  ctx.fillText('GETAWAY!', 18, 96 - wobble);
  ctx.restore();
}

export const TITLE_BUTTONS = [
  { id: 'start', label: '▶  START THE ESCAPE', x: 430, y: 560, w: 420, h: 72, primary: true, hint: 'ENTER / SPACE / click' },
];

export function drawTitle(ctx, time, mouse, best) {
  const camX = time * 140;
  drawScenery(ctx, 'farm', camX, time);
  ctx.fillStyle = 'rgba(42,26,18,0.18)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // the chase behind the logo: Farmer Baste winding up, a knife in the air, Pepper leaping
  const hop = Math.abs(Math.sin(time * 3)) * 60;
  drawFarmer(ctx, 440, GROUND_Y, { phase: time * 10, mode: 'windup', t: 0.5, scale: 1.2, alert: 1 });
  ctx.save();
  ctx.translate(560 + ((time * 300) % 90), 520);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(-80, -2, 60, 4);
  drawKnife(ctx, 56);
  ctx.restore();
  drawTurkey(ctx, 780, GROUND_Y - 30 - hop, { phase: time * 14, airborne: true, scale: 1.9, expression: 'scared', gliding: hop > 30 });

  logo(ctx, 640, 150, time);
  ctx.font = `800 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 7; ctx.strokeStyle = '#2a1a12';
  const tag = 'Thanksgiving is coming. Run, Pepper, run!';
  ctx.strokeText(tag, 640, 300);
  ctx.fillStyle = COLORS.cream;
  ctx.fillText(tag, 640, 300);

  // how to play
  panel(ctx, 900, 330, 360, 230);
  text(ctx, 'HOW TO ESCAPE', 1080, 362, 22, COLORS.gold, 'center', 900);
  const rows = [
    ['SPACE / W', 'jump, again to flap, hold to glide'],
    ['DOWN / S', 'duck knives & lanterns, hide'],
    ['RIGHT / D', 'sprint (uses stamina)'],
    ['LEFT / A', 'ease off'],
    ['F / CLICK', 'drop a pie: he stops to eat'],
    ['P   M', 'pause   mute'],
  ];
  rows.forEach(([k, v], i) => {
    text(ctx, k, 918, 396 + i * 27, 15, '#ffd36b', 'left', 900);
    text(ctx, v, 1018, 396 + i * 27, 15, COLORS.cream, 'left', 600);
  });

  panel(ctx, 20, 330, 300, 150);
  text(ctx, 'THE ROUTE', 170, 362, 22, COLORS.gold, 'center', 900);
  ['Farmyard', 'Old Barn  (hide!)', 'Farmhouse Kitchen', 'Pantry  (hide!)', 'The Woods = FREEDOM'].forEach((s, i) => {
    text(ctx, `${i + 1}. ${s}`, 40, 390 + i * 19, 15, i === 4 ? '#9fe27a' : COLORS.cream, 'left', 700);
  });

  for (const b of TITLE_BUTTONS) button(ctx, b, mouse, time);
  if (best.score > 0) text(ctx, `BEST ${best.score}   ·   ${best.meters} m   ·   escapes ${best.escapes}`, 640, 690, 18, COLORS.gold, 'center', 800);
  text(ctx, isMuted() ? 'SOUND OFF (M)' : 'SOUND ON (M)', 1260, 700, 13, '#f2d3a0', 'right', 700);
}

export const PAUSE_BUTTONS = [
  { id: 'resume', label: 'RESUME', x: 490, y: 340, w: 300, h: 64, primary: true, hint: 'P / ESC' },
  { id: 'title', label: 'QUIT TO TITLE', x: 490, y: 450, w: 300, h: 56, size: 22, hint: 'T' },
];

export function drawPause(ctx, time, mouse) {
  ctx.fillStyle = 'rgba(20,12,8,0.6)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'PAUSED', 640, 280, 72, COLORS.gold, 'center', 900);
  for (const b of PAUSE_BUTTONS) button(ctx, b, mouse, time);
}

export const END_BUTTONS = [
  { id: 'again', label: '↻  RUN AGAIN', x: 384, y: 584, w: 300, h: 66, primary: true, hint: 'R / ENTER' },
  { id: 'title', label: 'TITLE', x: 704, y: 584, w: 190, h: 66, hint: 'T' },
];

function roastingPan(ctx, x, y, time) {
  ctx.fillStyle = '#6a6a78';
  ctx.beginPath();
  ctx.moveTo(x - 110, y - 40); ctx.lineTo(x + 110, y - 40); ctx.lineTo(x + 90, y); ctx.lineTo(x - 90, y); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a8a98';
  ctx.fillRect(x - 124, y - 46, 248, 10);
  drawTurkey(ctx, x + 6, y - 30, { phase: 0, expression: 'scared', scale: 1.4, airborne: true });
  ctx.fillStyle = '#9fe27a';
  ctx.beginPath(); ctx.arc(x - 70, y - 50, 12, 0, Math.PI * 2); ctx.arc(x + 80, y - 48, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8762b';
  ctx.beginPath(); ctx.arc(x - 90, y - 44, 10, 0, Math.PI * 2); ctx.arc(x + 98, y - 44, 9, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 3; k++) {
    const t = (time * 0.7 + k / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - t)})`;
    ctx.beginPath(); ctx.arc(x - 40 + k * 40, y - 140 - t * 50, 10 + t * 12, 0, Math.PI * 2); ctx.fill();
  }
}

function pictureFrame(ctx, x, y, w, h, stops) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function closeFrame(ctx, x, y, w, h) {
  ctx.restore();
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.stroke();
}

// Escaped: Pepper on a hill at sunset in front of the woods; far behind, the farmer face-down in the mud.
function freedomScene(ctx, x, y, w, h, time) {
  pictureFrame(ctx, x, y, w, h, ['#3b2a5a', '#b5486a', '#f2a65e']);
  ctx.fillStyle = 'rgba(255,214,140,0.95)';
  ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.62, 58, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1f33';
  for (let k = 0; k < 9; k++) {
    const px = x + k * 40 - 10, ph = 110 + (k % 3) * 40;
    ctx.beginPath(); ctx.moveTo(px, y + h - 40); ctx.lineTo(px + 24, y + h - 40 - ph); ctx.lineTo(px + 48, y + h - 40); ctx.fill();
  }
  ctx.fillStyle = '#6e7a34';
  ctx.beginPath(); ctx.ellipse(x + w * 0.55, y + h + 30, w * 0.7, 90, 0, Math.PI, 0); ctx.fill();
  // the farmer, tripped and flat in a puddle, hat rolling away
  ctx.fillStyle = '#5b3a20';
  ctx.beginPath(); ctx.ellipse(x + 80, y + h - 20, 62, 10, 0, 0, Math.PI * 2); ctx.fill();
  drawFarmer(ctx, x + 40, y + h - 30, { mode: 'tripped', t: 1, scale: 0.36 });
  ctx.fillStyle = '#e9c46a';
  ctx.beginPath(); ctx.ellipse(x + 150 + Math.sin(time * 2) * 4, y + h - 24, 14, 5, Math.sin(time * 3) * 0.3, 0, Math.PI * 2); ctx.fill();
  const hop = Math.abs(Math.sin(time * 4)) * 16;
  drawTurkey(ctx, x + w * 0.58, y + h - 50 - hop, { phase: time * 6, expression: 'happy', scale: 1.7, gliding: true, airborne: hop > 2 });
  closeFrame(ctx, x, y, w, h);
}

// Caught: Pepper in the roasting pan on the kitchen table, garnished, with the oven glowing behind.
function caughtScene(ctx, x, y, w, h, time) {
  pictureFrame(ctx, x, y, w, h, ['#f4e2c0', '#e9cf9e']);
  ctx.fillStyle = 'rgba(156,31,46,0.18)';
  for (let k = 0; k < w; k += 40) ctx.fillRect(x + k, y, 14, h);
  ctx.fillStyle = '#2f2f38';
  ctx.fillRect(x + w - 120, y + 40, 110, 140);
  ctx.fillStyle = `rgba(255,120,40,${0.7 + 0.3 * Math.sin(time * 6)})`;
  ctx.fillRect(x + w - 104, y + 70, 78, 80);
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x, y + h - 60, w, 60);
  roastingPan(ctx, x + w * 0.42, y + h - 56, time);
  closeFrame(ctx, x, y, w, h);
}

export function drawEnd(ctx, time, mouse, result, info) {
  ctx.fillStyle = 'rgba(20,12,8,0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const escaped = result.outcome === 'escaped';
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath(); ctx.roundRect(250, 40, 780, 640, 14); ctx.fill();
  panel(ctx, 250, 40, 780, 640);
  ctx.fillStyle = escaped ? 'rgba(159,226,122,0.12)' : 'rgba(229,59,44,0.12)';
  ctx.beginPath(); ctx.roundRect(250, 40, 780, 640, 14); ctx.fill();

  ctx.save();
  ctx.translate(640, 128);
  ctx.rotate(-0.03);
  ctx.font = `900 84px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 14; ctx.strokeStyle = '#2a1a12';
  const title = escaped ? 'ESCAPED!' : 'CAUGHT!';
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = escaped ? '#9fe27a' : COLORS.danger;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  text(ctx, escaped ? 'Pepper vanished into the woods. No turkey on the table this year!' : `Farmer Baste nabbed Pepper in ${result.stageName}.`, 640, 172, 21, COLORS.cream, 'center', 700);

  if (escaped) freedomScene(ctx, 280, 205, 320, 280, time);
  else caughtScene(ctx, 280, 205, 320, 280, time);

  const rows = [
    ['Distance', `${result.meters} m`],
    ['Corn pecked', `${result.corn}`],
    ['Close shaves', `${result.closeShaves}`],
    ['Hid from the light', `${result.phews + result.slips}`],
    ['Feathers left', `${Math.max(0, result.feathers)}`],
    ['Time', `${result.time.toFixed(1)} s`],
  ];
  rows.forEach(([k, v], i) => {
    text(ctx, k, 640, 238 + i * 34, 20, '#f2d3a0', 'left', 700);
    text(ctx, v, 990, 238 + i * 34, 22, COLORS.cream, 'right', 900);
  });
  ctx.fillStyle = 'rgba(242,182,50,0.6)';
  ctx.fillRect(640, 446, 350, 3);
  text(ctx, 'SCORE', 640, 492, 26, COLORS.gold, 'left', 900);
  text(ctx, String(result.score), 990, 494, 40, COLORS.gold, 'right', 900);
  text(ctx, `Rank: ${rankTitle(result.score)}`, 815, 532, 20, COLORS.cream, 'center', 800);
  if (info.newRecord) {
    ctx.save();
    ctx.translate(960, 82);
    ctx.rotate(0.2 + Math.sin(time * 4) * 0.05);
    ctx.fillStyle = COLORS.cranberry;
    ctx.beginPath(); ctx.roundRect(-80, -24, 160, 48, 10); ctx.fill();
    text(ctx, 'NEW BEST!', 0, 9, 24, COLORS.gold, 'center', 900);
    ctx.restore();
  } else text(ctx, `Best: ${info.best.score}`, 815, 560, 16, '#f2d3a0', 'center', 700);
  text(ctx, escaped ? 'Can you escape with every feather?' : 'Tip: drop a pie (F) when he gets close!', 440, 520, 16, '#f2d3a0', 'center', 700);
  for (const b of END_BUTTONS) button(ctx, b, mouse, time);
}
