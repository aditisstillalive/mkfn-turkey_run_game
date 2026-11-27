// The backdrops, with parallax: an autumn farmyard, the inside of the old barn, the farmhouse
// kitchen, the same two rooms with the lights out, and the dusk field before the woods.

import { VIEW, GROUND_Y } from '../config.js';
import { hash01 } from '../rng.js';

const W = VIEW.w;

function tiles(camX, factor, tileW, fn) {
  const off = camX * factor;
  const first = Math.floor(off / tileW) - 1;
  for (let i = first; i < first + Math.ceil(W / tileW) + 3; i++) fn(i, i * tileW - off);
}

function skyGradient(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, GROUND_Y);
}

function hills(ctx, camX, factor, baseY, amp, color, salt) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let sx = 0; sx <= W; sx += 16) {
    const wx = (sx + camX * factor) / 260;
    const i = Math.floor(wx);
    const f = wx - i;
    const a = hash01(i, salt), b = hash01(i + 1, salt);
    const s = f * f * (3 - 2 * f);
    ctx.lineTo(sx, baseY - amp * (a + (b - a) * s));
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function autumnTree(ctx, x, baseY, size, seed) {
  ctx.fillStyle = '#4a2a16';
  ctx.fillRect(x - size * 0.08, baseY - size * 0.9, size * 0.16, size * 0.9);
  const leaves = ['#d9502b', '#e8762b', '#f2b632', '#b5481f', '#c9862e'];
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = leaves[Math.floor(hash01(seed * 7 + k, 3) * leaves.length)];
    ctx.beginPath();
    ctx.arc(x + (hash01(seed + k, 1) - 0.5) * size * 0.8, baseY - size * (0.95 + hash01(seed + k, 2) * 0.45), size * (0.28 + hash01(seed + k, 4) * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }
}

function redBarnFar(ctx, x, y) {
  ctx.fillStyle = '#9c2a22';
  ctx.fillRect(x, y - 120, 170, 120);
  ctx.fillStyle = '#5a1812';
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 118); ctx.lineTo(x + 85, y - 190); ctx.lineTo(x + 184, y - 118);
  ctx.fill();
  ctx.strokeStyle = '#fff3dc';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 55, y - 74, 60, 74);
  ctx.beginPath(); ctx.moveTo(x + 55, y - 74); ctx.lineTo(x + 115, y); ctx.moveTo(x + 115, y - 74); ctx.lineTo(x + 55, y); ctx.stroke();
  ctx.fillStyle = '#fff3dc';
  ctx.fillRect(x + 72, y - 112, 26, 22);
}

function silo(ctx, x, y) {
  ctx.fillStyle = '#b9b2a2';
  ctx.fillRect(x, y - 170, 52, 170);
  ctx.fillStyle = '#8c8577';
  ctx.beginPath(); ctx.arc(x + 26, y - 170, 26, Math.PI, 0); ctx.fill();
}

function groundStrip(ctx, camX, top, dirt, edge, stripe) {
  ctx.fillStyle = dirt;
  ctx.fillRect(0, GROUND_Y, W, VIEW.h - GROUND_Y);
  ctx.fillStyle = edge;
  ctx.fillRect(0, GROUND_Y - 4, W, 12);
  tiles(camX, 1, 90, (i, x) => {
    ctx.fillStyle = stripe;
    ctx.fillRect(x + hash01(i, 9) * 40, GROUND_Y + 30 + hash01(i, 8) * 60, 26 + hash01(i, 7) * 30, 6);
  });
  if (top) {
    tiles(camX, 1, 24, (i, x) => {
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 2);
      ctx.lineTo(x + 6, GROUND_Y - 8 - hash01(i, 5) * 8);
      ctx.lineTo(x + 12, GROUND_Y + 2);
      ctx.fill();
    });
  }
}

function fallingLeaves(ctx, time, count, colors) {
  for (let i = 0; i < count; i++) {
    const sx = (hash01(i, 21) * W * 1.2 - time * (30 + hash01(i, 22) * 40)) % (W * 1.2);
    const x = sx < 0 ? sx + W * 1.2 : sx;
    const y = (hash01(i, 23) * GROUND_Y + time * (40 + hash01(i, 24) * 40)) % GROUND_Y;
    ctx.save();
    ctx.translate(x - 60, y);
    ctx.rotate(time * 2 + i);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFarm(ctx, camX, time) {
  skyGradient(ctx, ['#7fb3c9', '#f3d29a', '#f2a65e']);
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  ctx.beginPath(); ctx.arc(980, 170, 60, 0, Math.PI * 2); ctx.fill();
  hills(ctx, camX, 0.08, 470, 120, '#c98a4a', 1);
  tiles(camX, 0.2, 900, (i, x) => {
    if (hash01(i, 31) < 0.55) redBarnFar(ctx, x + 200, 500);
    else silo(ctx, x + 300, 500);
  });
  hills(ctx, camX, 0.3, 540, 60, '#a8743a', 2);
  tiles(camX, 0.45, 210, (i, x) => autumnTree(ctx, x + hash01(i, 11) * 80, 560, 110 + hash01(i, 12) * 60, i));
  // wooden fence rail along the back of the yard
  tiles(camX, 0.75, 120, (i, x) => {
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(x, GROUND_Y - 70, 12, 70);
  });
  ctx.fillStyle = '#9c6a40';
  ctx.fillRect(0, GROUND_Y - 60, W, 8);
  ctx.fillRect(0, GROUND_Y - 34, W, 8);
  groundStrip(ctx, camX, '#7b8f3a', '#8a5a34', '#6e4426', 'rgba(60,35,18,0.45)');
  fallingLeaves(ctx, time, 18, ['#d9502b', '#f2b632', '#e8762b']);
}

function barnInterior(ctx, camX, dark) {
  ctx.fillStyle = dark ? '#1c1826' : '#7a4426';
  ctx.fillRect(0, 0, W, GROUND_Y);
  tiles(camX, 0.6, 46, (i, x) => {
    ctx.fillStyle = dark ? (i % 2 ? '#221d2e' : '#1e1a29') : (i % 2 ? '#86502e' : '#7c4729');
    ctx.fillRect(x, 0, 44, GROUND_Y);
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.3)' : 'rgba(40,20,8,0.35)';
    ctx.fillRect(x + 44, 0, 2, GROUND_Y);
  });
  // loft beams, hay loft and windows with light shafts
  tiles(camX, 0.6, 520, (i, x) => {
    ctx.fillStyle = dark ? '#14111c' : '#4a2a16';
    ctx.fillRect(x, 120, 30, GROUND_Y - 120);
    ctx.beginPath(); ctx.moveTo(x + 30, 150); ctx.lineTo(x + 130, 120); ctx.lineTo(x + 130, 140); ctx.lineTo(x + 30, 172); ctx.fill();
    if (!dark) {
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(x + 260, 190, 90, 70);
      ctx.fillStyle = 'rgba(255,233,168,0.13)';
      ctx.beginPath(); ctx.moveTo(x + 260, 190); ctx.lineTo(x + 350, 190); ctx.lineTo(x + 480, GROUND_Y); ctx.lineTo(x + 330, GROUND_Y); ctx.fill();
      ctx.strokeStyle = '#4a2a16'; ctx.lineWidth = 5;
      ctx.strokeRect(x + 260, 190, 90, 70);
      ctx.beginPath(); ctx.moveTo(x + 305, 190); ctx.lineTo(x + 305, 260); ctx.stroke();
    } else {
      ctx.fillStyle = '#3a4a78';
      ctx.fillRect(x + 260, 190, 90, 70);
      ctx.fillStyle = '#e6ecff';
      ctx.beginPath(); ctx.arc(x + 320, 210, 10, 0, Math.PI * 2); ctx.fill();
    }
    // hanging tools silhouettes
    ctx.strokeStyle = dark ? '#100d16' : '#3b2416';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 420, 300); ctx.lineTo(x + 420, 420); ctx.moveTo(x + 406, 300); ctx.lineTo(x + 434, 300); ctx.stroke();
  });
  ctx.fillStyle = dark ? '#100d16' : '#3b2416';
  ctx.fillRect(0, 96, W, 26);
  // hay along the back wall
  tiles(camX, 0.85, 170, (i, x) => {
    ctx.fillStyle = dark ? '#3a3420' : '#d9b04a';
    ctx.fillRect(x, GROUND_Y - 56, 150, 56);
    ctx.strokeStyle = dark ? '#2a2616' : '#b48a30';
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 8, GROUND_Y - 50 + k * 11); ctx.lineTo(x + 142, GROUND_Y - 48 + k * 11); ctx.stroke(); }
  });
  groundStrip(ctx, camX, dark ? '#4a4228' : '#e2c063', dark ? '#2c2618' : '#8c6a3a', dark ? '#211c12' : '#7a5a32', 'rgba(30,20,10,0.4)');
}

function kitchen(ctx, camX, time, dark) {
  // wallpaper with little cranberry sprigs
  ctx.fillStyle = dark ? '#1d1a24' : '#f4e2c0';
  ctx.fillRect(0, 0, W, GROUND_Y);
  tiles(camX, 0.6, 60, (i, x) => {
    ctx.fillStyle = dark ? 'rgba(80,70,110,0.25)' : 'rgba(156,31,46,0.18)';
    ctx.fillRect(x, 0, 18, GROUND_Y);
  });
  tiles(camX, 0.6, 640, (i, x) => {
    // upper cabinets
    ctx.fillStyle = dark ? '#2a2430' : '#6b8f71';
    ctx.fillRect(x + 20, 80, 260, 130);
    ctx.strokeStyle = dark ? '#18141e' : '#4c6b52'; ctx.lineWidth = 5;
    ctx.strokeRect(x + 30, 90, 115, 110); ctx.strokeRect(x + 155, 90, 115, 110);
    // window with the sunset (or the moon) outside
    ctx.fillStyle = dark ? '#26335c' : '#f7b267';
    ctx.fillRect(x + 360, 110, 170, 150);
    if (!dark) { ctx.fillStyle = '#e8762b'; ctx.beginPath(); ctx.arc(x + 445, 250, 40, Math.PI, 0); ctx.fill(); }
    else { ctx.fillStyle = '#e6ecff'; ctx.beginPath(); ctx.arc(x + 480, 150, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = dark ? '#18141e' : '#fff3dc'; ctx.lineWidth = 8;
    ctx.strokeRect(x + 360, 110, 170, 150);
    ctx.beginPath(); ctx.moveTo(x + 445, 110); ctx.lineTo(x + 445, 260); ctx.stroke();
    // curtains
    ctx.fillStyle = dark ? '#3a2030' : '#c0392b';
    ctx.fillRect(x + 344, 100, 26, 170); ctx.fillRect(x + 520, 100, 26, 170);
    // shelf with jars and a pie
    ctx.fillStyle = dark ? '#2a2430' : '#8a5a34';
    ctx.fillRect(x + 20, 300, 230, 10);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = dark ? '#3a3448' : ['#e8762b', '#9c1f2e', '#f2b632', '#5f7a33'][k];
      ctx.fillRect(x + 34 + k * 52, 262, 34, 38);
      ctx.fillStyle = dark ? '#2a2430' : '#fff3dc';
      ctx.fillRect(x + 32 + k * 52, 256, 38, 8);
    }
    // a copper pan hanging from a hook
    ctx.strokeStyle = dark ? '#3a3448' : '#7a4a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 600, 60); ctx.lineTo(x + 600, 120); ctx.stroke();
    ctx.fillStyle = dark ? '#3a3448' : '#c8743f';
    ctx.beginPath(); ctx.arc(x + 600, 150, 30, 0, Math.PI * 2); ctx.fill();
  });
  // lower counters along the back wall
  tiles(camX, 0.85, 300, (i, x) => {
    ctx.fillStyle = dark ? '#221e2a' : '#7c9c80';
    ctx.fillRect(x, GROUND_Y - 120, 290, 120);
    ctx.fillStyle = dark ? '#3a3448' : '#e9dcc4';
    ctx.fillRect(x - 6, GROUND_Y - 130, 302, 14);
    ctx.strokeStyle = dark ? '#18141e' : '#5a7a5e'; ctx.lineWidth = 4;
    ctx.strokeRect(x + 12, GROUND_Y - 104, 126, 96); ctx.strokeRect(x + 152, GROUND_Y - 104, 126, 96);
    ctx.fillStyle = dark ? '#555' : '#f2b632';
    ctx.fillRect(x + 125, GROUND_Y - 64, 6, 16); ctx.fillRect(x + 160, GROUND_Y - 64, 6, 16);
  });
  // checkered floor
  ctx.fillStyle = dark ? '#16131c' : '#fff3dc';
  ctx.fillRect(0, GROUND_Y, W, VIEW.h - GROUND_Y);
  tiles(camX, 1, 56, (i, x) => {
    for (let r = 0; r < 3; r++) {
      if ((i + r) % 2) continue;
      ctx.fillStyle = dark ? '#2a2034' : '#9c1f2e';
      ctx.fillRect(x, GROUND_Y + r * 40, 56, 40);
    }
  });
  ctx.fillStyle = dark ? '#0f0d14' : '#5a3a22';
  ctx.fillRect(0, GROUND_Y - 6, W, 8);
}

function dusk(ctx, camX, time) {
  skyGradient(ctx, ['#3b2a5a', '#b5486a', '#f2a65e']);
  ctx.fillStyle = 'rgba(255,214,140,0.95)';
  ctx.beginPath(); ctx.arc(320, 430, 80, 0, Math.PI * 2); ctx.fill();
  hills(ctx, camX, 0.1, 500, 90, '#6a3a4a', 4);
  // pine woods getting closer
  tiles(camX, 0.35, 70, (i, x) => {
    const h = 120 + hash01(i, 41) * 120;
    ctx.fillStyle = '#2b1f33';
    ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x + 35, 560 - h); ctx.lineTo(x + 70, 560); ctx.fill();
  });
  hills(ctx, camX, 0.5, 570, 40, '#7a4a2a', 5);
  tiles(camX, 0.6, 260, (i, x) => autumnTree(ctx, x + 60, 590, 90 + hash01(i, 13) * 40, i + 100));
  groundStrip(ctx, camX, '#6e7a34', '#6e4426', '#5b3a20', 'rgba(40,20,10,0.45)');
  fallingLeaves(ctx, time, 12, ['#d9502b', '#f2b632']);
}

export function drawScenery(ctx, theme, camX, time) {
  switch (theme) {
    case 'farm': return drawFarm(ctx, camX, time);
    case 'barn': return barnInterior(ctx, camX, false);
    case 'barnDark': return barnInterior(ctx, camX, true);
    case 'kitchen': return kitchen(ctx, camX, time, false);
    case 'kitchenDark': return kitchen(ctx, camX, time, true);
    default: return dusk(ctx, camX, time);
  }
}

// Darkness over a search stage, with the lantern cone cut out of it.
export function drawDarkness(ctx, beam, camX, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(6,6,20,${0.55 * alpha})`;
  ctx.fillRect(0, 0, W, VIEW.h);
  if (beam) {
    const ox = beam.ox - camX;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(ox, beam.oy, 10, ox, beam.oy, beam.length);
    g.addColorStop(0, 'rgba(255,220,130,0.55)');
    g.addColorStop(1, 'rgba(255,200,100,0.03)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, beam.oy);
    ctx.arc(ox, beam.oy, beam.length, beam.angle - beam.half, beam.angle + beam.half);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,220,130,0.35)';
    ctx.arc(ox, beam.oy, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
