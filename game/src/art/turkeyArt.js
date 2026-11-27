// Pepper the turkey, drawn with canvas paths: a banded autumn tail fan, a round chestnut body,
// a flapping wing, a worried face with a red snood, and legs that scramble as she runs.

const TAIL_RINGS = [
  { r: 58, color: '#4a2614', band: '#2e170c' },
  { r: 50, color: '#b5481f', band: '#8a3416' },
  { r: 40, color: '#e8a24a', band: '#f6d8a2' },
  { r: 30, color: '#7a4424', band: '#5b3320' },
];

function drawTailFan(ctx, spread, flutter) {
  ctx.save();
  ctx.translate(-16, -42);
  for (const ring of TAIL_RINGS) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const a = -Math.PI * (0.98 - 0.78 * u * spread) + Math.sin(flutter + i) * 0.03;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.ellipse(ring.r * 0.55, 0, ring.r * 0.52, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ring.band;
      ctx.beginPath();
      ctx.ellipse(ring.r * 0.9, 0, ring.r * 0.14, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawLegs(ctx, phase, airborne, ducking) {
  ctx.strokeStyle = '#e08a2a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const hipY = ducking ? -14 : -20;
  for (let side = 0; side < 2; side++) {
    const swing = airborne ? (side ? 0.6 : -0.2) : Math.sin(phase + side * Math.PI) * 0.75;
    const kx = Math.sin(swing) * 14;
    const footX = airborne ? kx - 8 : Math.sin(swing) * 20;
    const footY = airborne ? hipY + 14 : Math.min(0, -Math.cos(swing) * 3 - (Math.sin(swing) > 0 ? Math.sin(swing) * 6 : 0));
    const hipX = side ? 4 : -4;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + kx * 0.6, hipY + 10);
    ctx.lineTo(footX, footY);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(footX - 4, footY);
    ctx.lineTo(footX + 9, footY);
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + 6, footY - 4);
    ctx.stroke();
    ctx.lineWidth = 5;
  }
}

function drawHead(ctx, hx, hy, expression) {
  // neck
  ctx.fillStyle = '#c99a8a';
  ctx.beginPath();
  ctx.moveTo(6, -46);
  ctx.quadraticCurveTo(hx - 12, hy + 10, hx - 6, hy + 6);
  ctx.lineTo(hx + 6, hy + 8);
  ctx.quadraticCurveTo(hx - 2, hy + 26, 22, -40);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.fillStyle = '#d8b4a6';
  ctx.beginPath();
  ctx.arc(hx, hy, 12, 0, Math.PI * 2);
  ctx.fill();
  // beak
  ctx.fillStyle = '#f2b632';
  ctx.beginPath();
  ctx.moveTo(hx + 9, hy - 3);
  ctx.lineTo(hx + 22, hy + 1);
  ctx.lineTo(hx + 9, hy + 5);
  ctx.closePath();
  ctx.fill();
  // snood over the beak and wattle under the chin
  ctx.fillStyle = '#d4242f';
  ctx.beginPath();
  ctx.moveTo(hx + 8, hy - 6);
  ctx.quadraticCurveTo(hx + 18, hy - 2, hx + 15, hy + 14);
  ctx.quadraticCurveTo(hx + 10, hy + 6, hx + 6, hy - 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 5, hy + 14, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hx + 3, hy - 3, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b0f0a';
  const look = expression === 'scared' ? -1.5 : 1.5;
  ctx.beginPath();
  ctx.arc(hx + 4 + look * 0.3, hy - 3, expression === 'scared' ? 2 : 2.6, 0, Math.PI * 2);
  ctx.fill();
  // brow: worried while running, determined when sprinting, wide when scared
  ctx.strokeStyle = '#3a2014';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (expression === 'determined') { ctx.moveTo(hx - 2, hy - 11); ctx.lineTo(hx + 8, hy - 8); }
  else if (expression === 'happy') { ctx.arc(hx + 3, hy - 6, 5, Math.PI * 1.15, Math.PI * 1.85); }
  else { ctx.moveTo(hx - 2, hy - 8); ctx.lineTo(hx + 8, hy - 12); }
  ctx.stroke();
  // sweat drop when scared
  if (expression === 'scared') {
    ctx.fillStyle = '#9fd4ff';
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy - 14);
    ctx.quadraticCurveTo(hx - 15, hy - 5, hx - 10, hy - 4);
    ctx.quadraticCurveTo(hx - 5, hy - 5, hx - 10, hy - 14);
    ctx.fill();
  }
}

// opts: { phase, airborne, ducking, gliding, flicker, expression, scale, height }
// `height` is how far she is above the floor: her shadow stays on the floor and shrinks as she rises.
export function drawTurkey(ctx, x, y, opts = {}) {
  const { phase = 0, airborne = false, ducking = false, gliding = false, flicker = false, expression = 'worried', scale = 1, squash = 0, height = 0 } = opts;
  if (flicker) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (1 + squash * 0.12), scale * (1 - squash * 0.12));
  const bob = airborne ? 0 : Math.abs(Math.sin(phase)) * -3;
  ctx.translate(0, bob);

  // shadow
  if (height >= 0) {
    const fade = Math.max(0.35, 1 - height / 260);
    ctx.fillStyle = `rgba(30,15,5,${0.25 * fade})`;
    ctx.beginPath();
    ctx.ellipse(0, -bob + 2 + height / scale, 30 * fade, 6 * fade, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (ducking) ctx.scale(1.15, 0.62);
  drawTailFan(ctx, gliding ? 1.15 : ducking ? 0.7 : 1, phase * 0.5);
  drawLegs(ctx, phase, airborne, false);

  // body
  const g = ctx.createRadialGradient(-4, -48, 6, 0, -38, 34);
  g.addColorStop(0, '#9a5a32');
  g.addColorStop(1, '#5b3320');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -38, 28, 24, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // breast speckles
  ctx.fillStyle = 'rgba(255,220,170,0.35)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(12 + (i % 2) * 6, -44 + i * 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // wing
  const flap = gliding ? Math.sin(phase * 3) * 0.6 - 0.5 : airborne ? -0.6 : Math.sin(phase) * 0.12;
  ctx.save();
  ctx.translate(-6, -42);
  ctx.rotate(flap);
  ctx.fillStyle = '#4a2614';
  ctx.beginPath();
  ctx.ellipse(-2, 4, 20, 12, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8a24a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-14 + i * 7, 8 + i);
    ctx.lineTo(-2 + i * 7, 13);
    ctx.stroke();
  }
  ctx.restore();

  const headX = ducking ? 34 : 26;
  const headY = ducking ? -46 : -74 + Math.sin(phase * 2) * 2;
  drawHead(ctx, headX, headY, expression);
  ctx.restore();
}

// Just the eyes, peeking out of a hiding place.
// Hidden, Pepper's tail still gives her away: the tips of her fan poke up out of the hay (or out
// of the cupboard's top), drawn before the hiding spot so its front covers their roots.
export function drawHiddenTail(ctx, x, rootY, quiver = 0) {
  ctx.save();
  ctx.translate(x, rootY);
  for (const ring of TAIL_RINGS.slice(0, 3)) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.32 + Math.sin(quiver * 40 + i) * 0.05 * (quiver > 0 ? 1 : 0);
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.ellipse(ring.r * 0.62, 0, ring.r * 0.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ring.band;
      ctx.beginPath();
      ctx.ellipse(ring.r * 0.98, 0, ring.r * 0.13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

export function drawPeekingEyes(ctx, x, y, blink) {
  ctx.fillStyle = '#fff';
  for (const dx of [-8, 8]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y, 5, blink ? 1 : 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!blink) {
    ctx.fillStyle = '#1b0f0a';
    for (const dx of [-7, 9]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + 1, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#f2b632';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 7);
  ctx.lineTo(x + 4, y + 7);
  ctx.lineTo(x, y + 13);
  ctx.fill();
}
