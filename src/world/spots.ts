/**
 * Pickup and drop-off spots (CORE-5): passengers wait on the kerb, never in the road.
 * Each named place from the zone is snapped to the nearest node of the main road network, then given:
 *  - a kerb point just off the road edge, where the passenger stands;
 *  - a stop point inside the road near that kerb, where the keke pulls over.
 */
import type { RoadNetwork } from './roads';
import type { Zone } from './zone';

export interface Spot {
  name: string;
  /** Road node this spot is attached to (used for routing). */
  node: number;
  /** Where the keke stops: in the lane nearest the kerb. */
  stopX: number;
  stopY: number;
  /** Where the passenger stands: on the kerb, just off the road. */
  kerbX: number;
  kerbY: number;
  /** Direction along the road at the stop, for orienting markers. */
  heading: number;
}

/** How close (metres) and how slow (m/s) the keke must be to pick up or drop off. */
export const STOP_RADIUS = 5;
export const STOP_SPEED = 2.2;

/**
 * Finds a stop point and kerb point near a road node. Junctions are avoided by moving a few metres along
 * each road leaving the node, trying the right-hand side first, until the kerb is clear of every road.
 */
export function placeAtKerb(
  zone: Zone,
  roads: RoadNetwork,
  node: number,
): Omit<Spot, 'name' | 'node'> | null {
  const [nx, ny] = zone.nodes[node]!;
  for (const along of [10, 16, 22, 6, 28]) {
    for (const e of roads.adjacency[node]!) {
      const [tx, ty] = zone.nodes[e.to]!;
      const len = Math.hypot(tx - nx, ty - ny) || 1;
      if (along > len - 2) continue;
      const ux = (tx - nx) / len;
      const uy = (ty - ny) / len;
      const bx = nx + ux * along;
      const by = ny + uy * along;
      const hw = e.w / 2;
      for (const side of [1, -1]) {
        // side 1 is the right-hand side of the direction of travel (traffic keeps right).
        const rx = uy * side;
        const ry = -ux * side;
        const kerbX = bx + rx * (hw + 1.3);
        const kerbY = by + ry * (hw + 1.3);
        const stopX = bx + rx * Math.max(0.5, hw - 1.6);
        const stopY = by + ry * Math.max(0.5, hw - 1.6);
        if (roads.nearest(kerbX, kerbY).dist > 0.3 && roads.nearest(stopX, stopY).dist < -0.3) {
          const heading = side === 1 ? Math.atan2(uy, ux) : Math.atan2(-uy, -ux);
          return { stopX, stopY, kerbX, kerbY, heading };
        }
      }
    }
  }
  return null;
}

export function buildSpots(zone: Zone, roads: RoadNetwork): Spot[] {
  const out: Spot[] = [];
  const used = new Set<number>();
  for (const s of zone.spots) {
    let node = -1;
    let best = Infinity;
    for (const i of roads.mainNodes) {
      const [x, y] = zone.nodes[i]!;
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < best && roads.nodeWidth[i]! >= 6) {
        best = d;
        node = i;
      }
    }
    if (node < 0 || best > 90 || used.has(node)) continue;
    const placed = placeAtKerb(zone, roads, node);
    if (!placed) continue;
    used.add(node);
    out.push({ name: s.name, node, ...placed });
  }
  return out;
}

/** True when the keke is stopped at this spot. */
export function atSpot(s: Spot, x: number, y: number, speed: number): boolean {
  return Math.hypot(x - s.stopX, y - s.stopY) < STOP_RADIUS && speed < STOP_SPEED;
}
