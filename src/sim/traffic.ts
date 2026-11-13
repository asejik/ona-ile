/**
 * NPC traffic (cars and kekes), ported from prototype v0.1. Pure logic: no Three.js.
 * Vehicles follow the road graph, keep to the right, respect one-way roads where they can,
 * slow for whatever is ahead, and stop at a warden's STOP signal.
 */
import type { RoadNetwork } from '../world/roads';
import type { Vec2 } from '../world/zone';
import type { Warden } from './wardens';

export type NpcKind = 'car' | 'keke';

export interface Npc {
  kind: NpcKind;
  /** Colour index chosen at spawn (renderer decides the palette). */
  colour: number;
  /** Edge from node a to node b; t metres travelled along it. */
  a: number;
  b: number;
  len: number;
  w: number;
  t: number;
  v: number;
  vmax: number;
  /** Collision radius in metres. */
  r: number;
  x: number;
  y: number;
  h: number;
  /** Seconds spent stopped; after 7 s the vehicle "ghosts" through for 2.5 s to clear jams. */
  stuck: number;
  ghost: number;
}

export function createTraffic(roads: RoadNetwork, nodes: Vec2[], rand: () => number, count: number): Npc[] {
  const out: Npc[] = [];
  const main = roads.mainNodes;
  if (main.length === 0) return out;
  for (let i = 0; i < count; i++) {
    let a = main[0]!;
    for (let tries = 0; tries < 200; tries++) {
      a = main[Math.floor(rand() * main.length)]!;
      if (roads.adjacency[a]!.some((e) => e.ok) && roads.nodeWidth[a]! >= 6) break;
    }
    const e = roads.adjacency[a]!.find((x) => x.ok) ?? roads.adjacency[a]![0]!;
    const kind: NpcKind = rand() < 0.5 ? 'keke' : 'car';
    const [x, y] = nodes[a]!;
    out.push({
      kind,
      colour: Math.floor(rand() * 7),
      a,
      b: e.to,
      len: e.len,
      w: e.w,
      t: rand() * e.len,
      v: 0,
      vmax: kind === 'keke' ? 6.5 + rand() * 2 : 8 + rand() * 3,
      r: kind === 'keke' ? 1.25 : 2.0,
      x,
      y,
      h: 0,
      stuck: 0,
      ghost: 0,
    });
  }
  return out;
}

const angDiff = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

export function stepTraffic(
  npcs: Npc[],
  roads: RoadNetwork,
  nodes: Vec2[],
  player: { x: number; y: number },
  wardens: Warden[],
  dt: number,
  rand: () => number,
): void {
  for (const n of npcs) {
    const fx = Math.cos(n.h);
    const fy = Math.sin(n.h);
    let target = n.vmax;
    if (n.ghost > 0) n.ghost -= dt;
    else if (blockedAhead(n, fx, fy, player, npcs, wardens)) target = 0;

    n.v = target < n.v ? Math.max(target, n.v - 10 * dt) : Math.min(target, n.v + 3.5 * dt);
    if (n.v < 0.2) {
      n.stuck += dt;
      if (n.stuck > 7) {
        n.ghost = 2.5;
        n.stuck = 0;
      }
    } else n.stuck = 0;

    n.t += n.v * dt;
    for (let guard = 0; n.t >= n.len && guard < 5; guard++) {
      n.t -= n.len;
      const prev = n.a;
      n.a = n.b;
      const edges = roads.adjacency[n.a]!;
      let opts = edges.filter((e) => e.ok && e.to !== prev);
      if (!opts.length) opts = edges.filter((e) => e.to !== prev);
      if (!opts.length) opts = edges;
      // Prefer bigger roads, like real traffic.
      let total = 0;
      for (const e of opts) total += e.w >= 8 ? 3 : 1;
      let pickR = rand() * total;
      let next = opts[0]!;
      for (const e of opts) {
        pickR -= e.w >= 8 ? 3 : 1;
        if (pickR <= 0) {
          next = e;
          break;
        }
      }
      n.b = next.to;
      n.len = next.len;
      n.w = next.w;
    }

    const [ax, ay] = nodes[n.a]!;
    const [bx, by] = nodes[n.b]!;
    const k = n.t / n.len;
    const dx = bx - ax;
    const dy = by - ay;
    const l = Math.hypot(dx, dy) || 1;
    const lane = Math.max(1.4, n.w / 4);
    // Keep right: offset to the right of the direction of travel.
    const tx = ax + dx * k + (dy / l) * lane;
    const ty = ay + dy * k - (dx / l) * lane;
    const kf = 1 - Math.exp(-8 * dt);
    n.x += (tx - n.x) * kf;
    n.y += (ty - n.y) * kf;
    n.h += angDiff(n.h, Math.atan2(dy, dx)) * (1 - Math.exp(-6 * dt));
  }
}

function blockedAhead(
  n: Npc,
  fx: number,
  fy: number,
  player: { x: number; y: number },
  npcs: Npc[],
  wardens: Warden[],
): boolean {
  const px = player.x - n.x;
  const py = player.y - n.y;
  const along = px * fx + py * fy;
  if (along > 0 && along < 9 && Math.abs(-px * fy + py * fx) < 2.8) return true;
  for (const m of npcs) {
    if (m === n) continue;
    const ex = m.x - n.x;
    const ey = m.y - n.y;
    const a2 = ex * fx + ey * fy;
    const sameWay = Math.cos(m.h) * fx + Math.sin(m.h) * fy > 0.2;
    if (a2 > 0 && a2 < 7.5 && Math.abs(-ex * fy + ey * fx) < 2.2 && sameWay) return true;
  }
  for (const w of wardens) {
    if (w.phase !== 'stop') continue;
    const tx = w.x - n.x;
    const ty = w.y - n.y;
    const d = Math.hypot(tx, ty);
    if (d > w.r + 3 && d < w.r + 15 && (tx * fx + ty * fy) / d > 0.45) return true;
  }
  return false;
}

/**
 * Pushes a circle (the player's keke) out of any NPC it overlaps. Returns the impact speed used for
 * bumps (player speed plus half the other vehicle's), or 0 when nothing was hit.
 */
export function pushOutOfTraffic(
  pos: { x: number; y: number },
  r: number,
  speed: number,
  npcs: Npc[],
): number {
  let impact = 0;
  for (const n of npcs) {
    const dx = pos.x - n.x;
    const dy = pos.y - n.y;
    const d = Math.hypot(dx, dy);
    const min = r + n.r;
    if (d < min && d > 1e-4) {
      pos.x = n.x + (dx / d) * min;
      pos.y = n.y + (dy / d) * min;
      impact = Math.max(impact, speed + n.v * 0.5);
    }
  }
  return impact;
}
