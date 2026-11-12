import zoneJson from '../../public/zones/zone1-post-office.json?raw';
import type { Zone } from '../../src/world/zone';
import { parseZone } from '../../src/world/zone';

/**
 * A tiny hand-made zone: an east-west road (one-way) meeting a north-south road at (0, 0),
 * one 10 x 10 building north-east of the junction, and a roundabout island to the west.
 */
export function tinyZone(): Zone {
  return parseZone({
    id: 'tiny',
    title: 'Tiny',
    scale: 1,
    floorH: 3,
    bounds: [-100, -100, 100, 100],
    attribution: 'test',
    nodes: [
      [-50, 0],
      [0, 0],
      [50, 0],
      [0, -50],
      [0, 50],
      [200, 200],
      [210, 200],
    ],
    roads: [
      { n: 'Unity Road', w: 10, p: [0, 1, 2], ow: 1 },
      { n: 'Ahmadu Bello Way', w: 8, p: [3, 1, 4] },
      { n: '', w: 6, p: [5, 6] },
    ],
    roundabouts: [{ x: -80, y: -80, r: 12, name: 'Test Roundabout', roads: [] }],
    buildings: [[2, 10, 10, 20, 10, 20, 20, 10, 20]],
    spots: [{ name: 'Start', x: -30, y: 2 }],
    notebook: [],
  });
}

let real: Zone | undefined;
/** The real Post Office and Unity Road zone, built by tools/build_zone.py. */
export function realZone(): Zone {
  real ??= parseZone(JSON.parse(zoneJson));
  return real;
}
