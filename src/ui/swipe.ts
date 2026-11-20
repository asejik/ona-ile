/**
 * Swipe-to-drive (ACC-3): press anywhere on the road and drag, like a floating joystick.
 * Up is forward, down is brake then reverse, and the angle mixes in steering. How far you drag sets the
 * strength; letting go coasts. It writes into the same DriveInput as the keyboard and buttons.
 */
import type { SteerLevel } from '../platform/settings';
import type { DriveInput } from '../sim/vehicle';

/** Drag distance (px) for full strength. The ring is 80px across, so the thumb stops at its edge. */
export const SWIPE_RADIUS = 40;
/** Below this share of the radius nothing happens, so a resting thumb doesn't creep. */
export const DEAD_ZONE = 0.15;
export const STEER_GAIN: Record<SteerLevel, number> = { low: 0.7, normal: 1, high: 1.4 };

/** Turns a drag (screen pixels, y down) into pedals and steering. Pure, so it is unit-tested. */
export function swipeDrive(dx: number, dy: number, gain = 1, radius = SWIPE_RADIUS): DriveInput {
  const len = Math.hypot(dx, dy);
  const reach = Math.min(1, len / radius);
  if (reach < DEAD_ZONE) return { gas: 0, brake: 0, left: 0, right: 0 };
  const strength = (reach - DEAD_ZONE) / (1 - DEAD_ZONE);
  const pedal = (strength * -dy) / len;
  const steer = Math.max(-1, Math.min(1, ((strength * dx) / len) * gain));
  return {
    gas: Math.max(0, pedal),
    brake: Math.max(0, -pedal),
    left: Math.max(0, -steer),
    right: Math.max(0, steer),
  };
}

export interface SwipeOptions {
  /** False when the control setting is "Buttons". */
  enabled(): boolean;
  gain(): number;
  /** Called once a drag has reached half strength: the first-run hint can go. */
  onDrive?(): void;
}

export interface Swipe {
  /** Lets go of an active drag (for example when the game pauses). */
  cancel(): void;
}

/**
 * Listens on the 3D view. The ring element holds a `.thumb` child; both are positioned in client
 * pixels, so the ring must be `position: fixed`.
 */
export function createSwipe(
  surface: HTMLElement,
  ring: HTMLElement,
  input: DriveInput,
  o: SwipeOptions,
): Swipe {
  const thumb = ring.querySelector<HTMLElement>('.thumb');
  let id: number | null = null;
  let x0 = 0;
  let y0 = 0;

  const release = () => {
    if (id === null) return;
    id = null;
    input.gas = input.brake = input.left = input.right = 0;
    ring.classList.remove('on');
  };

  surface.addEventListener('pointerdown', (e) => {
    if (id !== null || !o.enabled() || e.button > 0) return;
    id = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    surface.setPointerCapture(e.pointerId);
    ring.style.left = `${x0}px`;
    ring.style.top = `${y0}px`;
    if (thumb) thumb.style.transform = '';
    ring.hidden = false;
    ring.classList.add('on');
    e.preventDefault();
  });
  surface.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    const d = swipeDrive(dx, dy, o.gain());
    Object.assign(input, d);
    const len = Math.hypot(dx, dy);
    const k = len > SWIPE_RADIUS ? SWIPE_RADIUS / len : 1;
    if (thumb) thumb.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    if (Math.max(d.gas, d.brake, d.left, d.right) >= 0.5) o.onDrive?.();
  });
  const up = (e: PointerEvent) => {
    if (e.pointerId === id) release();
  };
  surface.addEventListener('pointerup', up);
  surface.addEventListener('pointercancel', up);
  surface.addEventListener('lostpointercapture', up);
  return { cancel: release };
}
