// The heads-up display during a run: feathers (lives), score, distance, the course map from
// farmyard to woods with Pepper and the farmer on it, sprint stamina, pies in hand, how close
// the farmer is, a warning arrow for incoming knives, and the stage banners.

import { VIEW, GROUND_Y, COLORS } from './config.js';
import { STAGES, COURSE_END_M } from './stages.js';
import { runScore, runMeters, runMode, farmerDistanceMeters } from './run.js';
import { drawFeatherIcon, drawPie } from './art/props.js';

const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';
const STAGE_COLORS = { farm: '#7b8f3a', barn: '#b5481f', barnDark: '#3a4a78', kitchen: '#9c1f2e', kitchenDark: '#3a4a78', dusk: '#6a3a6a' };

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(42,26,18,0.78)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(242,182,50,0.7)'; ctx.lineWidth = 2;
  ctx.stroke();
}

function text(ctx, s, x, y, size, color = COLORS.cream, align = 'left', weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function courseMap(ctx, run, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x, y, w, 12);
  for (const s of STAGES) {
    ctx.fillStyle = STAGE_COLORS[s.theme];
    ctx.fillRect(x + (s.from / COURSE_END_M) * w, y, ((s.to - s.from) / COURSE_END_M) * w - 2, 12);
  }
  const tx = x + Math.min(1, run.turkey.x / 32 / COURSE_END_M) * w;
  const fxp = x + Math.max(0, Math.min(1, run.farmer.x / 32 / COURSE_END_M)) * w;
  ctx.fillStyle = '#e53b2c';
  ctx.beginPath(); ctx.moveTo(fxp, y - 2); ctx.lineTo(fxp - 7, y - 12); ctx.lineTo(fxp + 7, y - 12); ctx.fill();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath(); ctx.arc(tx, y + 6, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d4242f';
  ctx.beginPath(); ctx.arc(tx + 4, y + 8, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2f5a2a';
  ctx.beginPath(); ctx.moveTo(x + w + 6, y + 14); ctx.lineTo(x + w + 16, y - 8); ctx.lineTo(x + w + 26, y + 14); ctx.fill();
}

function farmerMeter(ctx, run) {
  const m = farmerDistanceMeters(run);
  const danger = Math.max(0, Math.min(1, 1 - m / 22));
  panel(ctx, 20, 108, 250, 46);
  text(ctx, 'FARMER', 34, 138, 17, '#ffb199');
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(112, 122, 100, 16);
  ctx.fillStyle = danger > 0.7 ? '#e53b2c' : danger > 0.4 ? '#f2b632' : '#9fe27a';
  ctx.fillRect(112, 122, 100 * danger, 16);
  text(ctx, `${m.toFixed(0)}m`, 258, 138, 18, COLORS.cream, 'right');
  return danger;
}

export function drawHud(ctx, run, time) {
  const t = run.turkey;
  // lives and score
  panel(ctx, 20, 18, 250, 80);
  for (let i = 0; i < Math.max(3, t.lives); i++) drawFeatherIcon(ctx, 46 + i * 34, 46, 0.95, i < t.lives ? '#e8a24a' : 'rgba(255,255,255,0.18)');
  text(ctx, 'SCORE', 34, 86, 14, '#f2d3a0');
  text(ctx, String(runScore(run)).padStart(5, '0'), 258, 88, 28, COLORS.gold, 'right', 900);

  // course map and stage
  panel(ctx, 380, 18, 520, 70);
  text(ctx, run.stage.name.toUpperCase(), 640, 46, 20, COLORS.cream, 'center', 900);
  courseMap(ctx, run, 404, 60, 450);

  // distance, stamina and pies
  panel(ctx, 1010, 18, 250, 106);
  text(ctx, 'DISTANCE', 1024, 42, 14, '#f2d3a0');
  text(ctx, `${Math.min(runMeters(run), COURSE_END_M)} / ${COURSE_END_M} m`, 1246, 44, 20, COLORS.cream, 'right', 900);
  text(ctx, 'SPRINT', 1024, 72, 14, '#f2d3a0');
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(1096, 60, 150, 14);
  ctx.fillStyle = t.stamina > 0.25 ? '#9fe27a' : '#e53b2c'; ctx.fillRect(1096, 60, 150 * t.stamina, 14);
  text(ctx, 'PIES', 1024, 106, 14, '#f2d3a0');
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = i < run.pies ? 1 : 0.2;
    drawPie(ctx, 1110 + i * 50, 100, 0.8);
  }
  ctx.globalAlpha = 1;
  text(ctx, 'F / click', 1246, 120, 11, '#f2d3a0', 'right', 600);

  const danger = runMode(run) === 'chase' ? farmerMeter(ctx, run) : 0;

  // farmer off screen to the left: an arrow with his distance
  const fsx = run.farmer.x - run.camX;
  if (fsx < -30) {
    const pulse = 0.6 + 0.4 * Math.sin(time * 8);
    ctx.fillStyle = `rgba(229,59,44,${pulse})`;
    ctx.beginPath(); ctx.moveTo(14, GROUND_Y - 90); ctx.lineTo(44, GROUND_Y - 114); ctx.lineTo(44, GROUND_Y - 66); ctx.fill();
    text(ctx, 'FARMER', 50, GROUND_Y - 94, 15, '#ffb199');
  }
  // knife warning at the lane it will fly in
  if (run.farmer.mode === 'windup') {
    const y = run.farmer.lane === 'high' ? GROUND_Y - 62 : GROUND_Y - 20;
    const blink = Math.sin(time * 26) > 0;
    // a dark tag behind the words keeps the cue readable over ovens, crates and wallpaper
    ctx.fillStyle = 'rgba(26,14,8,0.82)';
    ctx.beginPath(); ctx.roundRect(200, y - 20, 132, 40, 10); ctx.fill();
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2;
    ctx.stroke();
    if (blink) {
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(0, y - 3, 200, 6);
    }
    text(ctx, run.farmer.lane === 'high' ? '▼ DUCK!' : '▲ JUMP!', 212, y + 8, 24, blink ? '#ffd36b' : '#fff3dc', 'left', 900);
  }
  if (danger > 0.55) {
    const g = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.4, VIEW.w / 2, VIEW.h / 2, VIEW.w * 0.7);
    g.addColorStop(0, 'rgba(229,59,44,0)');
    g.addColorStop(1, `rgba(229,59,44,${(danger - 0.55) * 0.9 * (0.75 + 0.25 * Math.sin(time * 9))})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  if (runMode(run) === 'search') {
    panel(ctx, 20, 108, 330, 46);
    text(ctx, 'STAY OUT OF THE LIGHT', 34, 139, 20, '#8fc8ff', 'left', 900);
  }

  // stage banners (the end card has its own title)
  for (const b of run.state === 'over' ? [] : run.fx.banners) {
    const k = b.age / b.life;
    const a = k < 0.1 ? k / 0.1 : k > 0.8 ? (1 - k) / 0.2 : 1;
    const slide = k < 0.1 ? (1 - k / 0.1) * 40 : 0;
    ctx.globalAlpha = a;
    ctx.font = `900 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 10; ctx.strokeStyle = '#2a1a12';
    ctx.strokeText(b.title, VIEW.w / 2, 250 - slide);
    ctx.fillStyle = b.color;
    ctx.fillText(b.title, VIEW.w / 2, 250 - slide);
    if (b.subtitle) {
      ctx.font = `800 24px ${FONT}`;
      ctx.lineWidth = 6;
      ctx.strokeText(b.subtitle, VIEW.w / 2, 292 - slide);
      ctx.fillStyle = COLORS.cream;
      ctx.fillText(b.subtitle, VIEW.w / 2, 292 - slide);
    }
  }
  ctx.globalAlpha = 1;
}

export { panel, text, FONT };
