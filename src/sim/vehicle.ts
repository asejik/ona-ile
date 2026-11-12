/**
 * Arcade keke physics, ported from prototype v0.1. Pure logic: no Three.js, no DOM.
 * Units: metres, seconds, radians. Heading 0 points east (+x), increasing counter-clockwise.
 */

export interface DriveInput {
  /** 0..1 */
  gas: number;
  /** 0..1; also reverses once stopped */
  brake: number;
  /** 0..1 */
  left: number;
  /** 0..1 */
  right: number;
}

export interface VehicleState {
  x: number;
  y: number;
  /** Heading in radians. */
  h: number;
  /** Signed speed in m/s (negative is reversing). */
  v: number;
  /** Smoothed steering, -1 (right) .. 1 (left). */
  steer: number;
}

export interface DriveEnvironment {
  /** Signed distance from the nearest road edge (negative = on the road). */
  roadDist(x: number, y: number): number;
  /** Pushes a circle out of obstacles. */
  collide(x: number, y: number, r: number): { x: number; y: number; hit: boolean; nx: number; ny: number };
  bounds: [number, number, number, number];
}

export interface StepResult {
  /** Impact speed of a collision this step, or 0. */
  impact: number;
  onRoad: boolean;
}

export const KEKE = {
  radius: 1.15,
  topSpeedRoad: 15,
  topSpeedOffRoad: 8.5,
  accel: 7.2,
  brake: 13,
  reverseAccel: 4,
  topSpeedReverse: 4.5,
  dragRoad: 1.7,
  dragOffRoad: 3.6,
  turnRate: 1.95,
} as const;

export function createVehicle(x: number, y: number, h: number): VehicleState {
  return { x, y, h, v: 0, steer: 0 };
}

/** Advances the vehicle by dt seconds. Mutates and returns details about this step. */
export function stepVehicle(
  s: VehicleState,
  input: DriveInput,
  dt: number,
  env: DriveEnvironment,
): StepResult {
  const throttle = input.gas - input.brake;
  const steerInput = input.left - input.right;
  const onRoad = env.roadDist(s.x, s.y) < 0.4;
  const vmax = onRoad ? KEKE.topSpeedRoad : KEKE.topSpeedOffRoad;

  if (throttle > 0) {
    if (s.v < 0) s.v += KEKE.brake * dt * throttle;
    else s.v += KEKE.accel * (1 - (s.v / vmax) * 0.85) * dt * throttle;
  } else if (throttle < 0) {
    if (s.v > 0.3) s.v -= KEKE.brake * dt * -throttle;
    else s.v = Math.max(s.v - KEKE.reverseAccel * dt * -throttle, -KEKE.topSpeedReverse);
  } else {
    const drag = (onRoad ? KEKE.dragRoad : KEKE.dragOffRoad) * dt;
    s.v -= Math.sign(s.v) * Math.min(Math.abs(s.v), drag);
  }
  if (s.v > vmax) s.v -= (s.v - vmax) * 2.2 * dt;

  s.steer += (steerInput - s.steer) * (1 - Math.exp(-9 * dt));
  const speed = Math.abs(s.v);
  const grip = clamp01(speed / 3.2) * (1 - 0.42 * clamp01(speed / KEKE.topSpeedRoad));
  s.h += s.steer * KEKE.turnRate * grip * Math.sign(s.v || 1) * dt;

  const c = env.collide(s.x + Math.cos(s.h) * s.v * dt, s.y + Math.sin(s.h) * s.v * dt, KEKE.radius);
  let impact = 0;
  if (c.hit) {
    impact = Math.abs(Math.cos(s.h) * c.nx + Math.sin(s.h) * c.ny) * speed;
    s.v *= impact > 3 ? 0.25 : 0.7;
  }
  const [x0, y0, x1, y1] = env.bounds;
  s.x = Math.min(Math.max(c.x, x0 - 40), x1 + 40);
  s.y = Math.min(Math.max(c.y, y0 - 40), y1 + 40);
  return { impact, onRoad };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
