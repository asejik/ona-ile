import { describe, expect, it } from 'vitest';
import {
  KEKE,
  createVehicle,
  stepVehicle,
  type DriveEnvironment,
  type DriveInput,
} from '../../src/sim/vehicle';

const open: DriveEnvironment = {
  roadDist: () => -5, // always on the road
  collide: (x, y) => ({ x, y, hit: false, nx: 0, ny: 0 }),
  bounds: [-1e4, -1e4, 1e4, 1e4],
};
const offRoad: DriveEnvironment = { ...open, roadDist: () => 10 };
const idle: DriveInput = { gas: 0, brake: 0, left: 0, right: 0 };

function drive(input: Partial<DriveInput>, seconds: number, env = open, v = createVehicle(0, 0, 0)) {
  const full = { ...idle, ...input };
  for (let t = 0; t < seconds; t += 1 / 60) stepVehicle(v, full, 1 / 60, env);
  return v;
}

describe('stepVehicle', () => {
  it('speeds up with gas and moves along its heading', () => {
    const v = drive({ gas: 1 }, 2);
    expect(v.v).toBeGreaterThan(8);
    expect(v.x).toBeGreaterThan(5);
    expect(Math.abs(v.y)).toBeLessThan(1e-9);
  });

  it('never goes much above the road top speed', () => {
    expect(drive({ gas: 1 }, 30).v).toBeLessThan(KEKE.topSpeedRoad + 0.5);
  });

  it('is slower off the road', () => {
    const v = drive({ gas: 1 }, 30, offRoad);
    expect(v.v).toBeLessThan(KEKE.topSpeedOffRoad + 0.5);
  });

  it('brakes to a stop, then reverses, capped at reverse top speed', () => {
    const v = drive({ gas: 1 }, 2);
    drive({ brake: 1 }, 1, open, v);
    expect(v.v).toBeLessThan(0.3);
    drive({ brake: 1 }, 10, open, v);
    expect(v.v).toBeCloseTo(-KEKE.topSpeedReverse);
  });

  it('coasts to a stop with no input', () => {
    const v = drive({ gas: 1 }, 2);
    drive({}, 15, open, v);
    expect(v.v).toBe(0);
  });

  it('only turns when moving, and left turns counter-clockwise', () => {
    expect(drive({ left: 1 }, 1).h).toBe(0);
    const v = drive({ gas: 1, left: 1 }, 1);
    expect(v.h).toBeGreaterThan(0.2);
  });

  it('reports an impact and loses speed when it hits something', () => {
    const wall: DriveEnvironment = {
      ...open,
      collide: (x, y) => (x > 5 ? { x: 5, y, hit: true, nx: -1, ny: 0 } : { x, y, hit: false, nx: 0, ny: 0 }),
    };
    const v = createVehicle(0, 0, 0);
    let impact = 0;
    for (let i = 0; i < 300 && impact === 0; i++)
      impact = stepVehicle(v, { ...idle, gas: 1 }, 1 / 60, wall).impact;
    expect(impact).toBeGreaterThan(2);
    expect(v.x).toBe(5);
  });
});
