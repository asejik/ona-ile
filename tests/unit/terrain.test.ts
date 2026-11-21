import { describe, expect, it } from 'vitest';
import { Terrain } from '../../src/world/terrain';
import type { ZoneTerrain } from '../../src/world/zone';
import { realZone } from './fixtures';

// A 3 x 2 grid, 10 m cells: the ground rises 1 m per cell to the east and is level north to south.
const grid: ZoneTerrain = {
  x0: 0,
  y0: 0,
  step: 10,
  cols: 3,
  rows: 2,
  h: [0, 1, 2, 0, 1, 2],
  attribution: 'test',
};

describe('terrain (M4c)', () => {
  const t = new Terrain(grid);

  it('gives the grid heights at the grid points and in between', () => {
    expect(t.heightAt(0, 0)).toBe(0);
    expect(t.heightAt(20, 10)).toBeCloseTo(2);
    expect(t.heightAt(5, 5)).toBeCloseTo(0.5);
    expect(t.heightAt(15, 2)).toBeCloseTo(1.5);
  });

  it('holds the edge height outside the grid', () => {
    expect(t.heightAt(-50, 5)).toBeCloseTo(0);
    expect(t.heightAt(90, 5)).toBeCloseTo(2);
  });

  it('measures the grade along a heading: up to the east, level to the north', () => {
    expect(t.grade(10, 5, 0)).toBeCloseTo(0.1);
    expect(t.grade(10, 5, Math.PI)).toBeCloseTo(-0.1);
    expect(t.grade(10, 5, Math.PI / 2)).toBeCloseTo(0);
  });

  it('tilts the normal away from the rise', () => {
    const [nx, ny, nz] = t.normal(10, 5);
    expect(nx).toBeLessThan(0);
    expect(ny).toBeCloseTo(0);
    expect(nz).toBeGreaterThan(0.99);
  });

  it('is flat when the zone has no terrain', () => {
    const flat = new Terrain(null);
    expect(flat.heightAt(3, 4)).toBe(0);
    expect(flat.grade(3, 4, 1)).toBe(0);
  });
});

describe('zone 1 hills', () => {
  const zone = realZone();
  const t = new Terrain(zone.terrain);

  it('has gentle hills, scaled like the distances', () => {
    const g = zone.terrain!;
    expect(Math.max(...g.h) - Math.min(...g.h)).toBeGreaterThan(15);
    expect(Math.max(...g.h)).toBeLessThan(60);
    let steepest = 0;
    for (const [x, y] of zone.nodes) {
      for (let h = 0; h < Math.PI; h += Math.PI / 4)
        steepest = Math.max(steepest, Math.abs(t.grade(x, y, h)));
    }
    // No road point steeper than about 6°.
    expect(Math.atan(steepest) * (180 / Math.PI)).toBeLessThan(6);
  });

  it('carries the Copernicus credit', () => {
    expect(zone.terrain!.attribution).toContain('Copernicus');
  });
});
