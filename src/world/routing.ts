/**
 * Shortest routes over the road graph, ported from prototype v0.1.
 * A tree is built once from the destination, so re-routing from anywhere is just following next-hops.
 */
import type { RoadNetwork } from './roads';
import type { Vec2 } from './zone';

export interface RouteTree {
  dest: number;
  /** Road distance from each node to the destination (Infinity if unreachable). */
  dist: Float64Array;
  /** Next node towards the destination, or -1. */
  next: Int32Array;
}

export function routeTree(roads: RoadNetwork, dest: number): RouteTree {
  const n = roads.adjacency.length;
  const dist = new Float64Array(n).fill(Infinity);
  const next = new Int32Array(n).fill(-1);
  dist[dest] = 0;
  // Binary heap of [node, distance].
  const hn: number[] = [dest];
  const hd: number[] = [0];
  const swap = (i: number, j: number) => {
    [hn[i], hn[j]] = [hn[j]!, hn[i]!];
    [hd[i], hd[j]] = [hd[j]!, hd[i]!];
  };
  const push = (node: number, d: number) => {
    hn.push(node);
    hd.push(d);
    let i = hn.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (hd[p]! <= hd[i]!) break;
      swap(p, i);
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top: [number, number] = [hn[0]!, hd[0]!];
    const ln = hn.pop()!;
    const ld = hd.pop()!;
    if (hn.length) {
      hn[0] = ln;
      hd[0] = ld;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < hn.length && hd[l]! < hd[m]!) m = l;
        if (r < hn.length && hd[r]! < hd[m]!) m = r;
        if (m === i) break;
        swap(m, i);
        i = m;
      }
    }
    return top;
  };
  while (hn.length) {
    const [node, d] = pop();
    if (d > dist[node]!) continue;
    for (const e of roads.adjacency[node]!) {
      const nd = d + e.len;
      if (nd < dist[e.to]!) {
        dist[e.to] = nd;
        next[e.to] = node;
        push(e.to, nd);
      }
    }
  }
  return { dest, dist, next };
}

export interface Route {
  /** Points from the player to the destination. */
  pts: Vec2[];
  /** Total length in metres. */
  len: number;
}

/** Route from (x, y) to the tree's destination, starting from the better end of the nearest road segment. */
export function routeFrom(tree: RouteTree, roads: RoadNetwork, nodes: Vec2[], x: number, y: number): Route {
  let start = -1;
  const hit = roads.nearest(x, y);
  if (hit.seg >= 0 && hit.dist < 6) {
    const s = roads.segments[hit.seg]!;
    const da = Math.hypot(x - s.ax, y - s.ay) + tree.dist[s.a]!;
    const db = Math.hypot(x - s.bx, y - s.by) + tree.dist[s.b]!;
    start = da < db ? s.a : s.b;
  }
  if (start < 0 || !Number.isFinite(tree.dist[start]!)) {
    let best = Infinity;
    for (const i of roads.mainNodes) {
      const [nx, ny] = nodes[i]!;
      const d = Math.hypot(nx - x, ny - y);
      if (d < best && Number.isFinite(tree.dist[i]!)) {
        best = d;
        start = i;
      }
    }
  }
  const pts: Vec2[] = [[x, y]];
  if (start < 0) return { pts, len: Infinity };
  const [sx, sy] = nodes[start]!;
  let n = start;
  for (let guard = 0; n >= 0 && guard < 4000; guard++) {
    pts.push(nodes[n]!);
    if (n === tree.dest) break;
    n = tree.next[n]!;
  }
  return { pts, len: Math.hypot(sx - x, sy - y) + tree.dist[start]! };
}
