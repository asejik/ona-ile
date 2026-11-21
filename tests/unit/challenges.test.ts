import { describe, expect, it } from 'vitest';
import {
  COUNTDOWN,
  clock,
  finishTime,
  medalFor,
  medalTimes,
  startRun,
  stepRun,
} from '../../src/sim/challenges';
import { CHALLENGES } from '../../src/story/content';
import { RoadNetwork } from '../../src/world/roads';
import { placeChallenges } from '../../src/world/challenges';
import { buildSpots } from '../../src/world/spots';
import { realZone } from './fixtures';

describe('medal times (TIME-1)', () => {
  it('ask for faster driving for better medals, rounded up to 5 s', () => {
    const m = medalTimes(1000);
    expect(m.gold).toBeLessThan(m.silver);
    expect(m.silver).toBeLessThan(m.bronze);
    for (const t of [m.gold, m.silver, m.bronze]) expect(t % 5).toBe(0);
    // Gold is possible: faster than the keke's 15 m/s top speed would need.
    expect(m.gold).toBeGreaterThan(1000 / 15);
  });

  it('give the medal a time earns, or none past the limit', () => {
    const m = { gold: 60, silver: 75, bronze: 90 };
    expect(medalFor(55, m)).toBe('gold');
    expect(medalFor(60, m)).toBe('gold');
    expect(medalFor(70, m)).toBe('silver');
    expect(medalFor(90, m)).toBe('bronze');
    expect(medalFor(90.1, m)).toBeNull();
  });
});

describe('a challenge run', () => {
  it('counts down, then runs the clock, then fails past the bronze time', () => {
    const run = startRun('x', { gold: 1, silver: 2, bronze: 3 });
    const events: string[] = [];
    // The game ends the run at the first 'timeup'.
    for (let i = 0; i < (COUNTDOWN + 3.5) * 10 && !events.includes('timeup'); i++) {
      const e = stepRun(run, 0.1);
      if (e) events.push(e);
    }
    expect(events).toEqual(['go', 'timeup']);
    expect(run.t).toBeGreaterThan(3);
  });

  it('starts the clock exactly when the countdown ends', () => {
    const run = startRun('x', { gold: 10, silver: 20, bronze: 30 });
    stepRun(run, COUNTDOWN - 0.05);
    expect(stepRun(run, 0.2)).toBe('go');
    expect(run.t).toBeCloseTo(0.15);
  });

  it('shows times as minutes and seconds', () => {
    expect(clock(67.44)).toBe('1:07');
    expect(clock(67.44, true)).toBe('1:07.4');
    expect(clock(-3)).toBe('0:00');
    expect(finishTime(67.449)).toBe(67.4);
  });
});

describe('zone 1 challenges', () => {
  const zone = realZone();
  const roads = new RoadNetwork(zone);
  const spots = buildSpots(zone, roads);
  const places = placeChallenges(zone, roads, CHALLENGES, spots);

  it('all three are placed, a sensible drive apart', () => {
    expect(places.map((p) => p.id)).toEqual(CHALLENGES.map((c) => c.id));
    for (const p of places) {
      expect(p.d).toBeGreaterThan(300);
      expect(p.d).toBeLessThan(2000);
    }
  });

  it('start at boards on the kerb near their places, clear of pickup stops and each other', () => {
    for (const p of places) {
      const from = zone.spots.find((s) => s.name === p.from)!;
      expect(Math.hypot(p.start.stopX - from.x, p.start.stopY - from.y)).toBeLessThan(150);
      expect(roads.nearest(p.start.kerbX, p.start.kerbY).dist).toBeGreaterThan(0);
      for (const s of [...spots, ...places.filter((q) => q !== p).map((q) => q.start)])
        expect(Math.hypot(s.stopX - p.start.stopX, s.stopY - p.start.stopY)).toBeGreaterThan(35);
    }
  });

  it('finish by the target place, including Sadiku Hospital', () => {
    for (const p of places) {
      const to = zone.spots.find((s) => s.name === p.to)!;
      expect(Math.hypot(p.finish.stopX - to.x, p.finish.stopY - to.y)).toBeLessThan(90);
    }
    expect(places.find((p) => p.id === 'po-sadiku')!.to).toBe('Sadiku Hospital');
  });
});
