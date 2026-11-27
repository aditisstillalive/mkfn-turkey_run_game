// Everything Pepper meets on the course, drawn in screen space: fences, hay, crates, rolling
// pumpkins, pitchforks, lanterns, hot pots, rolling pins, ovens with their flame jets, knife
// racks, mud and gravy, corn, pies, lucky feathers, hiding spots, doors and the woods gate.

import { GROUND_Y } from '../config.js';
import { ovenPhase } from '../hazards.js';
import { drawKnife } from './farmerArt.js';

const G = GROUND_Y;

function fence(ctx, x, h) {
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x + 2, G - h.h, 12, h.h);
  ctx.fillRect(x + h.w - 14, G - h.h, 12, h.h);
  ctx.fillStyle = '#a8703f';
  ctx.fillRect(x - 6, G - h.h + 12, h.w + 12, 10);
  ctx.fillRect(x - 6, G - h.h + 40, h.w + 12, 10);
  ctx.fillStyle = '#6e4426';
  ctx.beginPath(); ctx.moveTo(x + 2, G - h.h); ctx.lineTo(x + 8, G - h.h - 8); ctx.lineTo(x + 14, G - h.h); ctx.fill();
}

function hay(ctx, x, h) {
  ctx.fillStyle = '#e2b84e';
  ctx.beginPath();
  ctx.roundRect(x, G - h.h, h.w, h.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#b48a30'; ctx.lineWidth = 2;
  for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 6, G - h.h + k * 12); ctx.lineTo(x + h.w - 6, G - h.h + k * 12 + 2); ctx.stroke(); }
  ctx.fillStyle = '#9c1f2e';
  ctx.fillRect(x + 22, G - h.h, 6, h.h); ctx.fillRect(x + h.w - 28, G - h.h, 6, h.h);
}

function crate(ctx, x, h) {
  ctx.fillStyle = '#b07a44';
  ctx.fillRect(x, G - h.h, h.w, h.h);
  ctx.strokeStyle = '#6e4426'; ctx.lineWidth = 6;
  ctx.strokeRect(x + 3, G - h.h + 3, h.w - 6, h.h - 6);
  ctx.beginPath(); ctx.moveTo(x + 4, G - h.h + 4); ctx.lineTo(x + h.w - 4, G - 4); ctx.stroke();
  ctx.fillStyle = '#6e4426';
  ctx.font = '700 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('FEED', x + h.w / 2, G - h.h / 2 + 18);
}

function pumpkin(ctx, x, h) {
  const cx = x + h.w / 2, cy = G - h.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(h.spin);
  ctx.fillStyle = '#e8762b';
  for (const dx of [-14, 14, 0]) { ctx.beginPath(); ctx.ellipse(dx, 0, 18, h.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#b5481f'; ctx.lineWidth = 2;
  for (const dx of [-12, 12]) { ctx.beginPath(); ctx.ellipse(dx, 0, 8, h.h / 2 - 2, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#4a6a24';
  ctx.fillRect(-3, -h.h / 2 - 9, 6, 11);
  ctx.restore();
}

function pitchfork(ctx, x, h) {
  ctx.fillStyle = '#8a5a34';
  ctx.save();
  ctx.translate(x, G - 4);
  ctx.rotate(-0.12);
  ctx.fillRect(0, -6, h.w - 20, 6);
  ctx.restore();
  ctx.fillStyle = '#9aa4ae';
  ctx.fillRect(x + h.w - 30, G - 14, 28, 5);
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(x + h.w - 30 + k * 9, G - 12);
    ctx.lineTo(x + h.w - 27 + k * 9, G - h.h);
    ctx.lineTo(x + h.w - 24 + k * 9, G - 12);
    ctx.fill();
  }
}

function lantern(ctx, x, h, time) {
  const top = G - 160;
  ctx.strokeStyle = '#3b2416'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + h.w / 2, 0); ctx.lineTo(x + h.w / 2, top + 6); ctx.stroke();
  const swingX = Math.sin(time * 2 + x) * 3;
  ctx.save();
  ctx.translate(x + swingX, 0);
  ctx.fillStyle = 'rgba(255,214,120,0.18)';
  ctx.beginPath(); ctx.arc(h.w / 2, top + 60, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(2, top + 6, h.w - 4, 14);
  ctx.fillRect(2, G - 66, h.w - 4, 14);
  ctx.fillStyle = '#ffd36b';
  ctx.fillRect(6, top + 20, h.w - 12, G - 86 - top);
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(h.w / 2, top + 20); ctx.lineTo(h.w / 2, G - 66); ctx.stroke();
  ctx.fillStyle = '#ff9a2a';
  ctx.beginPath(); ctx.ellipse(h.w / 2, G - 100, 6, 12 + Math.sin(time * 12) * 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function pot(ctx, x, h, time) {
  ctx.fillStyle = '#3a3a44';
  ctx.beginPath(); ctx.roundRect(x, G - h.h, h.w, h.h, 8); ctx.fill();
  ctx.fillStyle = '#55556a';
  ctx.fillRect(x - 6, G - h.h, h.w + 12, 9);
  ctx.fillRect(x - 14, G - h.h + 14, 14, 6); ctx.fillRect(x + h.w, G - h.h + 14, 14, 6);
  ctx.fillStyle = '#ff7a2a';
  ctx.fillRect(x + 8, G - 8, h.w - 16, 4);
  for (let k = 0; k < 3; k++) {
    const t = (time * 0.8 + k / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
    ctx.beginPath(); ctx.arc(x + 16 + k * 18 + Math.sin(t * 6 + k) * 5, G - h.h - 10 - t * 60, 8 + t * 10, 0, Math.PI * 2); ctx.fill();
  }
}

function rollingPin(ctx, x, h) {
  const cy = G - h.h / 2;
  ctx.fillStyle = '#d9a86a';
  ctx.beginPath(); ctx.roundRect(x + 12, cy - 13, h.w - 24, 26, 10); ctx.fill();
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x, cy - 5, 14, 10); ctx.fillRect(x + h.w - 14, cy - 5, 14, 10);
  ctx.strokeStyle = 'rgba(120,70,30,0.5)'; ctx.lineWidth = 2;
  const off = (h.spin * 8) % 12;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 20 + k * 12 + off, cy - 12); ctx.lineTo(x + 20 + k * 12 + off, cy + 12); ctx.stroke(); }
}

function oven(ctx, x, h, time) {
  const { phase, k } = ovenPhase(h);
  const top = G - h.h;
  ctx.fillStyle = '#2f2f38';
  ctx.beginPath(); ctx.roundRect(x, top, h.w, h.h, 10); ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x, top, h.w, 26);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#e9dcc4';
    ctx.beginPath(); ctx.arc(x + 24 + i * 34, top + 13, 7, 0, Math.PI * 2); ctx.fill();
  }
  // door window: glows hotter through the warning, wide open in the blast
  const heat = phase === 'cool' ? 0.15 : phase === 'glow' ? 0.35 + 0.65 * k : 1;
  ctx.fillStyle = '#1b1b22';
  ctx.fillRect(x + 16, top + 40, h.w - 32, h.h - 58);
  ctx.fillStyle = `rgba(255,${Math.floor(150 - heat * 80)},40,${heat})`;
  ctx.fillRect(x + 26, top + 50, h.w - 52, h.h - 78);
  ctx.fillStyle = '#b9b2a2';
  ctx.fillRect(x + 26, top + 34, h.w - 52, 6);
  if (phase === 'glow') {
    ctx.fillStyle = '#ffd36b';
    ctx.font = '900 30px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = '#2a1a12';
    const blink = Math.sin(time * 20) > 0 ? 1 : 0.4;
    ctx.globalAlpha = blink;
    ctx.strokeText('HOT!', x + h.w / 2, top - 14); ctx.fillText('HOT!', x + h.w / 2, top - 14);
    ctx.globalAlpha = 1;
  }
  if (phase === 'blast' && k < 0.92) {
    const len = h.flameLen * Math.min(1, k * 6);
    const fx = x + h.w - 10;
    const g = ctx.createLinearGradient(fx, 0, fx + len, 0);
    g.addColorStop(0, '#fff3a0'); g.addColorStop(0.4, '#ff9a2a'); g.addColorStop(1, 'rgba(229,59,44,0.2)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fx, G - 52);
    for (let s = 0; s <= 10; s++) ctx.lineTo(fx + (len * s) / 10, G - 50 - Math.sin(time * 30 + s * 1.7) * 9 + s * 2);
    ctx.lineTo(fx + len, G);
    ctx.lineTo(fx, G);
    ctx.fill();
  }
  // a warning patch on the floor where the flame will reach
  if (phase !== 'cool') {
    ctx.fillStyle = `rgba(229,59,44,${phase === 'glow' ? 0.25 * k : 0.2})`;
    ctx.fillRect(x + h.w - 10, G - 2, h.flameLen, 8);
  }
}

function knifeRack(ctx, x, h) {
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x, 110, h.w, 22);
  ctx.strokeStyle = '#3b2416'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x + 20, 0); ctx.lineTo(x + 20, 110); ctx.moveTo(x + h.w - 20, 0); ctx.lineTo(x + h.w - 20, 110); ctx.stroke();
  for (const k of h.knives) {
    const kx = x + k.dx;
    if (k.state === 'shake' && k.t > 0) {
      // the shadow on the floor shows where it will land
      ctx.fillStyle = `rgba(30,10,5,${0.15 + Math.min(1, k.t / 0.55) * 0.35})`;
      ctx.beginPath(); ctx.ellipse(kx, G, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    const jiggle = k.state === 'shake' && k.t > 0 ? Math.sin(k.t * 60) * 3 : 0;
    const y = k.state === 'hang' || k.state === 'shake' ? 140 : k.y - 70;
    ctx.save();
    ctx.translate(kx + jiggle, k.state === 'stuck' ? G - 44 : y);
    ctx.rotate(Math.PI / 2);
    drawKnife(ctx, 56);
    ctx.restore();
  }
}

function mud(ctx, x, h) {
  ctx.fillStyle = '#5b3a20';
  ctx.beginPath(); ctx.ellipse(x + h.w / 2, G + 4, h.w / 2, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.ellipse(x + h.w / 2 - 30, G + 1, 30, 4, 0, 0, Math.PI * 2); ctx.fill();
}

function gravy(ctx, x, h) {
  ctx.fillStyle = '#8a4b1f';
  ctx.beginPath(); ctx.ellipse(x + h.w / 2, G + 4, h.w / 2, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,160,0.35)';
  ctx.beginPath(); ctx.ellipse(x + h.w / 2 + 20, G + 1, 40, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3dc';
  ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SLIPPERY', x + h.w / 2, G + 30);
}

const DRAW = { fence, hay, crate, pumpkin, pitchfork, lantern, pot, rollingPin, oven, knifeRack, mud, gravy };

export function drawHazard(ctx, h, camX, time) {
  const fn = DRAW[h.type];
  if (fn) fn(ctx, h.x - camX, h, time);
}

export function drawThrownKnife(ctx, k, camX) {
  ctx.save();
  ctx.translate(k.x - camX, k.y);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-90, -2, 60, 4);
  ctx.rotate(Math.sin(k.spin) * 0.15);
  drawKnife(ctx, 50);
  ctx.restore();
}

export function drawCorn(ctx, c, camX, time) {
  const x = c.x - camX, y = c.y + Math.sin(time * 4 + c.x) * 3;
  ctx.fillStyle = '#5f7a33';
  ctx.beginPath(); ctx.ellipse(x - 5, y + 4, 4, 11, -0.4, 0, Math.PI * 2); ctx.ellipse(x + 5, y + 4, 4, 11, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c232';
  ctx.beginPath(); ctx.ellipse(x, y - 2, 6, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d99a1a';
  for (let k = -2; k <= 2; k++) ctx.fillRect(x - 4, y - 2 + k * 4, 8, 1.4);
}

export function drawPie(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#c98a3a';
  ctx.beginPath(); ctx.ellipse(0, 4, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e07a26';
  ctx.beginPath(); ctx.ellipse(0, 0, 21, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3dc';
  ctx.beginPath(); ctx.arc(0, -4, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawFeatherPickup(ctx, f, camX, time) {
  const x = f.x - camX, y = f.y + Math.sin(time * 3) * 6;
  ctx.fillStyle = 'rgba(159,226,122,0.3)';
  ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
  drawFeatherIcon(ctx, x, y, 1.2, '#e8a24a');
}

export function drawFeatherIcon(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.6);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5b3320';
  ctx.beginPath(); ctx.ellipse(0, 9, 7, 5, 0, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#fff3dc'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 22); ctx.stroke();
  ctx.restore();
}

export function drawHideSpot(ctx, h, camX, hereNow) {
  const x = h.x - camX;
  if (h.type === 'cupboard') {
    ctx.fillStyle = '#3a3346';
    ctx.fillRect(x, G - 130, h.w, 130);
    ctx.strokeStyle = '#211c2a'; ctx.lineWidth = 5;
    ctx.strokeRect(x + 6, G - 124, h.w / 2 - 8, 118); ctx.strokeRect(x + h.w / 2 + 2, G - 124, h.w / 2 - 8, 118);
    ctx.fillStyle = '#8a7a60';
    ctx.fillRect(x + h.w / 2 - 10, G - 70, 5, 14); ctx.fillRect(x + h.w / 2 + 5, G - 70, 5, 14);
  } else {
    ctx.fillStyle = '#5a5030';
    ctx.beginPath();
    ctx.moveTo(x, G);
    ctx.quadraticCurveTo(x + 10, G - 96, x + h.w / 2, G - 100);
    ctx.quadraticCurveTo(x + h.w - 10, G - 96, x + h.w, G);
    ctx.fill();
    ctx.strokeStyle = '#7a6e40'; ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(x + 14 + k * 12, G - 10); ctx.lineTo(x + 20 + k * 11, G - 70 - (k % 3) * 8); ctx.stroke(); }
  }
  if (hereNow) {
    ctx.fillStyle = '#8fc8ff';
    ctx.font = '800 18px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0d1224';
    ctx.strokeText('DOWN: hide', x + h.w / 2, G - 140); ctx.fillText('DOWN: hide', x + h.w / 2, G - 140);
  }
}

export function drawDoor(ctx, d, camX) {
  const x = d.x - camX;
  ctx.fillStyle = 'rgba(255,233,168,0.25)';
  ctx.beginPath(); ctx.moveTo(x, G - 200); ctx.lineTo(x + 110, G - 200); ctx.lineTo(x + 200, G); ctx.lineTo(x - 20, G); ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(x, G - 200, 110, 200);
  ctx.strokeStyle = '#3b2416'; ctx.lineWidth = 10;
  ctx.strokeRect(x, G - 200, 110, 200);
  ctx.fillStyle = '#2a1a12';
  ctx.font = '800 20px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + 55, G - 210);
}

export function drawGate(ctx, gateX, camX) {
  const x = gateX - camX;
  ctx.fillStyle = '#2b1f33';
  for (let k = 0; k < 6; k++) {
    ctx.beginPath(); ctx.moveTo(x + 80 + k * 70, G); ctx.lineTo(x + 115 + k * 70, G - 260 - (k % 2) * 60); ctx.lineTo(x + 150 + k * 70, G); ctx.fill();
  }
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x - 10, G - 120, 14, 120); ctx.fillRect(x + 60, G - 120, 14, 120);
  ctx.fillStyle = '#a8703f';
  ctx.fillRect(x - 16, G - 128, 96, 14);
  ctx.fillStyle = '#fff3dc';
  ctx.font = '900 22px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 5; ctx.strokeStyle = '#2a1a12';
  ctx.strokeText('THE WOODS', x + 32, G - 140); ctx.fillText('THE WOODS', x + 32, G - 140);
}
