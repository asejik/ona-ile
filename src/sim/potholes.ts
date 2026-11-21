/**
 * Potholes (REAL-5) as pure logic. Driving into one cuts the speed and jolts the passenger; a deep one
 * also adds a little wear to the damage meter. They are visible from far off, so they can be steered round.
 */
import type { ZonePothole } from '../world/zone';

/** A wheel this close to a pothole's edge drops into it (half the keke's track). */
const WHEEL = 0.55;
/** Slower than this (m/s) the keke just rolls through. */
export const POTHOLE_MIN_SPEED = 2.5;
/** Damage (percent) a deep pothole adds at speed. */
export const DEEP_WEAR = 0.3;
const CELL = 20;

export interface PotholeHit {
  /** Speed multiplier. */
  slow: number;
  /** Jolt passed to the passenger's comfort, in the same units as a collision's impact speed. */
  jolt: number;
  /** Damage to add (percent). */
  wear: number;
  deep: boolean;
}

/** What hitting a pothole does at `speed` m/s. */
export function potholeHit(deep: boolean, speed: number): PotholeHit {
  if (speed < POTHOLE_MIN_SPEED) return { slow: 1, jolt: 0, wear: 0, deep };
  return {
    slow: deep ? 0.55 : 0.75,
    jolt: speed * (deep ? 0.35 : 0.22),
    wear: deep && speed > 4 ? DEEP_WEAR : 0,
    deep,
  };
}

export class Potholes {
  readonly list: ZonePothole[];
  private readonly grid = new Map<string, number[]>();
  /** The pothole the keke is in now, so each one counts once until the keke leaves it. */
  private inside = -1;

  /** Leaves out potholes within `clear` metres of any of `keep` (pickup stops, the workshop). */
  constructor(list: ZonePothole[], keep: { x: number; y: number }[] = [], clear = 8) {
    this.list = list.filter(([x, y]) => !keep.some((k) => Math.hypot(k.x - x, k.y - y) < clear));
    this.list.forEach(([x, y], i) => {
      const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
      const cell = this.grid.get(key);
      if (cell) cell.push(i);
      else this.grid.set(key, [i]);
    });
  }

  /** Index of the pothole under the keke at (x, y), or -1. */
  at(x: number, y: number): number {
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const i of this.grid.get(`${gx + dx},${gy + dy}`) ?? []) {
          const [px, py, r] = this.list[i]!;
          if (Math.hypot(px - x, py - y) < r + WHEEL) return i;
        }
      }
    }
    return -1;
  }

  /** The hit when the keke has just driven into a pothole this step, or null. */
  step(x: number, y: number, speed: number): PotholeHit | null {
    const i = this.at(x, y);
    const entered = i >= 0 && i !== this.inside;
    this.inside = i;
    if (!entered) return null;
    const hit = potholeHit(this.list[i]![3] === 1, speed);
    return hit.jolt > 0 ? hit : null;
  }
}
