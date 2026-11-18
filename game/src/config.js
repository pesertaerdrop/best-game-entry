// LUMEN RUN — tuning, palette and rules in one place.
// Pip the fox cub dashes through the night forest to the lighthouse, 1000 m away.
// Three lanes, one jump, one slide: rocks are jumped, brambles are slid under,
// boulders must be dodged by changing lane. Three hearts; reach the light to win.
export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 432;
export const GOAL_DISTANCE = 1000;
export const START_HEARTS = 3;
export const BEST_KEY = 'lumen-run-best';

// Lane centres as fractions of the view width.
export const LANE_X = [0.3, 0.5, 0.7];

// Physics (per 1/60 s step, pixels).
export const JUMP_VELOCITY = 13.5;
export const GRAVITY = 0.72;
export const SLIDE_SECONDS = 0.62;
export const LANE_SWITCH_SPEED = 0.22;

// Difficulty ramp: speed and spawn gap move with distance.
export const BASE_SPEED = 5.4;
export const MAX_SPEED = 12.5;
export const SPEED_RAMP_METRES = 260;
export const BASE_SPAWN_SECONDS = 0.95;
export const MIN_SPAWN_SECONDS = 0.42;

// Scoring.
export const FIREFLY_POINTS = 10;
export const METRE_POINTS = 1;
export const COMBO_STEP = 0.5;
export const MAX_COMBO_MULTIPLIER = 4;

export const PALETTE = {
  skyTop: '#1b1740',
  skyMid: '#3b2a63',
  skyLow: '#c65f3c',
  moon: '#ffe9b0',
  moonGlow: 'rgba(255, 233, 176, 0.35)',
  hillFar: '#2c2350',
  hillNear: '#221a3e',
  tree: '#171233',
  ground: '#241a33',
  groundTop: '#3a2b52',
  grass: '#7ec850',
  hudText: '#fff6d8',
  hudDim: '#cbb8e8',
  accent: '#ffd94d',
  danger: '#ff5a6e',
  heart: '#ff6b81',
  firefly: '#ffe066',
  pipBody: '#e8823a',
  pipBelly: '#ffe3c2',
  pipDark: '#8a4b1d',
};

// Keyboard: arrows/WASD/Space, P pause, M mute, R restart, Enter confirm.
export const KEY_LEFT = ['ArrowLeft', 'a', 'A'];
export const KEY_RIGHT = ['ArrowRight', 'd', 'D'];
export const KEY_JUMP = ['ArrowUp', 'w', 'W', ' '];
export const KEY_SLIDE = ['ArrowDown', 's', 'S'];
export const KEY_PAUSE = ['p', 'P', 'Escape'];
export const KEY_MUTE = ['m', 'M'];
export const KEY_RESTART = ['r', 'R'];
export const KEY_CONFIRM = ['Enter'];
