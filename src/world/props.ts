import type { RoadNetwork } from './roads';
import type { Zone } from './zone';

/** Small, fast, seeded random numbers, so props land in the same places on every device. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Island {
  x: number;
  y: number;
  /** Radius of the roundabout ring (road centre line). */
  r: number;
  /** Radius of the solid grass island in the middle. */
  island: number;
  name: string;
}

/** Roundabouts big enough to have a central island (8–26 m ring radius in game units). */
export function roundaboutIslands(zone: Zone): Island[] {
  return zone.roundabouts
    .filter((r) => r.r >= 8 && r.r <= 26)
    .map((r) => ({ x: r.x, y: r.y, r: r.r, island: Math.max(2.4, r.r - 6.3), name: r.name }));
}

/** A polygon approximating a circle, counter-clockwise, as a flat [x0, y0, x1, y1, ...] list. */
export function circlePolygon(x: number, y: number, radius: number, sides = 14): number[] {
  const pts: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    pts.push(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  return pts;
}

export interface Kiosk {
  /** Flat polygon, counter-clockwise. */
  poly: number[];
  /** Index into KIOSK_COLOURS. */
  colour: number;
}

export const KIOSK_COLOURS = ['#2F7FC1', '#E0B92F', '#C0392B', '#3A9A5B', '#E67E22', '#8E44AD', '#16A085'];

/**
 * Painted containers and stalls along the bigger roads, as in prototype v0.1.
 * `blocked(x, y)` says whether a spot is inside a building.
 */
export function placeKiosks(
  roads: RoadNetwork,
  blocked: (x: number, y: number) => boolean,
  rand: () => number,
  max = 260,
): Kiosk[] {
  const out: Kiosk[] = [];
  for (const s of roads.segments) {
    if (s.hw < 5 || out.length >= max) continue;
    const ex = s.bx - s.ax;
    const ey = s.by - s.ay;
    const len = Math.hypot(ex, ey);
    const ux = ex / len;
    const uy = ey / len;
    for (let d = 10; d < len - 6; d += 34) {
      if (rand() < 0.45) continue;
      const side = rand() < 0.5 ? 1 : -1;
      const off = s.hw + 2.6;
      const cx = s.ax + ux * d + uy * off * side;
      const cy = s.ay + uy * d - ux * off * side;
      const colour = Math.floor(rand() * KIOSK_COLOURS.length);
      if (roads.nearest(cx, cy).dist < 1.2 || blocked(cx, cy)) continue;
      const hl = 1.1;
      const hw = 0.85;
      const poly: number[] = [];
      for (const [a, b] of [
        [-hl, -hw],
        [hl, -hw],
        [hl, hw],
        [-hl, hw],
      ] as const) {
        poly.push(cx + ux * a - uy * b, cy + uy * a + ux * b);
      }
      out.push({ poly, colour });
      if (out.length >= max) break;
    }
  }
  return out;
}

export interface Tree {
  x: number;
  y: number;
  scale: number;
  stretch: number;
  rotation: number;
  /** Index into TREE_GREENS. */
  green: number;
}

export const TREE_GREENS = ['#4F7A2E', '#6B8A35', '#3F6B33', '#7D8A48', '#5A7D3A'];

/** Neem and mango trees scattered off the roads and outside buildings. */
export function placeTrees(
  zone: Zone,
  roads: RoadNetwork,
  blocked: (x: number, y: number) => boolean,
  rand: () => number,
  count: number,
): Tree[] {
  const [x0, y0, x1, y1] = zone.bounds;
  const out: Tree[] = [];
  for (let tries = 0; out.length < count && tries < count * 30; tries++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    if (roads.nearest(x, y).dist < 2.8 || blocked(x, y)) continue;
    const scale = 0.75 + rand() * 0.7;
    out.push({
      x,
      y,
      scale,
      stretch: 0.85 + rand() * 0.4,
      rotation: rand() * Math.PI * 2,
      green: Math.floor(rand() * TREE_GREENS.length),
    });
  }
  return out;
}
