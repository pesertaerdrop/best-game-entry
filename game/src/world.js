// The game itself: Pip's run through the night forest.
// One fixed step (1/60 s) advances physics, spawns, collisions and score; main.js
// calls it and reads state + the events it raised (sounds and announcements).
import {
  BASE_SPAWN_SECONDS,
  BASE_SPEED,
  COMBO_STEP,
  FIREFLY_POINTS,
  GOAL_DISTANCE,
  GRAVITY,
  GROUND_Y,
  JUMP_VELOCITY,
  LANE_X,
  MAX_COMBO_MULTIPLIER,
  MAX_SPEED,
  METRE_POINTS,
  MIN_SPAWN_SECONDS,
  SLIDE_SECONDS,
  SPEED_RAMP_METRES,
  START_HEARTS,
  VIEW_W,
} from './config.js';
import { createRandom } from './random.js';

export const EVENT_JUMP = 'jump';
export const EVENT_SLIDE = 'slide';
export const EVENT_PICKUP = 'pickup';
export const EVENT_HEART = 'heart';
export const EVENT_SHIELD = 'shield';
export const EVENT_SHIELD_BREAK = 'shield-break';
export const EVENT_HIT = 'hit';
export const EVENT_WIN = 'win';
export const EVENT_OVER = 'over';
export const EVENT_DODGE = 'dodge';

const STEP = 1 / 60;
const PLAYER_X = 250;
const PLAYER_HALF_W = 26;
const HIT_INVINCIBLE_STEPS = 90;
const SHIELD_STEPS = 240;

function laneX(lane) {
  return LANE_X[lane] * VIEW_W;
}

function speedFor(distance) {
  return Math.min(MAX_SPEED, BASE_SPEED + distance / SPEED_RAMP_METRES);
}

function spawnGapFor(distance) {
  const t = Math.min(1, distance / 700);
  return BASE_SPAWN_SECONDS - t * (BASE_SPAWN_SECONDS - MIN_SPAWN_SECONDS);
}

export function createWorld(random) {
  const state = {
    distance: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: START_HEARTS,
    speed: BASE_SPEED,
    time: 0,
    over: false,
    won: false,
    shake: 0,
    flash: 0,
    flashColor: '255, 90, 110',
    player: {
      lane: 1,
      x: laneX(1),
      height: 0,
      vy: 0,
      sliding: false,
      slideLeft: 0,
      invincible: 0,
      shield: 0,
    },
    entities: [],
    particles: [],
    events: [],
    spawnIn: 1.1,
    autoPilot: false,
  };

  function reset() {
    const keepAutoPilot = state.autoPilot;
    state.distance = 0;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = START_HEARTS;
    state.speed = BASE_SPEED;
    state.time = 0;
    state.over = false;
    state.won = false;
    state.shake = 0;
    state.flash = 0;
    state.player.lane = 1;
    state.player.x = laneX(1);
    state.player.height = 0;
    state.player.vy = 0;
    state.player.sliding = false;
    state.player.slideLeft = 0;
    state.player.invincible = 0;
    state.player.shield = 0;
    state.entities.length = 0;
    state.particles.length = 0;
    state.events.length = 0;
    state.spawnIn = 1.1;
    state.autoPilot = keepAutoPilot;
  }

  function burst(x, y, color, count, power) {
    for (let i = 0; i < count; i++) {
      const angle = random.range(0, Math.PI * 2);
      const v = random.range(power * 0.3, power);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 1,
        life: random.range(18, 42),
        maxLife: 42,
        color,
        size: random.range(2, 5),
        gravity: 0.08,
      });
    }
  }

  function addFireflyArc(lane, high) {
    const baseY = high ? GROUND_Y - 118 : GROUND_Y - 30;
    for (let i = 0; i < 3; i++) {
      state.entities.push({
        kind: 'firefly', lane, x: VIEW_W + 70 + i * 52,
        y: baseY - (i === 1 ? 14 : 0), taken: false, passed: false,
      });
    }
  }

  function spawnPattern() {
    const d = state.distance;
    const roll = random.next();
    // Rare gifts first, only when they matter.
    if (state.hearts < START_HEARTS && roll < 0.05) {
      state.entities.push({ kind: 'heart', lane: random.int(0, 2), x: VIEW_W + 70, y: GROUND_Y - 34, taken: false, passed: false });
      return;
    }
    if (roll < 0.09) {
      state.entities.push({ kind: 'star', lane: random.int(0, 2), x: VIEW_W + 70, y: GROUND_Y - 34, taken: false, passed: false });
      return;
    }
    const lane = random.int(0, 2);
    if (d < 150) {
      if (roll < 0.45) {
        state.entities.push({ kind: 'rock', lane, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      } else if (roll < 0.7) {
        state.entities.push({ kind: 'bramble', lane, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      } else {
        addFireflyArc(lane, false);
      }
      return;
    }
    if (roll < 0.2) {
      state.entities.push({ kind: 'rock', lane, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      addFireflyArc((lane + 1) % 3, true);
    } else if (roll < 0.38) {
      state.entities.push({ kind: 'bramble', lane, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      addFireflyArc((lane + 2) % 3, false);
    } else if (roll < 0.52) {
      // Two rocks, one free lane.
      const free = random.int(0, 2);
      for (let l = 0; l < 3; l++) {
        if (l !== free) state.entities.push({ kind: 'rock', lane: l, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      }
      addFireflyArc(free, false);
    } else if (roll < 0.66) {
      // A boulder blocks one lane outright; the others stay open.
      state.entities.push({ kind: 'boulder', lane, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      addFireflyArc((lane + 1) % 3, true);
    } else if (roll < 0.8) {
      state.entities.push({ kind: 'rock', lane, x: VIEW_W + 70, y: 0, taken: false, passed: false });
      state.entities.push({ kind: 'bramble', lane: (lane + 1) % 3, x: VIEW_W + 150, y: 0, taken: false, passed: false });
    } else {
      addFireflyArc(lane, random.chance(0.5));
      if (random.chance(0.5)) addFireflyArc((lane + 1) % 3, true);
    }
  }

  function onGround() {
    return state.player.height <= 0;
  }

  function tryJump() {
    if (!onGround() || state.over || state.won) return;
    state.player.vy = JUMP_VELOCITY;
    state.player.sliding = false;
    state.events.push(EVENT_JUMP);
  }

  function trySlide() {
    if (!onGround() || state.over || state.won) return;
    state.player.sliding = true;
    state.player.slideLeft = SLIDE_SECONDS;
    state.events.push(EVENT_SLIDE);
  }

  function switchLane(dir) {
    const next = Math.max(0, Math.min(2, state.player.lane + dir));
    state.player.lane = next;
  }

  function autoPilot() {
    const p = state.player;
    for (const e of state.entities) {
      const dx = e.x - p.x;
      if (dx < 40 || dx > 420) continue;
      if (Math.abs(laneX(e.lane) - p.x) > 50) continue;
      if (e.kind === 'rock') {
        if (onGround()) tryJump();
        else if (p.height < 20 && p.vy < 0) dodgeToFreeLane(e);
      } else if (e.kind === 'bramble' && onGround()) {
        trySlide();
      } else if (e.kind === 'boulder') {
        dodgeToFreeLane(e);
      }
    }
  }

  function dodgeToFreeLane(obstacle) {
    const p = state.player;
    const free = [0, 1, 2].find(
      (l) =>
        l !== obstacle.lane &&
        !state.entities.some((o) => o.lane === l && Math.abs(o.x - obstacle.x) < 170 && o.kind !== 'firefly' && o.kind !== 'heart' && o.kind !== 'star'),
    );
    if (free !== undefined) p.lane = free;
  }

  function hitObstacle(entity) {
    const p = state.player;
    if (p.invincible > 0) return;
    if (p.shield > 0) {
      p.shield = 0;
      p.invincible = 60;
      entity.taken = true;
      burst(p.x, GROUND_Y - 40, '#9be8ff', 22, 5);
      state.events.push(EVENT_SHIELD_BREAK);
      return;
    }
    state.hearts -= 1;
    state.combo = 0;
    p.invincible = HIT_INVINCIBLE_STEPS;
    state.shake = 14;
    state.flash = 0.55;
    state.flashColor = '255, 90, 110';
    burst(p.x, GROUND_Y - 40, '#ff5a6e', 26, 6);
    state.events.push(EVENT_HIT);
    if (state.hearts <= 0) {
      state.over = true;
      state.events.push(EVENT_OVER);
    }
  }

  function update(actions) {
    if (state.over || state.won) return;
    state.time += STEP;
    state.speed = speedFor(state.distance);
    const p = state.player;

    if (state.autoPilot) {
      autoPilot();
    } else {
      for (const a of actions) {
        if (a === 'left') switchLane(-1);
        else if (a === 'right') switchLane(1);
        else if (a === 'jump') tryJump();
        else if (a === 'slide') trySlide();
      }
    }

    // Lane drift and vertical motion.
    const targetX = laneX(p.lane);
    p.x += (targetX - p.x) * 0.22;
    if (p.height > 0 || p.vy > 0) {
      p.height += p.vy;
      p.vy -= GRAVITY;
      if (p.height <= 0) {
        p.height = 0;
        p.vy = 0;
        burst(p.x, GROUND_Y, '#8a7bb8', 6, 1.6);
      }
    }
    if (p.sliding) {
      p.slideLeft -= STEP;
      if (p.slideLeft <= 0) p.sliding = false;
    }
    if (p.invincible > 0) p.invincible -= 1;
    if (p.shield > 0) p.shield -= 1;
    if (state.shake > 0) state.shake *= 0.86;
    if (state.flash > 0) state.flash = Math.max(0, state.flash - 0.03);

    // Distance and score: metres tick by with speed.
    const metres = state.speed * 0.028;
    state.distance += metres;
    state.score += metres * METRE_POINTS;
    if (state.distance >= GOAL_DISTANCE) {
      state.distance = GOAL_DISTANCE;
      state.won = true;
      state.flash = 0.5;
      state.flashColor = '255, 217, 77';
      for (let i = 0; i < 5; i++) {
        burst(p.x + (i - 2) * 60, GROUND_Y - 120 - i * 18, ['#ffd94d', '#ffe066', '#9be8ff'][i % 3], 18, 4);
      }
      state.events.push(EVENT_WIN);
      return;
    }

    // Spawning.
    state.spawnIn -= STEP;
    if (state.spawnIn <= 0) {
      spawnPattern();
      state.spawnIn = spawnGapFor(state.distance) * random.range(0.85, 1.2);
    }

    // Entities move left; collisions resolve at the player's x.
    const feetY = GROUND_Y - p.height;
    for (const e of state.entities) {
      e.x -= state.speed;
      if (e.x < -90) {
        e.taken = true;
        continue;
      }
      const dx = Math.abs(e.x - p.x);
      const sameLane = Math.abs(laneX(e.lane) - p.x) < 52;
      if (!e.passed && e.x < p.x - 10) {
        e.passed = true;
        if (e.kind === 'rock' || e.kind === 'bramble' || e.kind === 'boulder') {
          state.score += 5;
          state.events.push(EVENT_DODGE);
        }
      }
      if (e.taken || dx > 46) continue;
      if (e.kind === 'firefly') {
        if (Math.abs(e.y - feetY) < 52) {
          e.taken = true;
          state.combo += 1;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          const mult = Math.min(MAX_COMBO_MULTIPLIER, 1 + (state.combo - 1) * COMBO_STEP);
          state.score += FIREFLY_POINTS * mult;
          burst(e.x, e.y, '#ffe066', 12, 3);
          state.events.push(EVENT_PICKUP);
        }
      } else if (e.kind === 'heart') {
        if (Math.abs(e.y - feetY) < 56) {
          e.taken = true;
          state.hearts = Math.min(START_HEARTS, state.hearts + 1);
          burst(e.x, e.y, '#ff6b81', 14, 3);
          state.events.push(EVENT_HEART);
        }
      } else if (e.kind === 'star') {
        if (Math.abs(e.y - feetY) < 56) {
          e.taken = true;
          p.shield = SHIELD_STEPS;
          burst(e.x, e.y, '#9be8ff', 16, 3);
          state.events.push(EVENT_SHIELD);
        }
      } else if (sameLane) {
        if (e.kind === 'rock' && p.height < 34) hitObstacle(e);
        else if (e.kind === 'bramble' && !p.sliding) hitObstacle(e);
        else if (e.kind === 'boulder') hitObstacle(e);
      }
    }
    state.entities = state.entities.filter((e) => !e.taken && e.x > -90);

    // Particles age.
    for (const pt of state.particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += pt.gravity;
      pt.life -= 1;
    }
    state.particles = state.particles.filter((pt) => pt.life > 0);
  }

  return {
    state,
    reset,
    update,
    tryJump,
    trySlide,
    switchLane,
    playerX: () => PLAYER_X,
    laneX,
    setAutoPilot(value) {
      state.autoPilot = value;
    },
    // For staged screenshots: place the world exactly as described.
    stage(scene) {
      reset();
      Object.assign(state, scene.state ?? {});
      state.entities = (scene.entities ?? []).map((e) => ({ taken: false, passed: false, ...e }));
      state.player = { ...state.player, ...(scene.player ?? {}) };
      state.player.x = laneX(state.player.lane);
    },
  };
}
