/**
 * Where the timed challenges (TIME-1) start and finish. Each starts at a yellow board on a kerb near its
 * first place (clear of pickup stops, the workshop and other boards) and finishes at a stop by the target
 * place. A finish needn't be a pickup spot: Sadiku Hospital shares its road with the Unity Road Bus Park.
 */
import type { RoadNetwork } from './roads';
import { routeTree, type RouteTree } from './routing';
import { kerbNear, type Spot } from './spots';
import type { Zone } from './zone';

export interface ChallengeDef {
  id: string;
  from: string;
  to: string;
}

export interface ChallengePlace {
  id: string;
  from: string;
  to: string;
  start: Spot;
  finish: Spot;
  /** Routes to the finish, for the guidance arrow. */
  tree: RouteTree;
  /** Road distance from the start to the finish, in metres. */
  d: number;
}

/** How far (straight line) a start board stands from its place. */
const START_AIM = 60;
/** A start board keeps this far from pickup stops, the workshop and other boards. */
const START_CLEAR = 40;
/** A finish keeps this far from pickup stops. */
const FINISH_CLEAR = 20;

export function placeChallenges(
  zone: Zone,
  roads: RoadNetwork,
  defs: readonly ChallengeDef[],
  avoid: { stopX: number; stopY: number }[],
  blocked: (x: number, y: number) => boolean = () => false,
): ChallengePlace[] {
  const out: ChallengePlace[] = [];
  const taken = [...avoid];
  for (const c of defs) {
    const from = zone.spots.find((s) => s.name === c.from);
    const to = zone.spots.find((s) => s.name === c.to);
    if (!from || !to) continue;
    const start = kerbNear(zone, roads, `${c.from} to ${c.to}`, from, START_AIM, taken, START_CLEAR, blocked);
    const finish = kerbNear(zone, roads, c.to, to, 0, avoid, FINISH_CLEAR);
    if (!start || !finish) continue;
    const tree = routeTree(roads, finish.node);
    const d = tree.dist[start.node]!;
    if (!Number.isFinite(d)) continue;
    taken.push(start);
    out.push({ id: c.id, from: c.from, to: c.to, start, finish, tree, d });
  }
  return out;
}
