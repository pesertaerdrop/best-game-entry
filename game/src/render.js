// Everything the eye sees: the dusk forest, Pip the fox cub, the obstacles, the HUD
// and the title / pause / win / game-over screens. Pure canvas 2D, no images.
import {
  GOAL_DISTANCE,
  GROUND_Y,
  LANE_X,
  PALETTE,
  START_HEARTS,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function laneX(lane) {
  return LANE_X[lane] * VIEW_W;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const decor = createRandom(20261118);
  const stars = Array.from({ length: 80 }, () => ({
    x: decor.range(0, VIEW_W),
    y: decor.range(0, 240),
    r: decor.range(0.6, 2),
    tw: decor.range(0, Math.PI * 2),
  }));
  const trees = Array.from({ length: 26 }, (_, i) => ({
    x: i * 74 + decor.range(-18, 18),
    h: decor.range(46, 96),
    w: decor.range(26, 44),
  }));
  const tufts = Array.from({ length: 40 }, (_, i) => ({
    x: i * 26 + decor.range(-8, 8),
    h: decor.range(6, 14),
  }));

  function drawSky(state) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(0.82, PALETTE.skyLow);
    g.addColorStop(1, PALETTE.ground);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Stars twinkle with time.
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(state.time * 1.4 + s.tw));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff6d8';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Moon with a soft halo.
    const mx = 768;
    const my = 118;
    const glow = ctx.createRadialGradient(mx, my, 8, mx, my, 90);
    glow.addColorStop(0, PALETTE.moonGlow);
    glow.addColorStop(1, 'rgba(255, 233, 176, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 90, my - 90, 180, 180);
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(mx, my, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(214, 178, 120, 0.5)';
    ctx.beginPath();
    ctx.arc(mx - 10, my - 6, 7, 0, Math.PI * 2);
    ctx.arc(mx + 12, my + 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHills(state) {
    const scroll = state.distance * 9;
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 16) {
      const y = GROUND_Y - 96 - Math.sin((x + scroll * 0.4) * 0.008) * 34 - Math.sin((x + scroll * 0.4) * 0.021) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 16) {
      const y = GROUND_Y - 44 - Math.sin((x + scroll) * 0.011) * 20 - Math.sin((x + scroll) * 0.03) * 7;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  function drawTrees(state) {
    const scroll = state.distance * 22;
    ctx.fillStyle = PALETTE.tree;
    for (const t of trees) {
      let x = (t.x - scroll) % (VIEW_W + 160);
      if (x < -80) x += VIEW_W + 160;
      ctx.beginPath();
      ctx.moveTo(x - t.w / 2, GROUND_Y);
      ctx.lineTo(x, GROUND_Y - t.h);
      ctx.lineTo(x + t.w / 2, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, GROUND_Y - t.h - 6, t.w * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround(state) {
    const scroll = state.distance * 40;
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = PALETTE.groundTop;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 6);
    // Lane guides.
    ctx.strokeStyle = 'rgba(255, 246, 216, 0.13)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 18]);
    for (let l = 0; l < 3; l++) {
      ctx.beginPath();
      ctx.moveTo(laneX(l), GROUND_Y + 14);
      ctx.lineTo(laneX(l), VIEW_H - 8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Grass tufts scroll with the world.
    ctx.strokeStyle = PALETTE.grass;
    ctx.lineWidth = 2;
    for (const t of tufts) {
      let x = (t.x - scroll) % (VIEW_W + 40);
      if (x < -20) x += VIEW_W + 40;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      ctx.lineTo(x - 3, GROUND_Y + 4 - t.h);
      ctx.moveTo(x + 3, GROUND_Y + 4);
      ctx.lineTo(x + 6, GROUND_Y + 4 - t.h * 0.8);
      ctx.stroke();
    }
  }

  function drawLighthouse(state) {
    // The lighthouse fades in on the horizon as the goal nears.
    const near = Math.max(0, (state.distance - 700) / 300);
    if (near <= 0) return;
    const x = VIEW_W - 70;
    const baseY = GROUND_Y - 6;
    ctx.globalAlpha = near;
    ctx.fillStyle = '#f4ead2';
    ctx.beginPath();
    ctx.moveTo(x - 16, baseY);
    ctx.lineTo(x - 10, baseY - 132);
    ctx.lineTo(x + 10, baseY - 132);
    ctx.lineTo(x + 16, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8823a';
    ctx.fillRect(x - 12, baseY - 96, 24, 14);
    ctx.fillRect(x - 13, baseY - 52, 26, 14);
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(x, baseY - 142, 12, 0, Math.PI * 2);
    ctx.fill();
    // Its beam sweeps the sky.
    const sweep = Math.sin(state.time * 0.8) * 0.5;
    ctx.fillStyle = 'rgba(255, 233, 176, 0.16)';
    ctx.beginPath();
    ctx.moveTo(x, baseY - 142);
    ctx.lineTo(x - 260, baseY - 142 - 90 + sweep * 60);
    ctx.lineTo(x - 260, baseY - 142 - 30 + sweep * 60);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawRock(e) {
    ctx.fillStyle = '#6f6a80';
    ctx.beginPath();
    ctx.moveTo(e.x - 30, GROUND_Y);
    ctx.lineTo(e.x - 22, GROUND_Y - 34);
    ctx.lineTo(e.x - 4, GROUND_Y - 46);
    ctx.lineTo(e.x + 16, GROUND_Y - 38);
    ctx.lineTo(e.x + 30, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8b86a0';
    ctx.beginPath();
    ctx.moveTo(e.x - 22, GROUND_Y - 34);
    ctx.lineTo(e.x - 4, GROUND_Y - 46);
    ctx.lineTo(e.x + 8, GROUND_Y - 30);
    ctx.lineTo(e.x - 10, GROUND_Y - 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.grass;
    ctx.beginPath();
    ctx.ellipse(e.x - 14, GROUND_Y - 36, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBramble(e) {
    // A thorn arch: slide under it, never run through it.
    ctx.strokeStyle = '#3d2b4d';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(e.x - 26, GROUND_Y);
    ctx.lineTo(e.x - 26, GROUND_Y - 62);
    ctx.lineTo(e.x + 26, GROUND_Y - 62);
    ctx.lineTo(e.x + 26, GROUND_Y);
    ctx.stroke();
    ctx.fillStyle = '#7a4a8f';
    for (let i = -1; i <= 1; i++) {
      const tx = e.x + i * 22;
      ctx.beginPath();
      ctx.moveTo(tx - 6, GROUND_Y - 62);
      ctx.lineTo(tx, GROUND_Y - 76);
      ctx.lineTo(tx + 6, GROUND_Y - 62);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#c65f8f';
    ctx.beginPath();
    ctx.arc(e.x - 26, GROUND_Y - 62, 4, 0, Math.PI * 2);
    ctx.arc(e.x + 26, GROUND_Y - 62, 4, 0, Math.PI * 2);
    ctx.arc(e.x, GROUND_Y - 62, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBoulder(e) {
    ctx.fillStyle = '#4d4763';
    ctx.beginPath();
    ctx.arc(e.x, GROUND_Y - 40, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a6486';
    ctx.beginPath();
    ctx.arc(e.x - 10, GROUND_Y - 52, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#332e47';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.x - 18, GROUND_Y - 66);
    ctx.lineTo(e.x - 6, GROUND_Y - 48);
    ctx.lineTo(e.x - 14, GROUND_Y - 28);
    ctx.stroke();
  }

  function drawFirefly(e, state) {
    const pulse = 0.7 + 0.3 * Math.sin(state.time * 6 + e.x * 0.05);
    const glow = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, 18 * pulse);
    glow.addColorStop(0, 'rgba(255, 224, 102, 0.9)');
    glow.addColorStop(1, 'rgba(255, 224, 102, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 18 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.firefly;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.arc(e.x - 1.5, e.y - 1.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHeartPickup(e, state) {
    const bob = Math.sin(state.time * 3 + e.x * 0.02) * 4;
    drawHeartShape(e.x, e.y + bob, 13, PALETTE.heart);
  }

  function drawStarPickup(e, state) {
    const bob = Math.sin(state.time * 3 + e.x * 0.02) * 4;
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    ctx.rotate(state.time * 0.8);
    ctx.fillStyle = '#9be8ff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHeartShape(x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s, x + s * 1.3, y, x, y + s * 0.9);
    ctx.fill();
  }

  function drawPlayer(state) {
    const p = state.player;
    if (p.invincible > 0 && Math.floor(state.time * 12) % 2 === 0) return; // blink while hurt
    const runPhase = state.time * 14;
    const bob = onGround(p) && !p.sliding ? Math.abs(Math.sin(runPhase)) * 3 : 0;
    const feetY = GROUND_Y - p.height - bob;
    const x = p.x;
    ctx.save();
    ctx.translate(x, feetY);
    if (p.sliding) ctx.scale(1.25, 0.62);
    // Tail (wags as he runs).
    const wag = Math.sin(runPhase) * 6;
    ctx.fillStyle = PALETTE.pipBody;
    ctx.beginPath();
    ctx.ellipse(-26, -14 + wag * 0.3, 18, 9, -0.5 + wag * 0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.pipBelly;
    ctx.beginPath();
    ctx.ellipse(-38, -10 + wag * 0.3, 8, 6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Legs.
    ctx.fillStyle = PALETTE.pipDark;
    const legSwing = onGround(p) && !p.sliding ? Math.sin(runPhase) * 7 : 0;
    ctx.fillRect(-8 + legSwing, -12, 6, 12);
    ctx.fillRect(6 - legSwing, -12, 6, 12);
    // Body.
    ctx.fillStyle = PALETTE.pipBody;
    ctx.beginPath();
    ctx.ellipse(0, -22, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.pipBelly;
    ctx.beginPath();
    ctx.ellipse(6, -18, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head + ears.
    ctx.fillStyle = PALETTE.pipBody;
    ctx.beginPath();
    ctx.arc(16, -38, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -46);
    ctx.lineTo(10, -60);
    ctx.lineTo(18, -48);
    ctx.closePath();
    ctx.moveTo(20, -48);
    ctx.lineTo(26, -60);
    ctx.lineTo(28, -46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.pipBelly;
    ctx.beginPath();
    ctx.moveTo(11, -48);
    ctx.lineTo(12, -55);
    ctx.lineTo(16, -49);
    ctx.closePath();
    ctx.fill();
    // Eye, nose, cheek glow.
    ctx.fillStyle = '#241a33';
    ctx.beginPath();
    ctx.arc(21, -39, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(29, -34, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 224, 102, 0.85)';
    ctx.beginPath();
    ctx.arc(14, -30, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Shield bubble.
    if (p.shield > 0) {
      ctx.strokeStyle = 'rgba(155, 232, 255, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, feetY - 24, 40 + Math.sin(state.time * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + 6, 26 - p.height * 0.12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function onGround(p) {
    return p.height <= 0;
  }

  function drawParticles(state) {
    for (const pt of state.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHud(state, best, muted) {
    ctx.textBaseline = 'alphabetic';
    // Hearts.
    for (let i = 0; i < START_HEARTS; i++) {
      drawHeartShape(34 + i * 32, 34, 11, i < state.hearts ? PALETTE.heart : 'rgba(255,255,255,0.18)');
    }
    // Score.
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = 'bold 30px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(state.score)}`, 24, 84);
    ctx.font = '15px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText('SCORE', 24, 104);
    // Combo badge.
    if (state.combo >= 2) {
      const mult = Math.min(4, 1 + (state.combo - 1) * 0.5);
      ctx.fillStyle = 'rgba(255, 217, 77, 0.92)';
      roundRect(ctx, 24, 116, 172, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#241a33';
      ctx.font = 'bold 15px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText(`COMBO x${mult.toFixed(1)}  (${state.combo})`, 34, 136);
    }
    // Distance progress to the lighthouse.
    const barX = 330;
    const barW = 300;
    const barY = 26;
    ctx.fillStyle = 'rgba(255, 246, 216, 0.18)';
    roundRect(ctx, barX, barY, barW, 14, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.accent;
    roundRect(ctx, barX, barY, barW * Math.min(1, state.distance / GOAL_DISTANCE), 14, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = 'bold 16px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(state.distance)} m / ${GOAL_DISTANCE} m`, barX + barW / 2, barY + 34);
    ctx.font = '13px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText('to the lighthouse', barX + barW / 2, barY + 52);
    // Best + mute + pause.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '14px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText(`BEST ${Math.max(best, Math.floor(state.score))}`, VIEW_W - 66, 34);
    ctx.fillText(muted ? 'MUTED (M)' : 'MUSIC ON (M)', VIEW_W - 66, 54);
    ctx.fillStyle = 'rgba(255, 246, 216, 0.85)';
    ctx.fillRect(VIEW_W - 44, 18, 5, 20);
    ctx.fillRect(VIEW_W - 34, 18, 5, 20);
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(20, 14, 40, 0.72)';
    roundRect(ctx, 150, 96, 660, 348, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    roundRect(ctx, 150, 96, 660, 348, 18);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText(title, VIEW_W / 2, 160);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '19px "Trebuchet MS", "Segoe UI", sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 206 + i * 32));
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(20, 14, 40, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = 'bold 84px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText('LUMEN RUN', VIEW_W / 2, 148);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '21px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText('Pip the fox cub must reach the lighthouse, 1000 m through the night forest.', VIEW_W / 2, 188);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '18px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText('← → switch lane   •   ↑ / SPACE jump the rocks   •   ↓ slide under the brambles', VIEW_W / 2, 238);
    ctx.fillText('Boulders block a whole lane — dodge them. Catch fireflies, mind your 3 hearts.', VIEW_W / 2, 266);
    ctx.fillText('Mouse: move to steer, click to jump. Touch: swipe to move, tap to jump.', VIEW_W / 2, 294);
    if (best > 0) {
      ctx.fillStyle = PALETTE.accent;
      ctx.font = 'bold 20px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText(`BEST SCORE  ${best}`, VIEW_W / 2, 340);
    }
    const pulse = 0.65 + 0.35 * Math.sin(state.time * 3);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff6d8';
    ctx.font = 'bold 26px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText('PRESS ENTER OR CLICK TO RUN', VIEW_W / 2, 400);
    ctx.globalAlpha = 1;
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 14, 40, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    panel('PAUSED', ['Take a breath. The forest waits.', '', 'P resume   •   R restart   •   M mute'], PALETTE.hudText);
  }

  function drawOver(state, best) {
    panel('THE FOREST GOT YOU', [
      `You ran ${Math.floor(state.distance)} m and scored ${Math.floor(state.score)}.`,
      `Firefly streak: best combo ${state.bestCombo}.   Best score: ${Math.max(best, Math.floor(state.score))}.`,
      '',
      'Press R or ENTER — or click — to run again.',
    ], PALETTE.danger);
  }

  function drawWin(state, best) {
    panel('YOU REACHED THE LIGHTHOUSE!', [
      `Pip made it — ${GOAL_DISTANCE} m through the night forest.`,
      `Final score ${Math.floor(state.score)}   •   best combo ${state.bestCombo}   •   best ${Math.max(best, Math.floor(state.score))}.`,
      '',
      'Press R or ENTER — or click — to run it again, faster.',
    ], PALETTE.accent);
  }

  function draw(state, screen, best, muted) {
    ctx.save();
    if (state.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawSky(state);
    drawHills(state);
    drawTrees(state);
    drawGround(state);
    drawLighthouse(state);
    for (const e of state.entities) {
      if (e.kind === 'rock') drawRock(e);
      else if (e.kind === 'bramble') drawBramble(e);
      else if (e.kind === 'boulder') drawBoulder(e);
      else if (e.kind === 'firefly') drawFirefly(e, state);
      else if (e.kind === 'heart') drawHeartPickup(e, state);
      else if (e.kind === 'star') drawStarPickup(e, state);
    }
    drawPlayer(state);
    drawParticles(state);
    ctx.restore();
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(${state.flashColor}, ${state.flash})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
    else drawHud(state, best, muted);
  }

  return { draw };
}
