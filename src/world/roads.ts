import type { Zone } from './zone';

export interface Segment {
  a: number;
  b: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Half the road width. */
  hw: number;
  /** Index into Zone.roads. */
  road: number;
}

export interface Edge {
  to: number;
  len: number;
  /** False when this direction breaks a one-way rule. */
  ok: boolean;
  /** Width of the road this edge belongs to, in metres. */
  w: number;
}

export interface RoadHit {
  /** Distance from the road edge: negative inside the road, positive outside. */
  dist: number;
  /** The nearest segment, or -1 when none is near. */
  seg: number;
}

const CELL = 20;
const FAR = 99;
const key = (gx: number, gy: number) => (gx + 4096) * 8192 + (gy + 4096);

/** The road network: segments, adjacency, and a spatial grid for "how far from the road am I?". */
export class RoadNetwork {
  readonly segments: Segment[] = [];
  readonly adjacency: Edge[][];
  /** Widest road meeting at each node, in metres (0 for nodes not on a road). */
  readonly nodeWidth: Float32Array;
  /** Nodes in the largest connected piece of the network (used for routing). */
  readonly mainNodes: number[];
  private readonly grid = new Map<number, number[]>();

  constructor(private readonly zone: Zone) {
    const nodes = zone.nodes;
    this.adjacency = nodes.map(() => []);
    this.nodeWidth = new Float32Array(nodes.length);
    zone.roads.forEach((road, roadIndex) => {
      const oneWay = road.ow === 1 || road.rb === 1;
      for (let i = 0; i < road.p.length - 1; i++) {
        const a = road.p[i]!;
        const b = road.p[i + 1]!;
        if (a === b) continue;
        const [ax, ay] = nodes[a]!;
        const [bx, by] = nodes[b]!;
        const len = Math.hypot(bx - ax, by - ay);
        if (len < 0.05) continue;
        this.adjacency[a]!.push({ to: b, len, ok: true, w: road.w });
        this.adjacency[b]!.push({ to: a, len, ok: !oneWay, w: road.w });
        this.nodeWidth[a] = Math.max(this.nodeWidth[a]!, road.w);
        this.nodeWidth[b] = Math.max(this.nodeWidth[b]!, road.w);
        this.segments.push({ a, b, ax, ay, bx, by, hw: road.w / 2, road: roadIndex });
      }
    });
    this.segments.forEach((s, i) => {
      const x0 = Math.floor((Math.min(s.ax, s.bx) - s.hw) / CELL);
      const x1 = Math.floor((Math.max(s.ax, s.bx) + s.hw) / CELL);
      const y0 = Math.floor((Math.min(s.ay, s.by) - s.hw) / CELL);
      const y1 = Math.floor((Math.max(s.ay, s.by) + s.hw) / CELL);
      for (let gx = x0; gx <= x1; gx++) {
        for (let gy = y0; gy <= y1; gy++) {
          const k = key(gx, gy);
          let cell = this.grid.get(k);
          if (!cell) this.grid.set(k, (cell = []));
          cell.push(i);
        }
      }
    });
    this.mainNodes = this.largestComponent();
  }

  /** Signed distance to the nearest road edge at (x, y). */
  nearest(x: number, y: number): RoadHit {
    const cell = this.grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL)));
    if (!cell) return { dist: FAR, seg: -1 };
    let best = FAR;
    let seg = -1;
    for (const i of cell) {
      const s = this.segments[i]!;
      const ex = s.bx - s.ax;
      const ey = s.by - s.ay;
      const t = clamp(((x - s.ax) * ex + (y - s.ay) * ey) / (ex * ex + ey * ey), 0, 1);
      const d = Math.hypot(x - (s.ax + t * ex), y - (s.ay + t * ey)) - s.hw;
      if (d < best) {
        best = d;
        seg = i;
      }
    }
    return { dist: best, seg };
  }

  /** Name of the road at (x, y), or "" when off-road or unnamed. */
  roadNameAt(x: number, y: number): string {
    const hit = this.nearest(x, y);
    if (hit.seg < 0 || hit.dist > 1) return '';
    return this.zone.roads[this.segments[hit.seg]!.road]!.n;
  }

  private largestComponent(): number[] {
    const n = this.zone.nodes.length;
    const comp = new Int32Array(n).fill(-1);
    let best = -1;
    let bestSize = 0;
    let c = 0;
    for (let s = 0; s < n; s++) {
      if (comp[s] !== -1 || this.adjacency[s]!.length === 0) continue;
      let size = 0;
      const stack = [s];
      comp[s] = c;
      while (stack.length) {
        const node = stack.pop()!;
        size++;
        for (const e of this.adjacency[node]!) {
          if (comp[e.to] === -1) {
            comp[e.to] = c;
            stack.push(e.to);
          }
        }
      }
      if (size > bestSize) {
        bestSize = size;
        best = c;
      }
      c++;
    }
    const out: number[] = [];
    for (let i = 0; i < n; i++) if (comp[i] === best) out.push(i);
    return out;
  }
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
