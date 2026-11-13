import { circlePolygon, roundaboutIslands } from './props';
import { clamp } from './roads';
import type { Zone } from './zone';

interface Obstacle {
  /** Flat polygon [x0, y0, x1, y1, ...], counter-clockwise. */
  p: number[];
  n: number;
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
}

export interface CollisionResult {
  x: number;
  y: number;
  hit: boolean;
  /** Push-out direction of the last contact (unit vector), or 0 when no hit. */
  nx: number;
  ny: number;
}

const CELL = 16;
const key = (gx: number, gy: number) => (gx + 4096) * 8192 + (gy + 4096);

/** Static obstacles: building footprints, roundabout islands and any extra props (kiosks). */
export class Obstacles {
  readonly list: Obstacle[] = [];
  private readonly grid = new Map<number, number[]>();
  private readonly seen: Uint32Array;
  private stamp = 1;

  constructor(zone: Zone, extra: number[][] = []) {
    for (const b of zone.buildings) this.add(b.slice(1));
    for (const p of extra) this.add(p);
    for (const r of roundaboutIslands(zone)) this.add(circlePolygon(r.x, r.y, r.island));
    this.list.forEach((o, i) => {
      for (let gx = Math.floor(o.minx / CELL); gx <= Math.floor(o.maxx / CELL); gx++) {
        for (let gy = Math.floor(o.miny / CELL); gy <= Math.floor(o.maxy / CELL); gy++) {
          const k = key(gx, gy);
          let cell = this.grid.get(k);
          if (!cell) this.grid.set(k, (cell = []));
          cell.push(i);
        }
      }
    });
    this.seen = new Uint32Array(this.list.length);
  }

  /** Moves a circle of radius r at (x, y) out of any obstacle it overlaps. */
  collide(x: number, y: number, r: number): CollisionResult {
    let hit = false;
    let nx = 0;
    let ny = 0;
    for (let pass = 0; pass < 2; pass++) {
      this.stamp++;
      for (let gx = Math.floor((x - r) / CELL); gx <= Math.floor((x + r) / CELL); gx++) {
        for (let gy = Math.floor((y - r) / CELL); gy <= Math.floor((y + r) / CELL); gy++) {
          const cell = this.grid.get(key(gx, gy));
          if (!cell) continue;
          for (const idx of cell) {
            if (this.seen[idx] === this.stamp) continue;
            this.seen[idx] = this.stamp;
            const o = this.list[idx]!;
            if (x + r < o.minx || x - r > o.maxx || y + r < o.miny || y - r > o.maxy) continue;
            const c = closestEdge(o, x, y);
            if (pointInPolygon(o, x, y)) {
              x = c.px + c.enx * r;
              y = c.py + c.eny * r;
              nx = c.enx;
              ny = c.eny;
              hit = true;
            } else if (c.d < r && c.d > 1e-6) {
              const ux = (x - c.px) / c.d;
              const uy = (y - c.py) / c.d;
              x = c.px + ux * r;
              y = c.py + uy * r;
              nx = ux;
              ny = uy;
              hit = true;
            }
          }
        }
      }
    }
    return { x, y, hit, nx, ny };
  }

  private add(p: number[]): void {
    let minx = Infinity;
    let miny = Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;
    for (let i = 0; i < p.length; i += 2) {
      minx = Math.min(minx, p[i]!);
      maxx = Math.max(maxx, p[i]!);
      miny = Math.min(miny, p[i + 1]!);
      maxy = Math.max(maxy, p[i + 1]!);
    }
    this.list.push({ p, n: p.length / 2, minx, miny, maxx, maxy });
  }
}

function closestEdge(o: Obstacle, x: number, y: number) {
  const p = o.p;
  let d = Infinity;
  let px = 0;
  let py = 0;
  let enx = 0;
  let eny = 0;
  for (let i = 0; i < o.n; i++) {
    const j = (i + 1) % o.n;
    const ax = p[2 * i]!;
    const ay = p[2 * i + 1]!;
    const ex = p[2 * j]! - ax;
    const ey = p[2 * j + 1]! - ay;
    const len2 = ex * ex + ey * ey;
    if (len2 < 1e-6) continue;
    const t = clamp(((x - ax) * ex + (y - ay) * ey) / len2, 0, 1);
    const qx = ax + t * ex;
    const qy = ay + t * ey;
    const dist = Math.hypot(x - qx, y - qy);
    if (dist < d) {
      d = dist;
      px = qx;
      py = qy;
      const len = Math.sqrt(len2);
      // Outward normal of a counter-clockwise edge.
      enx = ey / len;
      eny = -ex / len;
    }
  }
  return { d, px, py, enx, eny };
}

function pointInPolygon(o: Obstacle, x: number, y: number): boolean {
  const p = o.p;
  let inside = false;
  for (let i = 0, j = o.n - 1; i < o.n; j = i++) {
    const xi = p[2 * i]!;
    const yi = p[2 * i + 1]!;
    const xj = p[2 * j]!;
    const yj = p[2 * j + 1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
