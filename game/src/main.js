// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between five screens:
// title, play, paused, game over and win.
//
// ?seed=N fixes the run's randomness. ?shot=start|play|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, VIEW_H, VIEW_W } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_OVER, EVENT_WIN } from './world.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_JUMP,
  ACTION_LEFT,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  ACTION_RIGHT,
  ACTION_SLIDE,
  createInput,
} from './input.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const STEP = 1 / 60;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const audioApi = audio;
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastMouseLane = -1;

  // The title screen plays itself behind the menu: the forest scrolls and Pip runs.
  world.setAutoPilot(true);

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    world.setAutoPilot(false);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audioApi.unlock();
    audioApi.click();
    announce('Running! Reach the lighthouse, 1000 metres away.');
  }

  function endGame(won) {
    const finalScore = Math.floor(world.state.score);
    if (finalScore > best) {
      best = finalScore;
      saveBest(best);
    }
    if (won) {
      screen = SCREEN_WIN;
      audioApi.win();
      announce(`You reached the lighthouse! Score ${finalScore}. Best ${best}.`);
    } else {
      screen = SCREEN_OVER;
      audioApi.lose();
      announce(`Game over. Score ${finalScore}. Best ${best}.`);
    }
  }

  function handleEvents(events) {
    for (const e of events) {
      if (e === 'jump') audioApi.jump();
      else if (e === 'slide') audioApi.slide();
      else if (e === 'pickup') audioApi.pickup(world.state.combo);
      else if (e === 'heart') {
        audioApi.heart();
        announce(`A heart! ${world.state.hearts} hearts.`);
      } else if (e === 'shield') {
        audioApi.shield();
        announce('Star shield! One hit is blocked.');
      } else if (e === 'shield-break') {
        audioApi.hit();
        announce('The shield broke — it saved you.');
      } else if (e === EVENT_HIT) {
        audioApi.hit();
        announce(`Ouch! ${world.state.hearts} hearts left.`);
      } else if (e === EVENT_WIN) endGame(true);
      else if (e === EVENT_OVER) endGame(false);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    let elapsed = (now - last) / 1000;
    last = now;
    if (elapsed > MAX_FRAME) elapsed = MAX_FRAME;
    const actions = input.drain();
    let muted = audioApi.muted;

    for (const a of actions) {
      if (a === ACTION_MUTE) {
        muted = audioApi.toggleMute();
        continue;
      }
      if (screen === SCREEN_TITLE) {
        if (a === ACTION_CONFIRM || a === ACTION_JUMP) startGame();
        continue;
      }
      if (screen === SCREEN_PLAY) {
        if (a === ACTION_PAUSE) {
          screen = SCREEN_PAUSED;
          announce('Paused.');
        } else if (a === ACTION_RESTART) {
          startGame();
        }
        continue;
      }
      if (screen === SCREEN_PAUSED) {
        if (a === ACTION_PAUSE || a === ACTION_CONFIRM) {
          screen = SCREEN_PLAY;
          announce('Running again.');
        } else if (a === ACTION_RESTART) {
          startGame();
        }
        continue;
      }
      // Over / win screens: any confirm, jump or restart runs again.
      if (a === ACTION_CONFIRM || a === ACTION_JUMP || a === ACTION_RESTART) startGame();
    }

    if (screen === SCREEN_TITLE) {
      world.update([]);
      world.state.events.length = 0; // the demo run is silent behind the menu
      if (world.state.over || world.state.won) world.reset(); // the demo never stays dead
    } else if (screen === SCREEN_PLAY) {
      // The pointer steers: hovering a third of the screen picks that lane.
      const mouseLane = input.mouseLane;
      if (mouseLane !== -1 && mouseLane !== lastMouseLane) {
        world.switchLane(mouseLane - world.state.player.lane);
        lastMouseLane = mouseLane;
      }
      accumulator += elapsed;
      while (accumulator >= STEP) {
        world.update(actions.splice(0));
        accumulator -= STEP;
      }
      handleEvents(world.state.events.splice(0));
      if (world.state.over || world.state.won) {
        // endGame already ran through the event; nothing more to do here.
      }
    }

    renderer.draw(world.state, screen, best, muted);
  }

  announce('Lumen Run. Press Enter or click to run.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
