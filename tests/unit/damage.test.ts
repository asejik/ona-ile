import { describe, expect, it } from 'vitest';
import {
  BROKEN,
  DAMAGE_MIN_IMPACT,
  PATCH_TO,
  addDamage,
  handling,
  impactDamage,
  kerbDamage,
  repairCost,
  repairQuote,
} from '../../src/sim/damage';
import { KEKE, createVehicle, stepVehicle, type DriveEnvironment } from '../../src/sim/vehicle';
import { RoadNetwork } from '../../src/world/roads';
import { buildSpots } from '../../src/world/spots';
import { placeWorkshop } from '../../src/world/workshop';
import { realZone } from './fixtures';

describe('damage meter (DMG-1)', () => {
  it('ignores scrapes and grows with impact speed', () => {
    expect(impactDamage(DAMAGE_MIN_IMPACT)).toBe(0);
    expect(impactDamage(1)).toBe(0);
    const slow = impactDamage(5);
    const fast = impactDamage(15);
    expect(slow).toBeGreaterThan(1);
    expect(slow).toBeLessThan(5);
    expect(fast).toBeGreaterThan(18);
    expect(fast).toBeLessThan(30);
    // Faster than linear: three times the speed is far more than three times the damage.
    expect(fast).toBeGreaterThan(slow * 5);
  });

  it('counts kerb knocks only when fast, and keeps them small', () => {
    expect(kerbDamage(6)).toBe(0);
    expect(kerbDamage(KEKE.topSpeedRoad)).toBeGreaterThan(0);
    expect(kerbDamage(KEKE.topSpeedRoad)).toBeLessThan(5);
  });

  it('stays between 0 and 100, to one decimal place', () => {
    expect(addDamage(95, 30)).toBe(BROKEN);
    expect(addDamage(3, -10)).toBe(0);
    expect(addDamage(10, 2.345)).toBe(12.3);
  });
});

describe('damage affects driving (DMG-3)', () => {
  it('changes nothing up to 50%', () => {
    expect(handling(0)).toEqual({ top: 1, pull: 0 });
    expect(handling(50)).toEqual({ top: 1, pull: 0 });
  });

  it('cuts top speed and pulls the steering above 50%', () => {
    const h = handling(99);
    expect(h.top).toBeLessThan(0.75);
    expect(h.top).toBeGreaterThan(0.65);
    expect(h.pull).toBeGreaterThan(0.1);
    expect(handling(75).top).toBeGreaterThan(h.top);
  });

  it('really is slower and drifts when worn', () => {
    const open: DriveEnvironment = {
      roadDist: () => -5,
      collide: (x, y) => ({ x, y, hit: false, nx: 0, ny: 0 }),
      bounds: [-1e4, -1e4, 1e4, 1e4],
    };
    const run = (damage: number) => {
      const v = createVehicle(0, 0, 0);
      for (let t = 0; t < 20; t += 1 / 60)
        stepVehicle(v, { gas: 1, brake: 0, left: 0, right: 0 }, 1 / 60, open, handling(damage));
      return v;
    };
    const healthy = run(0);
    const worn = run(90);
    expect(worn.v).toBeLessThan(healthy.v * 0.85);
    expect(Math.abs(healthy.y)).toBeLessThan(1e-9);
    // It pulls to the right: heading turns clockwise, so the keke drifts south of its line.
    expect(worn.y).toBeLessThan(-1);
  });
});

describe("repairs at Oga Lati's (DMG-4)", () => {
  it('costs ₦15 a percent, rounded up to ₦50', () => {
    expect(repairCost(0)).toBe(0);
    expect(repairCost(1)).toBe(50);
    expect(repairCost(40)).toBe(600);
    expect(repairCost(100)).toBe(1500);
  });

  it('fixes everything when the player can pay', () => {
    expect(repairQuote(40, 5000)).toEqual({ cost: 600, after: 0, full: true });
  });

  it('fixes as much as the money covers', () => {
    const q = repairQuote(60, 320);
    expect(q.cost).toBe(300);
    expect(q.after).toBe(40);
    expect(q.full).toBe(false);
  });

  it('never leaves a broken keke stuck when the player has nothing', () => {
    const q = repairQuote(BROKEN, 0);
    expect(q.cost).toBe(0);
    expect(q.after).toBe(PATCH_TO);
    expect(repairQuote(30, 0)).toEqual({ cost: 0, after: 30, full: false });
  });
});

describe("Oga Lati's workshop (DMG-4)", () => {
  const zone = realZone();
  const roads = new RoadNetwork(zone);
  const spots = buildSpots(zone, roads);
  const shop = placeWorkshop(zone, roads, spots)!;

  it('stands on a kerb near the Post Office Terminus, with its stop in the road', () => {
    expect(shop).not.toBeNull();
    const home = zone.spots[0]!;
    expect(Math.hypot(shop.stopX - home.x, shop.stopY - home.y)).toBeLessThan(220);
    expect(roads.nearest(shop.stopX, shop.stopY).dist).toBeLessThan(0);
    expect(roads.nearest(shop.kerbX, shop.kerbY).dist).toBeGreaterThan(0);
  });

  it('never shares a kerb with a pickup or drop-off', () => {
    for (const s of spots) expect(Math.hypot(s.stopX - shop.stopX, s.stopY - shop.stopY)).toBeGreaterThan(40);
  });

  it('is the same place every time', () => {
    expect(placeWorkshop(zone, roads, spots)).toEqual(shop);
  });
});
