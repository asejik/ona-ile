import { describe, expect, it } from 'vitest';
import { DEEP_WEAR, POTHOLE_MIN_SPEED, Potholes, potholeHit } from '../../src/sim/potholes';
import { RoadNetwork } from '../../src/world/roads';
import type { ZonePothole } from '../../src/world/zone';
import { realZone } from './fixtures';

describe('pothole hits (REAL-5)', () => {
  it('cut the speed and jolt the passenger, deep ones more', () => {
    const shallow = potholeHit(false, 12);
    const deep = potholeHit(true, 12);
    expect(shallow.slow).toBeLessThan(1);
    expect(deep.slow).toBeLessThan(shallow.slow);
    expect(deep.jolt).toBeGreaterThan(shallow.jolt);
    expect(shallow.wear).toBe(0);
    expect(deep.wear).toBe(DEEP_WEAR);
  });

  it('add only a very small amount of wear', () => {
    expect(DEEP_WEAR).toBeLessThan(1);
  });

  it('do nothing when rolling through slowly', () => {
    expect(potholeHit(true, POTHOLE_MIN_SPEED - 0.5)).toEqual({ slow: 1, jolt: 0, wear: 0, deep: true });
  });

  it('count each pothole once, until the keke has left it', () => {
    const p = new Potholes([[10, 0, 0.8, 1]]);
    expect(p.step(0, 0, 10)).toBeNull();
    expect(p.step(10, 0, 10)?.deep).toBe(true);
    expect(p.step(10.3, 0, 10)).toBeNull();
    expect(p.step(14, 0, 10)).toBeNull();
    expect(p.step(10, 0, 10)).not.toBeNull();
  });

  it('can be steered round', () => {
    const p = new Potholes([[10, 0, 0.8, 1]]);
    expect(p.at(10, 1.5)).toBe(-1);
    expect(p.at(10, 1.2)).toBe(0);
  });

  it('are left out beside pickup stops and the workshop', () => {
    const list: ZonePothole[] = [
      [0, 0, 0.8, 0],
      [50, 0, 0.8, 0],
    ];
    expect(new Potholes(list, [{ x: 3, y: 0 }]).list).toEqual([[50, 0, 0.8, 0]]);
  });
});

describe('pothole placement in zone 1', () => {
  const zone = realZone();
  const roads = new RoadNetwork(zone);

  it('has potholes, sitting fully on the road', () => {
    expect(zone.potholes.length).toBeGreaterThan(50);
    for (const [x, y, r] of zone.potholes) expect(roads.nearest(x, y).dist).toBeLessThan(-r + 0.01);
  });

  it('keeps them out of junctions and apart from each other', () => {
    for (const [x, y] of zone.potholes) {
      for (const j of zone.junctions) expect(Math.hypot(x - j.x, y - j.y)).toBeGreaterThan(20);
    }
    zone.potholes.forEach(([x, y], i) => {
      zone.potholes
        .slice(i + 1)
        .forEach(([x2, y2]) => expect(Math.hypot(x - x2, y - y2)).toBeGreaterThan(17));
    });
  });

  it('puts most on side streets, fewer on main roads', () => {
    const onMain = zone.potholes.filter(([x, y]) => roads.segments[roads.nearest(x, y).seg]!.hw >= 5).length;
    expect(onMain).toBeLessThan(zone.potholes.length / 3);
  });
});
