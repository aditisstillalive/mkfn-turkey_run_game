// Farmer Baste: a big ginger-bearded farmer in a straw hat, plaid shirt and denim overalls. He
// runs with a carving knife and a roasting fork, raises the knife to throw, holds a lantern in
// the dark, and stuffs his face with any pie he finds.

function plaid(ctx, x, y, w, h) {
  ctx.fillStyle = '#b3262d';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(40,10,10,0.45)';
  ctx.lineWidth = 3;
  for (let i = 4; i < w; i += 11) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); ctx.stroke(); }
  for (let j = 4; j < h; j += 11) { ctx.beginPath(); ctx.moveTo(x, y + j); ctx.lineTo(x + w, y + j); ctx.stroke(); }
}

function drawKnife(ctx, len = 46) {
  ctx.fillStyle = '#3b2416';
  ctx.fillRect(-14, -4, 16, 8);
  // steel-grey blade with a dark outline, so it reads against pale wallpaper and dark barns alike
  ctx.fillStyle = '#aebbc8';
  ctx.strokeStyle = '#1e1410';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(2 + len, -1);
  ctx.lineTo(2 + len - 8, 5);
  ctx.lineTo(2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(6, -3, len - 14, 2);
}

function drawLantern(ctx, glow) {
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -16, 7, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(-10, -12, 20, 5);
  ctx.fillRect(-10, 14, 20, 5);
  ctx.fillStyle = `rgba(255,214,120,${0.75 + glow * 0.25})`;
  ctx.fillRect(-8, -7, 16, 21);
}

function drawArm(ctx, sx, sy, angle, item, glow) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  plaid(ctx, -8, -2, 16, 42);
  ctx.fillStyle = '#f0b48e';
  ctx.beginPath();
  ctx.arc(0, 46, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(0, 48);
  if (item === 'knife') { ctx.rotate(-angle - 0.2); drawKnife(ctx); }
  if (item === 'fork') {
    ctx.rotate(-angle + 0.3);
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(-4, -4, 14, 8);
    ctx.fillStyle = '#c9d2dc';
    ctx.fillRect(10, -2, 26, 4);
    ctx.fillRect(34, -6, 3, 12);
    ctx.fillRect(34, -6, 16, 3);
    ctx.fillRect(34, 3, 16, 3);
  }
  if (item === 'lantern') { ctx.rotate(-angle); drawLantern(ctx, glow); }
  if (item === 'pie') {
    ctx.rotate(-angle);
    ctx.fillStyle = '#c98a3a';
    ctx.beginPath();
    ctx.ellipse(0, -4, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e07a26';
    ctx.beginPath();
    ctx.ellipse(0, -7, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeadAndHat(ctx, mode, t, alert) {
  // head
  ctx.fillStyle = '#f0b48e';
  ctx.beginPath();
  ctx.ellipse(6, -168, 25, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  // beard
  ctx.fillStyle = '#c2541f';
  ctx.beginPath();
  ctx.moveTo(-18, -168);
  ctx.quadraticCurveTo(-16, -126, 10, -124);
  ctx.quadraticCurveTo(36, -128, 32, -166);
  ctx.quadraticCurveTo(18, -150, 6, -152);
  ctx.quadraticCurveTo(-8, -150, -18, -168);
  ctx.fill();
  // mouth: a hungry grin, chewing when eating
  ctx.fillStyle = '#5a1a12';
  ctx.beginPath();
  if (mode === 'eating') ctx.ellipse(16, -148, 8, 4 + Math.abs(Math.sin(t * 18)) * 4, 0, 0, Math.PI * 2);
  else ctx.ellipse(14, -149, 10, 4, 0.1, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#fff';
  if (mode !== 'eating') ctx.fillRect(8, -149, 12, 2);
  // nose
  ctx.fillStyle = '#e07a6a';
  ctx.beginPath();
  ctx.arc(26, -166, 8, 0, Math.PI * 2);
  ctx.fill();
  // eyes and bushy brows
  ctx.fillStyle = '#1b0f0a';
  ctx.beginPath();
  ctx.arc(16, -176, alert > 0 ? 4.5 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9c3d16';
  ctx.save();
  ctx.translate(14, -184);
  ctx.rotate(mode === 'windup' || alert > 0 ? 0.35 : 0.1);
  ctx.fillRect(-10, -3, 20, 6);
  ctx.restore();
  // straw hat
  ctx.fillStyle = '#e9c46a';
  ctx.beginPath();
  ctx.ellipse(4, -190, 46, 10, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-20, -190);
  ctx.quadraticCurveTo(-18, -222, 6, -222);
  ctx.quadraticCurveTo(28, -222, 28, -190);
  ctx.fill();
  ctx.fillStyle = '#9c1f2e';
  ctx.fillRect(-20, -198, 48, 7);
  ctx.strokeStyle = 'rgba(140,100,30,0.6)';
  ctx.lineWidth = 1.5;
  for (let i = -36; i < 48; i += 9) { ctx.beginPath(); ctx.moveTo(i, -194); ctx.lineTo(i + 4, -186); ctx.stroke(); }
}

// opts: { phase, mode, t, alert, glow, scale }
export function drawFarmer(ctx, x, y, opts = {}) {
  const { phase = 0, mode = 'chase', t = 0, alert = 0, glow = 1, scale = 1, facing = 1 } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  const running = mode === 'chase' || mode === 'windup' || mode === 'grab';
  const walking = mode === 'search';
  const swing = running ? Math.sin(phase) * 0.7 : walking ? Math.sin(phase) * 0.35 : 0;
  const bob = running ? -Math.abs(Math.sin(phase)) * 6 : 0;
  if (mode === 'tripped') ctx.rotate(Math.min(1.35, t * 3));

  ctx.fillStyle = 'rgba(30,15,5,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 48, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(0, bob);

  // legs (denim) and boots
  for (const s of [1, -1]) {
    ctx.save();
    ctx.translate(s * 8, -78);
    ctx.rotate(swing * s);
    ctx.fillStyle = s > 0 ? '#3a5a8c' : '#2f4b76';
    ctx.fillRect(-10, 0, 20, 66);
    ctx.fillStyle = '#4a2a16';
    ctx.fillRect(-12, 62, 30, 14);
    ctx.restore();
  }

  // arm behind: fork while chasing, lantern in the dark
  const backItem = mode === 'search' ? 'lantern' : mode === 'eating' ? null : 'fork';
  drawArm(ctx, -10, -128, mode === 'search' ? -2.1 : -swing * 0.9 + 0.3, backItem, glow);

  // torso: plaid shirt under overalls
  plaid(ctx, -26, -140, 54, 48);
  ctx.fillStyle = '#3a5a8c';
  ctx.fillRect(-24, -112, 50, 40);
  ctx.fillRect(-16, -134, 34, 24);
  ctx.fillStyle = '#2f4b76';
  ctx.fillRect(-20, -140, 6, 30);
  ctx.fillRect(14, -140, 6, 30);
  ctx.fillStyle = '#f2b632';
  ctx.beginPath(); ctx.arc(-17, -114, 3, 0, Math.PI * 2); ctx.arc(17, -114, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2f4b76';
  ctx.fillRect(-6, -104, 16, 12);

  drawHeadAndHat(ctx, mode, t, alert);

  // front arm: knife, raised high to throw, or a pie at his mouth
  let frontAngle = swing * 0.9 - 0.4;
  let frontItem = 'knife';
  if (mode === 'windup') frontAngle = -2.6 - Math.min(1, t * 2) * 0.4;
  if (mode === 'grab') frontAngle = -1.4;
  if (mode === 'eating') { frontAngle = -2.4; frontItem = 'pie'; }
  if (mode === 'search') frontAngle = swing * 0.5 - 0.2;
  drawArm(ctx, 18, -128, frontAngle, frontItem, glow);

  if (alert > 0 || mode === 'windup') {
    ctx.fillStyle = mode === 'windup' ? '#ffd36b' : '#e53b2c';
    ctx.font = '900 54px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2a1a12';
    ctx.strokeText('!', 6, -232);
    ctx.fillText('!', 6, -232);
  }
  ctx.restore();
}

export { drawKnife };
