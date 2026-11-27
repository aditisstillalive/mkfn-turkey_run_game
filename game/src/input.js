// Keyboard and mouse: held keys for movement, one-shot presses for jumps and menus, and the
// mouse position and clicks mapped into the game's 1280x720 view.

import { VIEW } from './config.js';

const BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  pie: ['KeyF', 'KeyE'],
  pause: ['Escape', 'KeyP'],
  mute: ['KeyM'],
  confirm: ['Enter', 'Space'],
  restart: ['KeyR'],
  title: ['KeyT'],
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, down: false };

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  // Losing focus drops every held key (no stuck sprint), and the click that brings the window
  // back is only a focus click, never a pie drop or a button press.
  let focusedAt = -1e9;
  window.addEventListener('blur', () => held.clear());
  window.addEventListener('focus', () => { focusedAt = performance.now(); });

  const toView = (e) => {
    const r = canvas.getBoundingClientRect();
    const scale = Math.min(r.width / VIEW.w, r.height / VIEW.h);
    const ox = r.left + (r.width - VIEW.w * scale) / 2;
    const oy = r.top + (r.height - VIEW.h * scale) / 2;
    mouse.x = (e.clientX - ox) / scale;
    mouse.y = (e.clientY - oy) / scale;
  };
  canvas.addEventListener('mousemove', toView);
  canvas.addEventListener('mousedown', (e) => {
    toView(e);
    if (e.button !== 0) return;          // right and middle clicks do nothing
    mouse.down = true;
    if (performance.now() - focusedAt > 250) mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const any = (action, set) => BINDINGS[action].some((code) => set.has(code));

  return {
    mouse,
    isHeld: (action) => any(action, held),
    wasPressed: (action) => any(action, pressed),
    anyPressed: () => pressed.size > 0 || mouse.clicked,
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
