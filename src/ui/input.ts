import type { DriveInput } from '../sim/vehicle';

type Control = keyof DriveInput;

const KEYS: Record<string, Control> = {
  KeyW: 'gas',
  ArrowUp: 'gas',
  KeyS: 'brake',
  ArrowDown: 'brake',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export interface InputActions {
  /** H key or the horn button. */
  horn?: () => void;
  /** The first key press or touch (browsers only allow sound after one). */
  firstGesture?: () => void;
}

/**
 * Keyboard and on-screen buttons. Driving buttons are elements with data-ctl="gas|brake|left|right";
 * the horn is data-act="horn". Swipe-to-drive (ACC-3) arrives in M2c and feeds the same DriveInput.
 */
export function createInput(root: HTMLElement, actions: InputActions = {}): DriveInput {
  const input: DriveInput = { gas: 0, brake: 0, left: 0, right: 0 };
  const gesture = () => actions.firstGesture?.();
  window.addEventListener('keydown', gesture);
  window.addEventListener('pointerdown', gesture);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH' && !e.repeat) actions.horn?.();
    const c = KEYS[e.code];
    if (!c) return;
    input[c] = 1;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const c = KEYS[e.code];
    if (c) input[c] = 0;
  });
  window.addEventListener('blur', () => {
    input.gas = input.brake = input.left = input.right = 0;
  });

  for (const el of root.querySelectorAll<HTMLElement>('[data-ctl]')) {
    const c = el.dataset.ctl as Control;
    const press = (on: boolean) => (e: PointerEvent) => {
      input[c] = on ? 1 : 0;
      el.classList.toggle('on', on);
      if (on) el.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    el.addEventListener('pointerdown', press(true));
    el.addEventListener('pointerup', press(false));
    el.addEventListener('pointercancel', press(false));
  }
  root.querySelector<HTMLElement>('[data-act="horn"]')?.addEventListener('pointerdown', (e) => {
    actions.horn?.();
    e.preventDefault();
  });
  return input;
}
