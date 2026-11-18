// Staged scenes for the three screenshots (?shot=start|play|end&seed=N).
// Each one places the world exactly, so a screenshot is the same every time.
import { GROUND_Y } from './config.js';
import { SCREEN_OVER, SCREEN_TITLE } from './render.js';

export function stageShot(name, world) {
  if (name === 'start') {
    world.stage({
      state: { distance: 0, score: 0, combo: 0, hearts: 3, time: 6.2 },
      player: { lane: 0, height: 0 },
      entities: [
        { kind: 'rock', lane: 2, x: 620, y: 0 },
        { kind: 'bramble', lane: 1, x: 780, y: 0 },
        { kind: 'firefly', lane: 0, x: 560, y: GROUND_Y - 30 },
        { kind: 'firefly', lane: 0, x: 612, y: GROUND_Y - 44 },
        { kind: 'firefly', lane: 0, x: 664, y: GROUND_Y - 30 },
        { kind: 'firefly', lane: 2, x: 880, y: GROUND_Y - 118 },
      ],
    });
    return { screen: SCREEN_TITLE, best: 2340 };
  }
  if (name === 'play') {
    world.stage({
      state: { distance: 420, score: 1250, combo: 5, bestCombo: 7, hearts: 2, time: 9.4, speed: 8.1 },
      player: { lane: 0, height: 72, vy: 4 },
      entities: [
        { kind: 'rock', lane: 0, x: 330, y: 0 },
        { kind: 'bramble', lane: 1, x: 520, y: 0 },
        { kind: 'boulder', lane: 2, x: 700, y: 0 },
        { kind: 'firefly', lane: 0, x: 420, y: GROUND_Y - 118 },
        { kind: 'firefly', lane: 0, x: 472, y: GROUND_Y - 132 },
        { kind: 'firefly', lane: 2, x: 820, y: GROUND_Y - 30 },
        { kind: 'firefly', lane: 2, x: 872, y: GROUND_Y - 44 },
        { kind: 'star', lane: 1, x: 640, y: GROUND_Y - 34 },
      ],
    });
    return { screen: 'play', best: 2340 };
  }
  // end: the run is over — the boulder in Pip's lane got him.
  world.stage({
    state: { distance: 640, score: 2340, combo: 0, bestCombo: 9, hearts: 0, time: 12.8, flash: 0.22, flashColor: '255, 90, 110' },
    player: { lane: 1, height: 0 },
    entities: [
      { kind: 'boulder', lane: 1, x: 330, y: 0 },
      { kind: 'rock', lane: 0, x: 560, y: 0 },
      { kind: 'firefly', lane: 2, x: 700, y: GROUND_Y - 30 },
      { kind: 'firefly', lane: 2, x: 752, y: GROUND_Y - 44 },
    ],
  });
  return { screen: SCREEN_OVER, best: 2340 };
}
