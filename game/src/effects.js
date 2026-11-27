// Feedback you can see: feather bursts, dust puffs, sparks, steam, falling leaves, floating score
// text, big banners and screen shake. Pure data plus a draw pass; nothing here changes the run.

import { makeRng } from './rng.js';

export function createEffects(seed = 7) {
  return { particles: [], floaters: [], banners: [], shake: 0, flash: 0, flashColor: '#fff', rng: makeRng(seed) };
}

export function burst(fx, kind, x, y, count) {
  const r = fx.rng;
  for (let i = 0; i < count; i++) {
    const a = r.range(0, Math.PI * 2);
    const s = kind === 'feather' ? r.range(80, 320) : kind === 'spark' ? r.range(120, 420) : r.range(30, 130);
    fx.particles.push({
      kind, x, y,
      vx: Math.cos(a) * s + (kind === 'dust' ? -90 : 0),
      vy: Math.sin(a) * s - (kind === 'feather' ? 160 : kind === 'steam' ? 60 : 40),
      life: kind === 'feather' ? r.range(1.2, 2) : r.range(0.35, 0.8),
      age: 0,
      rot: r.range(0, 6.3),
      spin: r.range(-6, 6),
      size: kind === 'feather' ? r.range(10, 18) : kind === 'spark' ? r.range(2, 5) : r.range(8, 18),
      hue: r.pick(['#8a4b2a', '#c8742f', '#f2d3a0', '#5b3320']),
    });
  }
}

export function floatText(fx, text, x, y, color = '#fff3dc', size = 26) {
  fx.floaters.push({ text, x, y, color, size, age: 0, life: 1.1 });
}

export function banner(fx, title, subtitle = '', color = '#f2b632', life = 2.2) {
  fx.banners = [{ title, subtitle, color, age: 0, life }];
}

export function shake(fx, amount) {
  fx.shake = Math.max(fx.shake, amount);
}

export function flash(fx, color, amount = 0.5) {
  fx.flash = amount;
  fx.flashColor = color;
}

export function updateEffects(fx, dt) {
  for (const p of fx.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'feather') { p.vy += 260 * dt; p.vx *= 0.97; p.vy = Math.min(p.vy, 90); }
    else if (p.kind === 'spark') p.vy += 500 * dt;
    else if (p.kind === 'steam') p.vy -= 30 * dt;
    p.rot += p.spin * dt;
  }
  fx.particles = fx.particles.filter((p) => p.age < p.life);
  for (const f of fx.floaters) { f.age += dt; f.y -= 50 * dt; }
  fx.floaters = fx.floaters.filter((f) => f.age < f.life);
  for (const b of fx.banners) b.age += dt;
  fx.banners = fx.banners.filter((b) => b.age < b.life);
  fx.shake = Math.max(0, fx.shake - dt * 30);
  fx.flash = Math.max(0, fx.flash - dt * 2.5);
}

export function drawParticles(ctx, fx, camX) {
  for (const p of fx.particles) {
    const k = 1 - p.age / p.life;
    const x = p.x - camX;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.translate(x, p.y);
    ctx.rotate(p.rot);
    if (p.kind === 'feather') {
      ctx.fillStyle = p.hue;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,210,0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();
    } else if (p.kind === 'spark') {
      ctx.fillStyle = k > 0.5 ? '#ffe27a' : '#ff7a2a';
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    } else {
      ctx.fillStyle = p.kind === 'steam' ? 'rgba(255,255,255,0.45)' : 'rgba(160,120,80,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1.4 - k * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawFloaters(ctx, fx, camX) {
  ctx.textAlign = 'center';
  for (const f of fx.floaters) {
    const k = f.age / f.life;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `800 ${f.size}px "Trebuchet MS", "Segoe UI", sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2a1a12';
    ctx.strokeText(f.text, f.x - camX, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x - camX, f.y);
  }
  ctx.globalAlpha = 1;
}
