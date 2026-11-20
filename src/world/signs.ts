/**
 * Where the street name plates (NAV-2) and signpost blades (NAV-3) stand. Pure logic: the junction data
 * comes from tools/build_zone.py; this places one post on a corner of each junction, clear of the road.
 *
 * A post carries its plates on top, each turned along its road (so it reads from the crossing road), and
 * up to three fingerpost blades below, each pointing the way its road leaves.
 */
import type { Island } from './props';
import type { RoadNetwork } from './roads';
import type { Zone, ZoneJunction } from './zone';

export const MAX_BLADES = 3;
/** The post stands at least this far outside the road edge. */
const KERB_CLEAR = 0.8;

export interface SignPlate {
  name: string;
  /** Direction of the road, radians (0 = east, counter-clockwise). */
  h: number;
}

export interface SignBlade {
  /** Where the road leads. */
  to: string;
  /** Direction the blade points, radians. */
  h: number;
}

export interface SignPost {
  x: number;
  y: number;
  plates: SignPlate[];
  blades: SignBlade[];
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** The blades for a set of exits: nearest place first, one per place, at most MAX_BLADES. */
export function pickBlades(exits: ZoneJunction['exits']): SignBlade[] {
  const out: SignBlade[] = [];
  for (const e of [...exits].filter((e) => e.to).sort((a, b) => (a.d ?? 0) - (b.d ?? 0))) {
    if (out.length >= MAX_BLADES) break;
    if (out.some((b) => b.to === e.to)) continue;
    out.push({ to: e.to!, h: rad(e.h) });
  }
  return out;
}

/** One plate per road name, turned along the first exit on that road. */
function platesFor(j: ZoneJunction): SignPlate[] {
  return j.plates.map((name) => {
    const e = j.exits.find((x) => x.road === name);
    return { name, h: rad(e ? e.h : 0) };
  });
}

/** Middle of the widest gap between exits: the corner with the most room. */
function widestGapAngles(j: ZoneJunction): number[] {
  const hs = j.exits.map((e) => e.h).sort((a, b) => a - b);
  if (hs.length === 0) return [45];
  const gaps = hs.map((h, i) => {
    const next = i + 1 < hs.length ? hs[i + 1]! : hs[0]! + 360;
    return { mid: (h + next) / 2, size: next - h };
  });
  return gaps.sort((a, b) => b.size - a.size).map((g) => g.mid % 360);
}

/**
 * Places a post for every junction. `blocked` says whether a spot is inside a building or kiosk.
 * Roundabouts carry their posts on the island, either side of the warden in the middle.
 */
export function placeSignPosts(
  zone: Zone,
  roads: RoadNetwork,
  islands: Island[],
  blocked: (x: number, y: number) => boolean,
): SignPost[] {
  const posts: SignPost[] = [];
  const clear = (x: number, y: number) => roads.nearest(x, y).dist > KERB_CLEAR && !blocked(x, y);

  for (const j of zone.junctions) {
    const plates = platesFor(j);
    if (j.rb !== undefined) {
      const rb = zone.roundabouts[j.rb]!;
      const island = islands.find((i) => Math.hypot(i.x - rb.x, i.y - rb.y) < 1);
      if (!island) continue;
      // Up to two posts (DESIGN: at most three blades a post), on opposite sides of the island.
      const blades = pickBlades(j.exits);
      const more = pickBlades(j.exits.filter((e) => e.to && !blades.some((b) => b.to === e.to)));
      const a = rad(widestGapAngles(j)[0]!);
      const off = island.island * 0.6;
      posts.push({ x: rb.x + Math.cos(a) * off, y: rb.y + Math.sin(a) * off, plates, blades });
      if (more.length)
        posts.push({ x: rb.x - Math.cos(a) * off, y: rb.y - Math.sin(a) * off, plates: [], blades: more });
      continue;
    }
    // Ordinary junction: walk out along each gap's middle until the spot is off the road and clear.
    let spot: { x: number; y: number } | null = null;
    for (const deg of widestGapAngles(j)) {
      const a = rad(deg);
      for (let r = 3; r <= 16 && !spot; r += 1) {
        const x = j.x + Math.cos(a) * r;
        const y = j.y + Math.sin(a) * r;
        if (clear(x, y)) spot = { x, y };
      }
      if (spot) break;
    }
    if (!spot) continue;
    posts.push({ x: spot.x, y: spot.y, plates, blades: pickBlades(j.exits) });
  }
  return posts;
}

/**
 * Text as it goes on a board. A roundabout named after two roads ("Ahmadu Bello Way / Sulu Gambari Road
 * Roundabout") is too long for a blade, so it is shortened to the first road until it gets a local name
 * in the zone overrides.
 */
export function signText(name: string): string {
  const m = /^(.+?) \/ .+ Roundabout$/.exec(name);
  return m ? `${m[1]} Roundabout` : name;
}
