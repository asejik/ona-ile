import { describe, expect, it } from 'vitest';
import { createTraffic, pushOutOfTraffic, stepTraffic, type Npc } from '../../src/sim/traffic';
import {
  CYCLE_S,
  GO_S,
  createWardens,
  nearestWarden,
  phaseAt,
  secondsLeft,
  stepWardens,
} from '../../src/sim/wardens';
import { roundaboutIslands, seededRandom } from '../../src/world/props';
import { RoadNetwork } from '../../src/world/roads';
import { realZone, tinyZone } from './fixtures';

describe('wardens (CORE-2)', () => {
  it('shows GO for 9 s, then STOP for 6 s, on a 15 s cycle', () => {
    expect(phaseAt(0)).toBe('go');
    expect(phaseAt(GO_S - 0.01)).toBe('go');
    expect(phaseAt(GO_S)).toBe('stop');
    expect(phaseAt(CYCLE_S - 0.01)).toBe('stop');
    expect(phaseAt(CYCLE_S)).toBe('go');
  });

  it('stands at the first three small roundabouts of the real zone, with names', () => {
    const wardens = createWardens(roundaboutIslands(realZone()));
    expect(wardens.map((w) => w.name)).toEqual(['Officer Biodun', 'Officer Kemi', 'Officer Musa']);
    expect(wardens.every((w) => w.r < 19)).toBe(true);
  });

  it('reports a signal change once, and counts down', () => {
    const [w] = createWardens([{ x: 0, y: 0, r: 12 }]);
    expect(secondsLeft(w!)).toBe(9);
    expect(stepWardens([w!], 8.5)).toEqual([]);
    expect(stepWardens([w!], 1)).toEqual([w]);
    expect(w!.phase).toBe('stop');
    expect(secondsLeft(w!)).toBe(6);
  });

  it('finds the nearest warden', () => {
    const ws = createWardens([
      { x: 0, y: 0, r: 12 },
      { x: 100, y: 0, r: 12 },
    ]);
    expect(nearestWarden(ws, 90, 0)!.warden).toBe(ws[1]);
    expect(nearestWarden([], 0, 0)).toBeNull();
  });
});

describe('traffic', () => {
  const zone = realZone();
  const roads = new RoadNetwork(zone);

  it('spawns the requested number of vehicles on the main network, deterministically', () => {
    const a = createTraffic(roads, zone.nodes, seededRandom(1), 16);
    const b = createTraffic(roads, zone.nodes, seededRandom(1), 16);
    expect(a).toHaveLength(16);
    expect(a).toEqual(b);
    const main = new Set(roads.mainNodes);
    expect(a.every((n) => main.has(n.a))).toBe(true);
  });

  it('drives along roads and stays near them over a minute', () => {
    const npcs = createTraffic(roads, zone.nodes, seededRandom(2), 12);
    const rand = seededRandom(3);
    const start = npcs.map((n) => ({ x: n.x, y: n.y }));
    for (let i = 0; i < 60 * 30; i++)
      stepTraffic(npcs, roads, zone.nodes, { x: 1e6, y: 1e6 }, [], 1 / 30, rand);
    const moved = npcs.filter((n, i) => Math.hypot(n.x - start[i]!.x, n.y - start[i]!.y) > 20);
    expect(moved.length).toBeGreaterThan(npcs.length / 2);
    for (const n of npcs) expect(roads.nearest(n.x, n.y).dist).toBeLessThan(3);
  });

  it('keeps to the right of the direction of travel', () => {
    const tiny = tinyZone();
    const tinyRoads = new RoadNetwork(tiny);
    const n: Npc = {
      kind: 'car',
      colour: 0,
      a: 0,
      b: 1,
      len: 50,
      w: 10,
      t: 10,
      v: 5,
      vmax: 5,
      r: 2,
      x: -40,
      y: 0,
      h: 0,
      stuck: 0,
      ghost: 0,
    };
    for (let i = 0; i < 30; i++)
      stepTraffic([n], tinyRoads, tiny.nodes, { x: 1e6, y: 1e6 }, [], 1 / 30, () => 0.5);
    // Heading east (+x), right-hand side is south (negative y).
    expect(n.y).toBeLessThan(-1.5);
  });

  it('stops for the player directly ahead', () => {
    const tiny = tinyZone();
    const tinyRoads = new RoadNetwork(tiny);
    const n: Npc = {
      kind: 'car',
      colour: 0,
      a: 0,
      b: 1,
      len: 50,
      w: 10,
      t: 10,
      v: 8,
      vmax: 8,
      r: 2,
      x: -40,
      y: -2.5,
      h: 0,
      stuck: 0,
      ghost: 0,
    };
    for (let i = 0; i < 30; i++)
      stepTraffic([n], tinyRoads, tiny.nodes, { x: n.x + 5, y: n.y }, [], 1 / 30, () => 0.5);
    expect(n.v).toBe(0);
  });

  it('stops before a warden showing STOP, and moves on GO', () => {
    const tiny = tinyZone();
    const tinyRoads = new RoadNetwork(tiny);
    const make = (): Npc => ({
      kind: 'car',
      colour: 0,
      a: 0,
      b: 1,
      len: 50,
      w: 10,
      // About 12 m before the warden: inside the 8–20 m zone where cars wait for STOP.
      t: 28,
      v: 8,
      vmax: 8,
      r: 2,
      x: -22,
      y: -2.5,
      h: 0,
      stuck: 0,
      ghost: 0,
    });
    const [stop] = createWardens([{ x: -10, y: 0, r: 5 }]);
    stop!.t = GO_S;
    stop!.phase = 'stop';
    const n = make();
    stepTraffic([n], tinyRoads, tiny.nodes, { x: 1e6, y: 1e6 }, [stop!], 1, () => 0.5);
    expect(n.v).toBe(0);
    const go = { ...stop!, phase: 'go' as const };
    const m = make();
    stepTraffic([m], tinyRoads, tiny.nodes, { x: 1e6, y: 1e6 }, [go], 0.2, () => 0.5);
    expect(m.v).toBeGreaterThan(7);
  });
});

describe('pushOutOfTraffic', () => {
  it('pushes the keke out of a car and reports the impact', () => {
    const car = { x: 0, y: 0, r: 2, v: 4 } as Npc;
    const pos = { x: 1, y: 0 };
    expect(pushOutOfTraffic(pos, 1.15, 6, [car])).toBe(8);
    expect(pos.x).toBeCloseTo(3.15);
  });

  it('does nothing when clear', () => {
    const pos = { x: 10, y: 0 };
    expect(pushOutOfTraffic(pos, 1.15, 6, [{ x: 0, y: 0, r: 2, v: 0 } as Npc])).toBe(0);
    expect(pos.x).toBe(10);
  });
});

describe('props', () => {
  it('gives the same random sequence for the same seed', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('kiosks and trees', () => {
  it('places kiosks beside the big roads, never on them, the same way every time', async () => {
    const { placeKiosks } = await import('../../src/world/props');
    const zone = realZone();
    const roads = new RoadNetwork(zone);
    const a = placeKiosks(roads, () => false, seededRandom(5));
    const b = placeKiosks(roads, () => false, seededRandom(5));
    expect(a.length).toBeGreaterThan(20);
    expect(a).toEqual(b);
    for (const k of a) {
      const cx = (k.poly[0]! + k.poly[4]!) / 2;
      const cy = (k.poly[1]! + k.poly[5]!) / 2;
      expect(roads.nearest(cx, cy).dist).toBeGreaterThanOrEqual(1.2);
    }
  });

  it('keeps trees off the roads', async () => {
    const { placeTrees } = await import('../../src/world/props');
    const zone = realZone();
    const roads = new RoadNetwork(zone);
    const trees = placeTrees(zone, roads, () => false, seededRandom(6), 200);
    expect(trees).toHaveLength(200);
    for (const t of trees) expect(roads.nearest(t.x, t.y).dist).toBeGreaterThanOrEqual(2.8);
  });
});
