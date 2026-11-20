import { describe, expect, it } from 'vitest';
import { Obstacles } from '../../src/world/collision';
import { roundaboutIslands } from '../../src/world/props';
import { RoadNetwork } from '../../src/world/roads';
import { MAX_BLADES, pickBlades, placeSignPosts, signText } from '../../src/world/signs';
import { realZone } from './fixtures';

const zone = realZone();
const roads = new RoadNetwork(zone);
const islands = roundaboutIslands(zone);
const buildings = new Obstacles(zone);
const posts = placeSignPosts(zone, roads, islands, (x, y) => buildings.collide(x, y, 0.6).hit);

describe('sign posts (NAV-2, NAV-3)', () => {
  it('nearly every junction gets a post', () => {
    const ordinary = zone.junctions.filter((j) => j.rb === undefined);
    const withPlates = posts.filter((p) => p.plates.length > 0);
    expect(withPlates.length).toBeGreaterThanOrEqual(Math.floor(ordinary.length * 0.9));
  });

  it('corner posts stand off the road and outside buildings, close to their junction', () => {
    const onIsland = (p: { x: number; y: number }) =>
      islands.some((i) => Math.hypot(p.x - i.x, p.y - i.y) < i.island);
    for (const p of posts.filter((p) => !onIsland(p))) {
      expect(roads.nearest(p.x, p.y).dist).toBeGreaterThan(0.8);
      expect(buildings.collide(p.x, p.y, 0.6).hit).toBe(false);
      const near = Math.min(...zone.junctions.map((j) => Math.hypot(j.x - p.x, j.y - p.y)));
      expect(near).toBeLessThan(18);
    }
  });

  it('roundabout posts stand on the island, clear of the warden in the middle', () => {
    for (const isl of islands) {
      const on = posts.filter((p) => Math.hypot(p.x - isl.x, p.y - isl.y) < isl.island);
      for (const p of on) expect(Math.hypot(p.x - isl.x, p.y - isl.y)).toBeGreaterThan(1.2);
    }
    const onIslands = posts.filter((p) => islands.some((i) => Math.hypot(p.x - i.x, p.y - i.y) < i.island));
    expect(onIslands.length).toBeGreaterThanOrEqual(3);
  });

  it('a post carries at most three blades, one per place', () => {
    let blades = 0;
    for (const p of posts) {
      expect(p.blades.length).toBeLessThanOrEqual(MAX_BLADES);
      expect(new Set(p.blades.map((b) => b.to)).size).toBe(p.blades.length);
      blades += p.blades.length;
    }
    expect(blades).toBeGreaterThan(50);
  });

  it('picks the nearest places first', () => {
    const b = pickBlades([
      { h: 0, road: 'A', to: 'Far', d: 700 },
      { h: 90, road: 'B', to: 'Near', d: 100 },
      { h: 180, road: 'C', to: 'Near', d: 150 },
      { h: 270, road: 'D', to: 'Mid', d: 300 },
      { h: 45, road: 'E', to: 'Farther', d: 790 },
      { h: 135, road: 'F' },
    ]);
    expect(b.map((x) => x.to)).toEqual(['Near', 'Mid', 'Far']);
    expect(b[0]!.h).toBeCloseTo(Math.PI / 2, 5);
  });

  it('shortens two-road roundabout names for the blade', () => {
    expect(signText('Ahmadu Bello Way / Sulu Gambari Road Roundabout')).toBe('Ahmadu Bello Way Roundabout');
    expect(signText('Post Office Roundabout')).toBe('Post Office Roundabout');
    expect(signText('Obo Market')).toBe('Obo Market');
  });
});
