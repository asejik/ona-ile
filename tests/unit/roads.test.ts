import { describe, expect, it } from 'vitest';
import { RoadNetwork } from '../../src/world/roads';
import { startPose } from '../../src/world/start';
import { parseZone } from '../../src/world/zone';
import { realZone, tinyZone } from './fixtures';

describe('RoadNetwork', () => {
  it('builds one segment per pair of road nodes', () => {
    expect(new RoadNetwork(tinyZone()).segments).toHaveLength(5);
  });

  it('measures distance from the road edge', () => {
    const roads = new RoadNetwork(tinyZone());
    expect(roads.nearest(-25, 0).dist).toBeCloseTo(-5); // centre of a 10 m road
    expect(roads.nearest(-25, 5).dist).toBeCloseTo(0); // on the kerb
    expect(roads.nearest(-25, 9).dist).toBeCloseTo(4); // 4 m off the road
  });

  it('reports "far" with no segment when nothing is nearby', () => {
    expect(new RoadNetwork(tinyZone()).nearest(-90, 90)).toEqual({ dist: 99, seg: -1 });
  });

  it('names the road under the player, and nothing off-road', () => {
    const roads = new RoadNetwork(tinyZone());
    expect(roads.roadNameAt(-25, 1)).toBe('Unity Road');
    expect(roads.roadNameAt(0, 30)).toBe('Ahmadu Bello Way');
    expect(roads.roadNameAt(-25, 20)).toBe('');
  });

  it('marks the reverse direction of a one-way road as not allowed', () => {
    const roads = new RoadNetwork(tinyZone());
    expect(roads.adjacency[0]!.find((e) => e.to === 1)!.ok).toBe(true);
    expect(roads.adjacency[1]!.find((e) => e.to === 0)!.ok).toBe(false);
    expect(roads.adjacency[1]!.find((e) => e.to === 3)!.ok).toBe(true);
  });

  it('keeps the largest connected piece for routing and drops islands', () => {
    const main = new RoadNetwork(tinyZone()).mainNodes;
    expect(main).toEqual([0, 1, 2, 3, 4]);
  });

  it('starts the player on the nearest wide road, facing along it', () => {
    const zone = tinyZone();
    const pose = startPose(zone, new RoadNetwork(zone));
    expect(pose.x).toBeCloseTo(-30);
    expect(pose.y).toBeCloseTo(0);
    expect(pose.h).toBeCloseTo(0);
  });
});

describe('real zone: Post Office and Unity Road', () => {
  it('loads and has the expected size', () => {
    const zone = realZone();
    expect(zone.id).toBe('zone1-post-office');
    expect(zone.nodes.length).toBe(2303);
    expect(zone.roads.length).toBe(325);
    expect(zone.attribution).toContain('OpenStreetMap');
  });

  it('starts the player on Unity Road area roads, not off-road', () => {
    const zone = realZone();
    const roads = new RoadNetwork(zone);
    const pose = startPose(zone, roads);
    expect(roads.nearest(pose.x, pose.y).dist).toBeLessThan(0);
  });

  it('has a connected main network covering most nodes', () => {
    const zone = realZone();
    const main = new RoadNetwork(zone).mainNodes.length;
    expect(main / zone.nodes.length).toBeGreaterThan(0.8);
  });
});

describe('parseZone', () => {
  it('rejects files that are missing required fields', () => {
    expect(() => parseZone({ id: 'x' })).toThrow(/missing "nodes"/);
    expect(() => parseZone(null)).toThrow(/not an object/);
  });
});
