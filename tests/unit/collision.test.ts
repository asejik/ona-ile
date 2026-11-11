import { describe, expect, it } from 'vitest';
import { Obstacles } from '../../src/world/collision';
import { tinyZone } from './fixtures';

describe('Obstacles.collide', () => {
  const obstacles = new Obstacles(tinyZone());

  it('includes buildings and roundabout islands', () => {
    expect(obstacles.list).toHaveLength(2);
  });

  it('leaves a circle alone when it is clear of everything', () => {
    expect(obstacles.collide(-30, 0, 1.15)).toEqual({ x: -30, y: 0, hit: false, nx: 0, ny: 0 });
  });

  it('pushes a circle that touches a wall back out to its radius', () => {
    const c = obstacles.collide(15, 9.5, 1.15); // just south of the building's south wall (y = 10)
    expect(c.hit).toBe(true);
    expect(c.y).toBeCloseTo(10 - 1.15);
    expect(c.ny).toBeCloseTo(-1);
  });

  it('pushes a circle that ends up inside a building out through the nearest wall', () => {
    const c = obstacles.collide(11, 15, 1.15); // 1 m inside the west wall (x = 10)
    expect(c.hit).toBe(true);
    expect(c.x).toBeLessThan(10);
  });

  it('treats a roundabout island as solid', () => {
    const c = obstacles.collide(-80, -80, 1.15);
    expect(c.hit).toBe(true);
    expect(Math.hypot(c.x + 80, c.y + 80)).toBeGreaterThan(5);
  });
});
