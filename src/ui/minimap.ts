/**
 * The rotating minimap (NAV-5), ported from prototype v0.1.
 * The map is drawn once into an offscreen canvas; each redraw just rotates and crops it, then writes the
 * names of nearby roads and the markers on top in screen space, so text stays upright.
 * Redraws are capped at 20 a second (DESIGN.md P-3).
 */
import type { Warden } from '../sim/wardens';
import type { Island } from '../world/props';
import type { Zone } from '../world/zone';
import { drawMark, drawRoadLabel, labelSpots, type Box, type MapMark } from './mapdraw';

/** Metres shown from the centre to the edge. */
const RANGE = 200;
/** Pixels per metre in the offscreen map. */
const PPM = 1.2;
const MIN_INTERVAL = 1 / 20;
/** At most this many road names at once, so the small map stays readable. */
const MAX_LABELS = 3;
/** Label size in CSS pixels. */
const LABEL_CSS_PX = 8.5;

/** The small map shortens suffixes so names fit: "Sulu Gambari Rd". */
export function shortName(name: string): string {
  return name
    .replace(/ Road$/, ' Rd')
    .replace(/ Street$/, ' St')
    .replace(/ Close$/, ' Cl');
}

export interface Minimap {
  /** Marks: waiting passengers, the drop-off and notebook places; off-map ones stick to the rim. */
  draw(player: { x: number; y: number; h: number }, wardens: Warden[], dt: number, marks?: MapMark[]): void;
}

export function createMinimap(
  canvas: HTMLCanvasElement,
  north: HTMLElement,
  zone: Zone,
  islands: Island[],
): Minimap {
  const ctx = canvas.getContext('2d')!;
  const [bx0, by0, bx1, by1] = zone.bounds;
  const X0 = bx0 - 60;
  const Y1 = by1 + 60;
  const map = document.createElement('canvas');
  map.width = Math.ceil((bx1 - bx0 + 120) * PPM);
  map.height = Math.ceil((by1 - by0 + 120) * PPM);
  {
    const g = map.getContext('2d')!;
    const X = (x: number) => (x - X0) * PPM;
    const Y = (y: number) => (Y1 - y) * PPM;
    g.fillStyle = '#C79466';
    g.fillRect(0, 0, map.width, map.height);
    g.fillStyle = '#E9D6B4';
    for (const b of zone.buildings) {
      g.beginPath();
      for (let i = 1; i < b.length; i += 2) {
        const x = X(b[i]!);
        const y = Y(b[i + 1]!);
        if (i === 1) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
    }
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const r of zone.roads) {
        g.strokeStyle = pass ? (r.w >= 10 ? '#3F3B37' : '#5D564F') : '#2A2622';
        g.lineWidth = (r.w + (pass ? 0 : 2.4)) * PPM;
        g.beginPath();
        r.p.forEach((i, k) => {
          const [x, y] = zone.nodes[i]!;
          if (k === 0) g.moveTo(X(x), Y(y));
          else g.lineTo(X(x), Y(y));
        });
        g.stroke();
      }
    }
    g.fillStyle = '#6F8F3A';
    for (const r of islands) {
      g.beginPath();
      g.arc(X(r.x), Y(r.y), r.island * PPM, 0, Math.PI * 2);
      g.fill();
    }
  }

  const spots = labelSpots(zone, 90);
  let since = Infinity;
  return {
    draw(p, wardens, dt, marks = []) {
      since += dt;
      if (since < MIN_INTERVAL) return;
      since = 0;
      const W = canvas.width;
      const R = W / 2;
      const s = R / RANGE;
      ctx.save();
      ctx.clearRect(0, 0, W, W);
      ctx.beginPath();
      ctx.arc(R, R, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#C79466';
      ctx.fillRect(0, 0, W, W);
      ctx.translate(R, R);
      ctx.scale(s, s);
      // Heading up: rotate the world so the keke always points to the top.
      ctx.rotate(p.h - Math.PI / 2);
      ctx.drawImage(map, -(p.x - X0), -(Y1 - p.y), map.width / PPM, map.height / PPM);
      for (const w of wardens) {
        const lx = w.x - p.x;
        const ly = -(w.y - p.y);
        ctx.beginPath();
        if (w.phase === 'stop') {
          // Octagon for STOP, so the signal never relies on colour alone (A-3).
          for (let i = 0; i < 8; i++) {
            const a = Math.PI / 8 + (i * Math.PI) / 4;
            ctx.lineTo(lx + Math.cos(a) * 8, ly + Math.sin(a) * 8);
          }
          ctx.closePath();
          ctx.fillStyle = '#B83220';
        } else {
          ctx.arc(lx, ly, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#38A95B';
        }
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
      ctx.restore();

      // Screen position of a world point: heading up, so the world turns by (h - 90°).
      const rot = p.h - Math.PI / 2;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const toScreen = (x: number, y: number) => {
        const lx = x - p.x;
        const ly = -(y - p.y);
        return { sx: R + (lx * cos - ly * sin) * s, sy: R + (lx * sin + ly * cos) * s };
      };
      const cssW = canvas.getBoundingClientRect().width || W;
      const px = (LABEL_CSS_PX * W) / cssW;
      // Markers first claim their space; passengers and the drop-off stay on the rim when off the map.
      const size = (14 * W) / cssW;
      const placed: Box[] = [];
      const shown: { kind: MapMark['kind']; sx: number; sy: number }[] = [];
      for (const m of marks) {
        let { sx, sy } = toScreen(m.x, m.y);
        const dx = sx - R;
        const dy = sy - R;
        const d = Math.hypot(dx, dy);
        const edge = R - size * 0.8;
        if (d > edge) {
          if (m.kind !== 'pax' && m.kind !== 'drop' && !m.rim) continue;
          sx = R + (dx / d) * edge;
          sy = R + (dy / d) * edge;
        }
        shown.push({ kind: m.kind, sx, sy });
        placed.push({ x0: sx - size / 2, y0: sy - size / 2, x1: sx + size / 2, y1: sy + size / 2 });
      }
      // Names of the nearest roads, one label per road, along the road, inside the circle, never overlapping.
      const inside = (x0: number, y0: number, x1: number, y1: number) =>
        Math.hypot(x0 - R, y0 - R) < R - 4 && Math.hypot(x1 - R, y1 - R) < R - 4;
      const named = new Set<string>();
      const near = spots
        .map((l) => ({ l, d: Math.hypot(l.x - p.x, l.y - p.y) }))
        .filter((o) => o.d < RANGE * 0.75)
        .sort((a, b) => a.d - b.d);
      for (const { l } of near) {
        if (named.size >= MAX_LABELS) break;
        if (named.has(l.name)) continue;
        const { sx, sy } = toScreen(l.x, l.y);
        if (drawRoadLabel(ctx, shortName(l.name), sx, sy, rot - l.a, px, placed, inside)) named.add(l.name);
      }
      for (const m of shown) drawMark(ctx, m.kind, m.sx, m.sy, size);

      // The player: a keke-yellow arrow with an ink outline, always pointing up.
      ctx.save();
      ctx.translate(R, R);
      ctx.fillStyle = '#F2C230';
      ctx.strokeStyle = '#1C1812';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(9, 10);
      ctx.lineTo(0, 5);
      ctx.lineTo(-9, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // The floating N, placed on the rim where north is.
      const a = p.h - Math.PI;
      const half = canvas.getBoundingClientRect().width / 2;
      north.style.left = `${half + Math.cos(a) * (half - 11)}px`;
      north.style.top = `${half + Math.sin(a) * (half - 11)}px`;
    },
  };
}
