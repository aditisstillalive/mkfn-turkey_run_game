// Draws one frame of a run: the stage scenery (cross-fading between stages), the course props,
// the farmer and Pepper, flying knives, the darkness and lantern beam of a search, effects,
// screen shake and flashes, then the HUD on top.

import { VIEW, GROUND_Y, PX_PER_M } from './config.js';
import { STAGES } from './stages.js';
import { runMode } from './run.js';
import { beamGeometry } from './farmer.js';
import { drawScenery, drawDarkness } from './art/scenery.js';
import { drawHazard, drawThrownKnife, drawCorn, drawPie, drawFeatherPickup, drawHideSpot, drawDoor, drawGate } from './art/props.js';
import { drawTurkey, drawPeekingEyes, drawHiddenTail } from './art/turkeyArt.js';
import { drawFarmer } from './art/farmerArt.js';
import { drawParticles, drawFloaters } from './effects.js';
import { drawHud } from './hud.js';

const BLEND_M = 14; // metres over which one stage's scenery fades into the next

function drawBackdrop(ctx, run, time) {
  const meters = run.turkey.x / PX_PER_M;
  const i = STAGES.indexOf(run.stage);
  drawScenery(ctx, run.stage.theme, run.camX, time);
  const next = STAGES[i + 1];
  if (next && next.theme !== run.stage.theme && meters > next.from - BLEND_M) {
    ctx.globalAlpha = Math.min(1, (meters - (next.from - BLEND_M)) / BLEND_M);
    drawScenery(ctx, next.theme, run.camX, time);
    ctx.globalAlpha = 1;
  }
}

function turkeyExpression(run) {
  const t = run.turkey;
  if (run.outcome === 'escaped') return 'happy';
  if (t.stun > 0 || run.outcome === 'caught') return 'scared';
  if (t.sprinting) return 'determined';
  return 'worried';
}

export function drawRun(ctx, run, time) {
  const fx = run.fx;
  ctx.save();
  if (fx.shake > 0) ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);

  drawBackdrop(ctx, run, time);
  const camX = run.camX;
  const onScreen = (x, w = 0) => x + w > camX - 300 && x < camX + VIEW.w + 300;
  const t = run.turkey;
  const searching = runMode(run) === 'search';

  for (const d of run.level.doors) if (onScreen(d.x, 110)) drawDoor(ctx, d, camX);
  if (onScreen(run.level.gateX, 600)) drawGate(ctx, run.level.gateX, camX);
  const hideSpot = t.hidden ? run.level.hides.find((h) => t.x >= h.x && t.x <= h.x + h.w) : null;
  if (hideSpot) {
    // tail tips quiver while the lantern is on her
    drawHiddenTail(ctx, t.x - camX - 6, GROUND_Y - (hideSpot.type === 'cupboard' ? 112 : 78), run.hiddenBeamTime > 0 ? time : 0);
  }
  for (const h of run.level.hides) {
    if (onScreen(h.x, h.w)) drawHideSpot(ctx, h, camX, searching && !t.hidden && t.x > h.x - 10 && t.x < h.x + h.w + 10);
  }
  for (const h of run.level.hazards) if (onScreen(h.x, h.w + 200)) drawHazard(ctx, h, camX, time);
  for (const c of run.level.corn) if (!c.taken && onScreen(c.x)) drawCorn(ctx, c, camX, time);
  for (const p of run.level.pies) if (!p.taken && onScreen(p.x)) drawPie(ctx, p.x - camX, p.y + Math.sin(time * 3) * 5, 1);
  for (const f of run.level.feathers) if (!f.taken && onScreen(f.x)) drawFeatherPickup(ctx, f, camX, time);
  for (const p of run.droppedPies) if (!p.eaten) drawPie(ctx, p.x - camX, p.y, 1);

  const f = run.farmer;
  drawFarmer(ctx, f.x - camX, GROUND_Y, { phase: f.runPhase, mode: f.mode, t: f.t, alert: f.alert, glow: 0.8 + 0.2 * Math.sin(time * 10), facing: f.mode === 'search' && f.backTrack > 0 ? -1 : 1 });

  if (t.hidden) {
    drawPeekingEyes(ctx, t.x - camX, GROUND_Y - (hideSpot?.type === 'cupboard' ? 74 : 56), Math.sin(time * 2.3) > 0.96);
  } else if (!(run.outcome === 'caught' && run.endT > 0.2)) {
    drawTurkey(ctx, t.x - camX, t.y, {
      phase: t.runPhase,
      airborne: !t.onGround,
      ducking: t.ducking,
      gliding: t.gliding,
      flicker: t.invuln > 0 && Math.floor(time * 16) % 2 === 0,
      expression: turkeyExpression(run),
      squash: t.squash,
      height: GROUND_Y - t.y,
    });
  }
  if (run.outcome === 'caught' && run.endT > 0.2) {
    // dangling by the feet from the farmer's fist
    ctx.save();
    ctx.translate(f.x - camX + 40, GROUND_Y - 170);
    ctx.rotate(Math.PI + Math.sin(time * 6) * 0.15);
    drawTurkey(ctx, 0, 0, { phase: time * 20, airborne: true, expression: 'scared', height: -1 });
    ctx.restore();
  }

  for (const k of run.knives) drawThrownKnife(ctx, k, camX);

  const darkStage = run.stage.mode === 'search';
  if (darkStage) drawDarkness(ctx, searching ? beamGeometry(f) : null, camX, searching ? 1 : 0.6);

  drawParticles(ctx, fx, camX);
  drawFloaters(ctx, fx, camX);
  ctx.restore();

  if (fx.flash > 0) {
    ctx.globalAlpha = fx.flash * 0.6;
    ctx.fillStyle = fx.flashColor;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.globalAlpha = 1;
  }
  drawHud(ctx, run, time);
}
