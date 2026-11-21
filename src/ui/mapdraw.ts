/**
 * Shared map drawing for the minimap and the full map (NAV-5): road-name label spots, labels that stay
 * readable at any rotation, and markers. Colours come from the DESIGN tokens on :root.
 */
import type { Zone } from '../world/zone';

/** A spot along a named road where its name can be written, with the road's direction there. */
export interface LabelSpot {
  name: string;
  x: number;
  y: number;
  /** Road direction in world radians (0 = east, counter-clockwise). */
  a: number;
}

export type MarkKind = 'you' | 'pax' | 'drop' | 'notebook' | 'place';

export interface MapMark {
  kind: MarkKind;
  x: number;
  y: number;
  label?: string;
}

/** Spots every `spacing` metres along every named road. */
export function labelSpots(zone: Zone, spacing: number): LabelSpot[] {
  const out: LabelSpot[] = [];
  for (const r of zone.roads) {
    if (!r.n || r.rb) continue;
    let next = spacing / 2;
    let run = 0;
    for (let k = 1; k < r.p.length; k++) {
      const [x0, y0] = zone.nodes[r.p[k - 1]!]!;
      const [x1, y1] = zone.nodes[r.p[k]!]!;
      const len = Math.hypot(x1 - x0, y1 - y0);
      while (len > 0 && run + len >= next) {
        const t = (next - run) / len;
        out.push({
          name: r.n,
          x: x0 + (x1 - x0) * t,
          y: y0 + (y1 - y0) * t,
          a: Math.atan2(y1 - y0, x1 - x0),
        });
        next += spacing;
      }
      run += len;
    }
  }
  return out;
}

/** Turns a screen angle so text never reads upside down. */
export function readableAngle(a: number): number {
  let r = Math.atan2(Math.sin(a), Math.cos(a));
  if (r > Math.PI / 2) r -= Math.PI;
  else if (r < -Math.PI / 2) r += Math.PI;
  return r;
}

/** The DESIGN token's value, for drawing on a canvas. */
export function token(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * Writes a road name centred on (sx, sy) along screen angle `a`, with a paper halo, unless it would
 * overlap a label already placed. Returns whether it was drawn.
 */
export function drawRoadLabel(
  g: CanvasRenderingContext2D,
  text: string,
  sx: number,
  sy: number,
  a: number,
  px: number,
  placed: Box[],
  /** Extra test the two ends of the text must pass (for example, staying inside the round minimap). */
  fits?: (x0: number, y0: number, x1: number, y1: number) => boolean,
): boolean {
  g.font = `800 ${px}px Nunito, sans-serif`;
  const w = g.measureText(text).width;
  const r = readableAngle(a);
  const hw = (Math.abs(Math.cos(r)) * w + Math.abs(Math.sin(r)) * px) / 2 + 2;
  const hh = (Math.abs(Math.sin(r)) * w + Math.abs(Math.cos(r)) * px) / 2 + 2;
  const box = { x0: sx - hw, y0: sy - hh, x1: sx + hw, y1: sy + hh };
  const ex = (Math.cos(r) * w) / 2;
  const ey = (Math.sin(r) * w) / 2;
  if (placed.some((b) => overlaps(b, box)) || (fits && !fits(sx - ex, sy - ey, sx + ex, sy + ey)))
    return false;
  placed.push(box);
  g.save();
  g.translate(sx, sy);
  g.rotate(r);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, px * 0.3);
  g.strokeStyle = token('--paper', '#FFF6E4');
  g.strokeText(text, 0, 0);
  g.fillStyle = token('--ink', '#1C1812');
  g.fillText(text, 0, 0);
  g.restore();
  return true;
}

/**
 * Draws a marker at (sx, sy), `size` pixels across. Every marker has an ink ring (DESIGN §6) and a
 * distinct shape, so none relies on colour alone.
 */
export function drawMark(
  g: CanvasRenderingContext2D,
  kind: MarkKind,
  sx: number,
  sy: number,
  size: number,
  rot = 0,
): void {
  const ink = token('--ink', '#1C1812');
  const r = size / 2;
  g.save();
  g.translate(sx, sy);
  g.lineWidth = Math.max(2, size * 0.14);
  g.strokeStyle = ink;
  g.lineJoin = 'round';
  g.beginPath();
  if (kind === 'you') {
    g.rotate(rot);
    g.moveTo(0, -r * 1.2);
    g.lineTo(r * 0.85, r * 0.9);
    g.lineTo(0, r * 0.45);
    g.lineTo(-r * 0.85, r * 0.9);
    g.closePath();
    g.fillStyle = token('--keke', '#F2C230');
  } else if (kind === 'pax') {
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fillStyle = token('--keke', '#F2C230');
  } else if (kind === 'drop') {
    // A map pin.
    g.arc(0, -r * 0.35, r * 0.75, Math.PI * 0.85, Math.PI * 2.15);
    g.lineTo(0, r);
    g.closePath();
    g.fillStyle = token('--route', '#36D07A');
  } else if (kind === 'notebook') {
    g.rect(-r * 0.8, -r * 0.65, r * 1.6, r * 1.3);
    g.fillStyle = token('--paper', '#FFF6E4');
  } else {
    g.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    g.fillStyle = token('--paper', '#FFF6E4');
  }
  g.fill();
  g.stroke();
  if (kind === 'pax') {
    g.fillStyle = ink;
    g.font = `800 ${Math.round(size * 0.7)}px "Baloo 2", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('₦', 0, size * 0.04);
  } else if (kind === 'notebook') {
    g.beginPath();
    g.moveTo(0, -r * 0.65);
    g.lineTo(0, r * 0.65);
    g.stroke();
  }
  g.restore();
}
