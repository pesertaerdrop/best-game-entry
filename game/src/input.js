// Keyboard, mouse and touch input, reduced to named actions the game reads once a frame.
// Nothing here knows about screens: main.js decides what each action means where.
import {
  KEY_CONFIRM,
  KEY_JUMP,
  KEY_LEFT,
  KEY_MUTE,
  KEY_PAUSE,
  KEY_RESTART,
  KEY_RIGHT,
  KEY_SLIDE,
} from './config.js';

export const ACTION_LEFT = 'left';
export const ACTION_RIGHT = 'right';
export const ACTION_JUMP = 'jump';
export const ACTION_SLIDE = 'slide';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

function actionForKey(key) {
  if (KEY_LEFT.includes(key)) return ACTION_LEFT;
  if (KEY_RIGHT.includes(key)) return ACTION_RIGHT;
  if (KEY_JUMP.includes(key)) return ACTION_JUMP;
  if (KEY_SLIDE.includes(key)) return ACTION_SLIDE;
  if (KEY_CONFIRM.includes(key)) return ACTION_CONFIRM;
  if (KEY_PAUSE.includes(key)) return ACTION_PAUSE;
  if (KEY_RESTART.includes(key)) return ACTION_RESTART;
  if (KEY_MUTE.includes(key)) return ACTION_MUTE;
  return null;
}

export function createInput(canvas) {
  const queue = [];
  let mouseLane = -1; // lane the pointer hovers, -1 for none
  let mouseDownAt = 0;

  function push(action) {
    if (action) queue.push(action);
  }

  function onKeyDown(event) {
    const action = actionForKey(event.key);
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) push(action);
  }

  function laneFromClientX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 960;
    if (x < 320) return 0;
    if (x < 640) return 1;
    return 2;
  }

  function onMouseMove(event) {
    mouseLane = laneFromClientX(event.clientX);
  }

  function onMouseDown(event) {
    mouseDownAt = performance.now();
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 960;
    const y = ((event.clientY - rect.top) / rect.height) * 540;
    // The pause button lives top-right; everything else is steer + jump.
    if (x > 880 && y < 60) {
      push(ACTION_PAUSE);
      return;
    }
    mouseLane = laneFromClientX(event.clientX);
    push(ACTION_JUMP);
  }

  function onMouseUp() {
    mouseDownAt = 0;
  }

  let touchStartX = 0;
  let touchStartY = 0;
  function onTouchStart(event) {
    const t = event.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    event.preventDefault();
  }
  function onTouchEnd(event) {
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
      push(dx < 0 ? ACTION_LEFT : ACTION_RIGHT);
    } else if (dy < -28) {
      push(ACTION_JUMP);
    } else if (dy > 28) {
      push(ACTION_SLIDE);
    } else {
      push(ACTION_JUMP);
    }
    event.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });

  return {
    // Drain this frame's actions, oldest first.
    drain() {
      return queue.splice(0, queue.length);
    },
    // The lane the pointer currently hovers over (-1 when it never moved).
    get mouseLane() {
      return mouseLane;
    },
    get mouseDown() {
      return mouseDownAt > 0;
    },
  };
}
