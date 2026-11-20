/**
 * Zone data produced by tools/build_zone.py from a pinned OpenStreetMap extract.
 * Map data © OpenStreetMap contributors, ODbL 1.0.
 *
 * World coordinates: x is east, y is north, in game metres (real distance × zone.scale).
 */

export type Vec2 = readonly [number, number];

export interface ZoneRoad {
  /** Cleaned road name, or "" when OSM has none. */
  n: string;
  /** Road width in game metres. */
  w: number;
  /** Indices into Zone.nodes, in drawing order. */
  p: number[];
  /** 1 when the road is part of a roundabout. */
  rb?: 1;
  /** 1 when the road is one-way in drawing order. */
  ow?: 1;
}

export interface ZoneRoundabout {
  x: number;
  y: number;
  r: number;
  name: string;
  roads: string[];
}

export interface ZoneSpot {
  name: string;
  x: number;
  y: number;
}

export interface ZoneNotebookPlace extends ZoneSpot {
  note: string;
}

/** One way out of a junction (NAV-3). */
export interface ZoneExit {
  /** Direction out of the junction in whole degrees: 0 is east, 90 is north. */
  h: number;
  /** The road's name, or '' for an unnamed road. */
  road: string;
  /** The first named place, area or roundabout this road leads to, if one is within reach. */
  to?: string;
  /** Distance to it along the road, in game metres. */
  d?: number;
}

/**
 * A junction with street name plates (NAV-2) and signpost data (NAV-3), computed by tools/build_zone.py.
 * Divided roads are merged, so one real crossing is one junction.
 */
export interface ZoneJunction {
  x: number;
  y: number;
  /** Index into zone.roundabouts when the junction is a roundabout. */
  rb?: number;
  /** The named roads that meet here, sorted. */
  plates: string[];
  exits: ZoneExit[];
}

export interface Zone {
  id: string;
  title: string;
  scale: number;
  floorH: number;
  /** [minX, minY, maxX, maxY] */
  bounds: [number, number, number, number];
  attribution: string;
  nodes: Vec2[];
  roads: ZoneRoad[];
  roundabouts: ZoneRoundabout[];
  /** Each building is [levels, x0, y0, x1, y1, ...], counter-clockwise. */
  buildings: number[][];
  spots: ZoneSpot[];
  notebook: ZoneNotebookPlace[];
  /** Empty for zones built without an overrides file. */
  junctions: ZoneJunction[];
}

/** Checks the fields the game relies on, so a bad file fails with a clear message. */
export function parseZone(data: unknown): Zone {
  const z = data as Partial<Zone> | null;
  if (!z || typeof z !== 'object') throw new Error('Zone file is not an object');
  const required: (keyof Zone)[] = ['id', 'nodes', 'roads', 'buildings', 'bounds', 'attribution', 'spots'];
  for (const key of required) {
    if (z[key] === undefined) throw new Error(`Zone file is missing "${key}"`);
  }
  if (!Array.isArray(z.nodes) || z.nodes.length === 0) throw new Error('Zone file has no road nodes');
  return { ...z, junctions: Array.isArray(z.junctions) ? z.junctions : [] } as Zone;
}

export async function loadZone(url: string): Promise<Zone> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load the map (HTTP ${res.status})`);
  return parseZone(await res.json());
}
