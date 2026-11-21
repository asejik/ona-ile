/**
 * The full map (NAV-5, DESIGN §6): the whole zone on `--map-ground`, north up, with every road name,
 * the places passengers go, Baba's notebook places and the live markers. Drag to move, pinch or wheel
 * to zoom, buttons for both, Esc or the close button to leave. It redraws only when something changes.
 */
import type { Island } from '../world/props';
import type { Zone } from '../world/zone';
import { drawMark, drawRoadLabel, labelSpots, token, type Box, type MapMark } from './mapdraw';

/** CSS pixels per game metre. */
const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
/** Metres across the short side of the screen when the map opens. */
const OPEN_SPAN = 520;
/** The same road's name is repeated no closer than this, in CSS pixels. */
const REPEAT_PX = 280;

export interface FullMap {
  readonly open: boolean;
  show(onClose?: () => void): void;
  close(): void;
}

export interface FullMapDeps {
  zone: Zone;
  islands: Island[];
  player(): { x: number; y: number; h: number };
  marks(): MapMark[];
}

export function createFullMap(root: HTMLElement, d: FullMapDeps): FullMap {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const g = canvas.getContext('2d')!;
  const { zone, islands } = d;
  const spots = labelSpots(zone, 60);
  const bbox = zone.buildings.map((b) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 1; i < b.length; i += 2) {
      x0 = Math.min(x0, b[i]!);
      x1 = Math.max(x1, b[i]!);
      y0 = Math.min(y0, b[i + 1]!);
      y1 = Math.max(y1, b[i + 1]!);
    }
    return [x0, y0, x1, y1] as const;
  });
  const [bx0, by0, bx1, by1] = zone.bounds;

  let cx = 0;
  let cy = 0;
  let scale = 1;
  let dpr = 1;
  let queued = false;
  let onClose: (() => void) | undefined;
  let restoreFocus: Element | null = null;

  const clampView = () => {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    cx = Math.min(bx1, Math.max(bx0, cx));
    cy = Math.min(by1, Math.max(by0, cy));
  };

  const draw = () => {
    queued = false;
    if (root.hidden) return;
    const W = canvas.width;
    const H = canvas.height;
    const k = scale * dpr;
    const X = (x: number) => W / 2 + (x - cx) * k;
    const Y = (y: number) => H / 2 - (y - cy) * k;
    const vx0 = cx - W / 2 / k;
    const vx1 = cx + W / 2 / k;
    const vy0 = cy - H / 2 / k;
    const vy1 = cy + H / 2 / k;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = token('--map-ground', '#C79466');
    g.fillRect(0, 0, W, H);

    g.fillStyle = '#E9D6B4';
    zone.buildings.forEach((b, i) => {
      const [x0, y0, x1, y1] = bbox[i]!;
      if (x1 < vx0 || x0 > vx1 || y1 < vy0 || y0 > vy1) return;
      g.beginPath();
      for (let j = 1; j < b.length; j += 2) {
        if (j === 1) g.moveTo(X(b[j]!), Y(b[j + 1]!));
        else g.lineTo(X(b[j]!), Y(b[j + 1]!));
      }
      g.closePath();
      g.fill();
    });

    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const r of zone.roads) {
        g.strokeStyle = pass ? (r.w >= 10 ? '#3F3B37' : '#5D564F') : '#2A2622';
        g.lineWidth = Math.max(pass ? 1.5 * dpr : 2.5 * dpr, (r.w + (pass ? 0 : 2.4)) * k);
        g.beginPath();
        r.p.forEach((n, j) => {
          const [x, y] = zone.nodes[n]!;
          if (j === 0) g.moveTo(X(x), Y(y));
          else g.lineTo(X(x), Y(y));
        });
        g.stroke();
      }
    }
    g.fillStyle = '#6F8F3A';
    for (const r of islands) {
      g.beginPath();
      g.arc(X(r.x), Y(r.y), Math.max(2 * dpr, r.island * k), 0, Math.PI * 2);
      g.fill();
    }

    // Markers first claim their space, so road names flow around them.
    const placed: Box[] = [];
    const marks = d.marks();
    const size = 18 * dpr;
    for (const m of marks) {
      const sx = X(m.x);
      const sy = Y(m.y);
      placed.push({ x0: sx - size / 2, y0: sy - size / 2, x1: sx + size / 2, y1: sy + size / 2 });
    }

    // Road names: as many as fit, each road repeated no closer than REPEAT_PX.
    const px = 13 * dpr;
    const shown = new Map<string, { x: number; y: number }[]>();
    for (const l of spots) {
      if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
      const sx = X(l.x);
      const sy = Y(l.y);
      const prev = shown.get(l.name) ?? [];
      if (prev.some((q) => Math.hypot(q.x - sx, q.y - sy) < REPEAT_PX * dpr)) continue;
      if (drawRoadLabel(g, l.name, sx, sy, -l.a, px, placed)) shown.set(l.name, [...prev, { x: sx, y: sy }]);
    }

    // Places and roundabouts, written beside their marker when there is room.
    const placeLabel = (text: string, sx: number, sy: number) => {
      g.font = `800 ${12 * dpr}px Nunito, sans-serif`;
      const w = g.measureText(text).width;
      const box = {
        x0: sx + size * 0.6,
        y0: sy - 8 * dpr,
        x1: sx + size * 0.6 + w + 4 * dpr,
        y1: sy + 8 * dpr,
      };
      if (placed.some((b) => b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1)) return;
      placed.push(box);
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.lineJoin = 'round';
      g.lineWidth = 3 * dpr;
      g.strokeStyle = token('--paper', '#FFF6E4');
      g.strokeText(text, box.x0 + 2 * dpr, sy);
      g.fillStyle = token('--ink', '#1C1812');
      g.fillText(text, box.x0 + 2 * dpr, sy);
    };
    for (const rb of zone.roundabouts) {
      if (rb.name !== 'Roundabout' && scale > 0.8) placeLabel(rb.name, X(rb.x), Y(rb.y));
    }
    for (const m of marks) {
      if (m.kind === 'you') continue;
      drawMark(g, m.kind, X(m.x), Y(m.y), m.kind === 'place' ? size * 0.8 : size);
      if (m.label) placeLabel(m.label, X(m.x), Y(m.y));
    }
    const p = d.player();
    drawMark(g, 'you', X(p.x), Y(p.y), size * 1.15, Math.PI / 2 - p.h);
  };

  const redraw = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  };

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    redraw();
  };
  window.addEventListener('resize', () => {
    if (!root.hidden) resize();
  });

  /** Zooms by `f` keeping the world point under (sx, sy) CSS pixels where it is. */
  const zoomAt = (f: number, sx: number, sy: number) => {
    const r = canvas.getBoundingClientRect();
    const ox = sx - r.width / 2;
    const oy = sy - r.height / 2;
    const wx = cx + ox / scale;
    const wy = cy - oy / scale;
    scale *= f;
    clampView();
    cx = wx - ox / scale;
    cy = wy + oy / scale;
    clampView();
    redraw();
  };

  // Drag with one finger or the mouse, pinch with two.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, now);
    if (pointers.size === 1) {
      cx -= (now.x - prev.x) / scale;
      cy += (now.y - prev.y) / scale;
      clampView();
      redraw();
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const r = canvas.getBoundingClientRect();
      if (pinch > 0) zoomAt(dist / pinch, (a!.x + b!.x) / 2 - r.left, (a!.y + b!.y) / 2 - r.top);
      pinch = dist;
    }
  });
  const up = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinch = 0;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener(
    'wheel',
    (e) => {
      const r = canvas.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
      e.preventDefault();
    },
    { passive: false },
  );

  const centre = () => {
    const p = d.player();
    cx = p.x;
    cy = p.y;
    clampView();
    redraw();
  };
  const zoomButton = (f: number) => {
    const r = canvas.getBoundingClientRect();
    zoomAt(f, r.width / 2, r.height / 2);
  };
  root.querySelector('[data-map="in"]')?.addEventListener('click', () => zoomButton(1.4));
  root.querySelector('[data-map="out"]')?.addEventListener('click', () => zoomButton(1 / 1.4));
  root.querySelector('[data-map="centre"]')?.addEventListener('click', centre);

  const map: FullMap = {
    get open() {
      return !root.hidden;
    },
    show(cb) {
      onClose = cb;
      restoreFocus = document.activeElement;
      root.hidden = false;
      const r = canvas.getBoundingClientRect();
      scale = Math.min(r.width, r.height) / OPEN_SPAN;
      resize();
      centre();
      root.querySelector<HTMLElement>('[data-map="close"]')?.focus({ preventScroll: true });
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      pointers.clear();
      if (restoreFocus instanceof HTMLElement) restoreFocus.focus({ preventScroll: true });
      onClose?.();
    },
  };
  root.querySelector('[data-map="close"]')?.addEventListener('click', () => map.close());

  root.addEventListener('keydown', (e) => {
    const step = 60 / scale;
    if (e.key === 'Escape') map.close();
    else if (e.key === '+' || e.key === '=') zoomButton(1.4);
    else if (e.key === '-') zoomButton(1 / 1.4);
    else if (e.key === 'ArrowLeft') cx -= step;
    else if (e.key === 'ArrowRight') cx += step;
    else if (e.key === 'ArrowUp') cy += step;
    else if (e.key === 'ArrowDown') cy -= step;
    else if (e.key === 'Tab') {
      // Keep focus inside the map.
      const items = [...root.querySelectorAll<HTMLElement>('button, a')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
      return;
    } else return;
    clampView();
    redraw();
    e.stopPropagation();
    e.preventDefault();
  });

  return map;
}
