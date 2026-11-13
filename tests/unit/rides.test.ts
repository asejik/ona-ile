import { describe, expect, it } from 'vitest';
import { LEGACY_KEY, SAVE_KEY, createSaveStore, repairState } from '../../src/platform/save';
import type { KeyValueStore } from '../../src/platform/storage';
import {
  MAX_OFFERS,
  NEAR_M,
  addRespect,
  askPrice,
  bumpComfort,
  chooseDestination,
  comfortWord,
  farePrice,
  haggleChance,
  newGame,
  refillOffers,
  scoreTrip,
  startTrip,
  stepTrip,
  type Offer,
  type Trip,
} from '../../src/sim/rides';
import { FINE, createWardens, honkAtWardens, stepWardens, wardenRules } from '../../src/sim/wardens';
import { PASSENGERS } from '../../src/story/content';
import { seededRandom } from '../../src/world/props';
import { RoadNetwork } from '../../src/world/roads';
import { routeFrom, routeTree } from '../../src/world/routing';
import { atSpot, buildSpots } from '../../src/world/spots';
import { realZone } from './fixtures';

const zone = realZone();
const roads = new RoadNetwork(zone);
const spots = buildSpots(zone, roads);

describe('spots (CORE-5)', () => {
  it('puts every passenger on the kerb, off the road, and every stop point on the road', () => {
    expect(spots.length).toBeGreaterThanOrEqual(10);
    for (const s of spots) {
      expect(roads.nearest(s.kerbX, s.kerbY).dist, `${s.name} kerb`).toBeGreaterThan(0);
      expect(roads.nearest(s.stopX, s.stopY).dist, `${s.name} stop`).toBeLessThan(0);
      // Kerb and stop point are side by side, a few metres apart.
      expect(Math.hypot(s.kerbX - s.stopX, s.kerbY - s.stopY)).toBeLessThan(4);
    }
  });

  it('only counts as "at the spot" when close and slow', () => {
    const s = spots[0]!;
    expect(atSpot(s, s.stopX + 1, s.stopY, 1)).toBe(true);
    expect(atSpot(s, s.stopX + 1, s.stopY, 5)).toBe(false);
    expect(atSpot(s, s.stopX + 20, s.stopY, 0)).toBe(false);
  });
});

describe('offers (CORE-4)', () => {
  it('fills up to three waiting passengers, all different, at different spots', () => {
    const offers: Offer[] = [];
    const s = spots[0]!;
    refillOffers(offers, spots, { x: s.stopX, y: s.stopY }, newGame(3), [], seededRandom(1));
    expect(offers).toHaveLength(MAX_OFFERS);
    expect(new Set(offers.map((o) => o.spot)).size).toBe(MAX_OFFERS);
    expect(new Set(offers.map((o) => o.pax.id)).size).toBe(MAX_OFFERS);
  });

  it('always keeps one passenger close by, wherever the keke goes', () => {
    const offers: Offer[] = [];
    const rand = seededRandom(2);
    for (const s of spots) {
      const at = { x: s.stopX + 80, y: s.stopY };
      refillOffers(offers, spots, at, newGame(3), [], rand);
      const near = offers.some(
        (o) => Math.hypot(spots[o.spot]!.stopX - at.x, spots[o.spot]!.stopY - at.y) <= NEAR_M,
      );
      const anyNear = spots.some((p) => {
        const d = Math.hypot(p.stopX - at.x, p.stopY - at.y);
        return d > 70 && d <= NEAR_M;
      });
      if (anyNear) expect(near, `near ${s.name}`).toBe(true);
    }
  });

  it('never offers Mama Bisi again once her story is done', () => {
    const state = newGame(3);
    state.bisiDone = true;
    for (let i = 0; i < 30; i++) {
      const offers: Offer[] = [];
      refillOffers(offers, spots, { x: 0, y: 0 }, state, [], seededRandom(i));
      expect(offers.some((o) => o.pax.special === 'bisi')).toBe(false);
    }
  });
});

describe('fares and haggling', () => {
  it('prices by road distance, rounded to ₦50', () => {
    expect(farePrice(0)).toBe(200);
    expect(farePrice(600)).toBe(500);
    expect(askPrice(500)).toBe(650);
  });

  it('makes haggling easier with more Respect', () => {
    expect(haggleChance(0)).toBeCloseTo(0.3);
    expect(haggleChance(90)).toBeCloseTo(0.8);
  });

  it('keeps Respect between 0 and 100', () => {
    const s = newGame(3);
    expect(addRespect(s, 500)).toBe(70);
    expect(s.respect).toBe(100);
    addRespect(s, -500);
    expect(s.respect).toBe(0);
  });
});

describe('trips', () => {
  const dest = chooseDestination(roads, spots, 0, [], seededRandom(3))!;
  const trip = (): Trip => startTrip(PASSENGERS[0]!, 0, dest, 500, seededRandom(4));

  it('picks a reachable destination, mostly 250–1100 m away by road', () => {
    expect(dest).not.toBeNull();
    expect(dest.d).toBeGreaterThan(150);
    const route = routeFrom(dest.tree, roads, zone.nodes, spots[0]!.stopX, spots[0]!.stopY);
    expect(Number.isFinite(route.len)).toBe(true);
    const end = route.pts[route.pts.length - 1]!;
    expect(end).toEqual(zone.nodes[spots[dest.spot]!.node]);
  });

  it('gives 5 stars, a bonus and a tip for a smooth, on-time ride', () => {
    const r = scoreTrip(trip(), seededRandom(5));
    expect(r).toMatchObject({ onTime: true, stars: 5, base: 500, bonus: 80, respect: 5, mood: 'good' });
    expect(r.tip).toBeGreaterThanOrEqual(120);
    expect(r.total).toBe(r.base + r.bonus + r.tip);
  });

  it('takes 20% off and drops the bonus when late', () => {
    const t = trip();
    t.t = t.limit + 1;
    const r = scoreTrip(t, seededRandom(5));
    expect(r).toMatchObject({ onTime: false, base: 400, bonus: 0, mood: 'late' });
  });

  it('loses comfort on bumps and off-road driving, and gives 1 star when it hits zero', () => {
    const t = trip();
    expect(bumpComfort(t, 2)).toBe(false);
    expect(bumpComfort(t, 6)).toBe(true);
    expect(t.comfort).toBe(100 - 9 - 27);
    stepTrip(t, 10, false, 5, seededRandom(6));
    expect(t.comfort).toBe(64 - 25);
    t.comfort = 0;
    t.t = t.limit + 1;
    expect(scoreTrip(t, seededRandom(5)).stars).toBe(1);
  });

  it('describes comfort in words', () => {
    expect([comfortWord(90), comfortWord(50), comfortWord(10)]).toEqual(['Smooth', 'Bumpy', 'Rough']);
  });

  it('builds a route tree that reaches the destination node', () => {
    const tree = routeTree(roads, spots[1]!.node);
    expect(tree.dist[spots[1]!.node]).toBe(0);
  });
});

describe('warden rules (CORE-2)', () => {
  const at = (w: { x: number; y: number; r: number }, off: number) => ({ x: w.x + w.r + off, y: w.y });

  it('fines a keke that drives through a STOP, once', () => {
    const [w] = createWardens([{ x: 0, y: 0, r: 12 }]);
    const changed = stepWardens([w!], 9.1);
    expect(wardenRules([w!], changed, at(w!, 30), 0, 0.1)).toEqual([]);
    expect(wardenRules([w!], [], at(w!, 1), 6, 0.1)).toEqual([{ kind: 'fine', warden: w }]);
    expect(wardenRules([w!], [], at(w!, 0), 6, 0.1)).toEqual([]);
    expect(FINE).toBe(200);
  });

  it('does not fine a keke already on the roundabout when STOP begins', () => {
    const [w] = createWardens([{ x: 0, y: 0, r: 12 }]);
    const changed = stepWardens([w!], 9.1);
    wardenRules([w!], changed, at(w!, 1), 6, 0.1);
    expect(wardenRules([w!], [], at(w!, 1), 6, 0.1)).toEqual([]);
  });

  it('praises a keke that waits at the STOP', () => {
    const [w] = createWardens([{ x: 0, y: 0, r: 12 }]);
    wardenRules([w!], stepWardens([w!], 9.1), at(w!, 10), 0, 0.1);
    const events = [];
    for (let i = 0; i < 20; i++) events.push(...wardenRules([w!], [], at(w!, 10), 0, 0.1));
    expect(events).toEqual([{ kind: 'praise', warden: w }]);
  });

  it('is annoyed by honking nearby, at most every 8 s', () => {
    const [w] = createWardens([{ x: 0, y: 0, r: 12 }]);
    expect(honkAtWardens([w!], { x: 10, y: 0 })).toHaveLength(1);
    expect(honkAtWardens([w!], { x: 10, y: 0 })).toHaveLength(0);
    wardenRules([w!], [], { x: 10, y: 0 }, 0, 8);
    expect(honkAtWardens([w!], { x: 10, y: 0 })).toHaveLength(1);
    expect(honkAtWardens([w!], { x: 100, y: 0 })).toHaveLength(0);
  });
});

describe('saves (SYS-1)', () => {
  const store = (): KeyValueStore & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    };
  };

  it('returns nothing for a new player, and round-trips a save', () => {
    const s = store();
    const saves = createSaveStore(s, 3);
    expect(saves.load()).toBeNull();
    const g = newGame(3);
    g.money = 1500;
    g.pages[1] = true;
    saves.save(g);
    expect(saves.load()).toEqual(g);
  });

  it("migrates prototype v0.1's save once, then removes the old key", () => {
    const s = store();
    s.setItem(
      LEGACY_KEY,
      JSON.stringify({
        money: 2700,
        respect: 41,
        pages: [true, false, true],
        rides: 6,
        stageDone: false,
        introDone: true,
      }),
    );
    const g = createSaveStore(s, 3).load()!;
    expect(g).toMatchObject({
      money: 2700,
      respect: 41,
      pages: [true, false, true],
      rides: 6,
      introDone: true,
    });
    expect(s.data.has(LEGACY_KEY)).toBe(false);
    expect(s.data.has(SAVE_KEY)).toBe(true);
  });

  it('repairs damaged or tampered values instead of crashing', () => {
    expect(repairState({ money: -5, respect: 900, pages: 'x', rides: 'many' }, 3)).toEqual({
      ...newGame(3),
      money: 0,
      respect: 100,
    });
    expect(repairState(null, 2)).toEqual(newGame(2));
    const s = store();
    s.setItem(SAVE_KEY, 'not json');
    expect(createSaveStore(s, 3).load()).toBeNull();
  });
});
