/**
 * Oga Lati's roadside workshop (DMG-4): a stop on a main road near the Post Office Terminus, where the
 * keke pulls over for repairs and where a broken-down keke is towed. The business is invented.
 */
import type { RoadNetwork } from './roads';
import { placeAtKerb, type Spot } from './spots';
import type { Zone } from './zone';

export const WORKSHOP_NAME = "Oga Lati's Workshop";
/** How far from the first spot (the Post Office Terminus) the workshop should be. */
const AIM = 110;
/** Kept this far from every pickup and drop-off stop, so the two never share a kerb. */
const CLEAR = 45;

/** `blocked(x, y)` says whether the workshop sign would stand inside a building or kiosk. */
export function placeWorkshop(
  zone: Zone,
  roads: RoadNetwork,
  spots: Spot[],
  blocked: (x: number, y: number) => boolean = () => false,
): Spot | null {
  const home = zone.spots[0];
  if (!home) return null;
  const candidates = roads.mainNodes
    .filter((i) => roads.nodeWidth[i]! >= 6)
    .map((i) => {
      const [x, y] = zone.nodes[i]!;
      return { i, miss: Math.abs(Math.hypot(x - home.x, y - home.y) - AIM) };
    })
    .sort((a, b) => a.miss - b.miss);
  for (const { i } of candidates) {
    const placed = placeAtKerb(zone, roads, i);
    if (!placed || blocked(placed.kerbX, placed.kerbY)) continue;
    if (spots.some((s) => Math.hypot(s.stopX - placed.stopX, s.stopY - placed.stopY) < CLEAR)) continue;
    return { name: WORKSHOP_NAME, node: i, ...placed };
  }
  return null;
}
