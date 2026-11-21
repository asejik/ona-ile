/**
 * Street name plates (NAV-2) and fingerpost signpost blades (NAV-3), DESIGN §6 "World signs":
 * `--sign-green` boards with a white border and white display text, on grey poles.
 *
 * Every board is a pair of quads back to back, so the text reads the right way round from both sides.
 * All boards share one canvas atlas and one mesh, and the poles are one instanced mesh: two draw calls.
 */
import * as THREE from 'three';
import { signText, type SignPost } from '../world/signs';
import type { Terrain } from '../world/terrain';

const SIGN_GREEN = '#0E5A36';
const SIGN_WHITE = '#FFFFFF';
const POLE_GREY = '#8C8C8C';

const ATLAS_W = 2048;
const ROW_H = 64;
const FONT_PX = 38;
const PAD = 18;
const TIP = 28;
const GAP = 4;

const PLATE_H = 0.55;
const BLADE_H = 0.55;
const BLADE_LOW = 2.3;
const STEP = 0.66;
/** Half a board's thickness: plates sit round the pole, so their faces clear its 0.07 m radius. */
const PLATE_HALF = 0.085;
const BLADE_HALF = 0.012;

type LabelKind = 'plate' | 'right' | 'left';

interface Slot {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  /** Width over height, for sizing the board in the world. */
  aspect: number;
}

/** Packs every label into one canvas, row by row. */
function buildAtlas(labels: { text: string; kind: LabelKind }[]): {
  texture: THREE.CanvasTexture;
  slots: Map<string, Slot>;
} {
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = `800 ${FONT_PX}px "Baloo 2", sans-serif`;
  const placed: { key: string; text: string; kind: LabelKind; x: number; y: number; w: number }[] = [];
  let x = 0;
  let y = 0;
  for (const l of labels) {
    const key = `${l.kind}:${l.text}`;
    if (placed.some((p) => p.key === key)) continue;
    const w = Math.ceil(measure.measureText(l.text).width) + PAD * 2 + (l.kind === 'plate' ? 0 : TIP);
    if (x + w > ATLAS_W) {
      x = 0;
      y += ROW_H + GAP;
    }
    placed.push({ key, text: l.text, kind: l.kind, x, y, w: Math.min(w, ATLAS_W) });
    x += w + GAP;
  }
  let h = 64;
  while (h < y + ROW_H) h *= 2;

  const c = document.createElement('canvas');
  c.width = ATLAS_W;
  c.height = h;
  const g = c.getContext('2d')!;
  g.font = `800 ${FONT_PX}px "Baloo 2", sans-serif`;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  const slots = new Map<string, Slot>();
  for (const p of placed) {
    // Board shape: a rectangle, or a pointed blade with its tip on the right or left.
    const shape = (inset: number) => {
      const x0 = p.x + inset;
      const x1 = p.x + p.w - inset;
      const y0 = p.y + inset;
      const y1 = p.y + ROW_H - inset;
      const mid = p.y + ROW_H / 2;
      g.beginPath();
      if (p.kind === 'plate') g.rect(x0, y0, x1 - x0, y1 - y0);
      else if (p.kind === 'right') {
        g.moveTo(x0, y0);
        g.lineTo(x1 - TIP, y0);
        g.lineTo(x1, mid);
        g.lineTo(x1 - TIP, y1);
        g.lineTo(x0, y1);
      } else {
        g.moveTo(x1, y0);
        g.lineTo(x0 + TIP, y0);
        g.lineTo(x0, mid);
        g.lineTo(x0 + TIP, y1);
        g.lineTo(x1, y1);
      }
      g.closePath();
    };
    g.fillStyle = SIGN_WHITE;
    shape(1);
    g.fill();
    g.fillStyle = SIGN_GREEN;
    shape(5);
    g.fill();
    g.fillStyle = SIGN_WHITE;
    const textMid = p.x + p.w / 2 + (p.kind === 'right' ? -TIP / 2 : p.kind === 'left' ? TIP / 2 : 0);
    g.fillText(p.text, textMid, p.y + ROW_H / 2 + 2);
    slots.set(p.key, {
      u0: p.x / ATLAS_W,
      u1: (p.x + p.w) / ATLAS_W,
      v1: 1 - p.y / h,
      v0: 1 - (p.y + ROW_H) / h,
      aspect: p.w / ROW_H,
    });
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, slots };
}

/** Geometry buffers for back-to-back quads. */
class Boards {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  idx: number[] = [];

  /**
   * A board centred on (cx, cy, cz), running along the horizontal unit vector (ux, uz). Face A is seen
   * from +n (where +u is to the right), face B from -n (where +u is to the left).
   */
  add(
    cx: number,
    cy: number,
    cz: number,
    ux: number,
    uz: number,
    w: number,
    h: number,
    a: Slot,
    b: Slot,
    half: number,
  ): void {
    const nx = -uz;
    const nz = ux;
    const face = (side: 1 | -1, s: Slot) => {
      const ox = nx * half * side;
      const oz = nz * half * side;
      // Left and right as the viewer on this side sees them.
      const lx = cx + ox - ux * (w / 2) * side;
      const lz = cz + oz - uz * (w / 2) * side;
      const rx = cx + ox + ux * (w / 2) * side;
      const rz = cz + oz + uz * (w / 2) * side;
      const base = this.pos.length / 3;
      this.pos.push(lx, cy - h / 2, lz, rx, cy - h / 2, rz, rx, cy + h / 2, rz, lx, cy + h / 2, lz);
      for (let i = 0; i < 4; i++) this.nor.push(nx * side, 0, nz * side);
      this.uv.push(s.u0, s.v0, s.u1, s.v0, s.u1, s.v1, s.u0, s.v1);
      this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    face(1, a);
    face(-1, b);
  }

  mesh(material: THREE.Material): THREE.Mesh {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    return new THREE.Mesh(g, material);
  }
}

/** Builds the plates, blades and poles. World (x, y) maps to Three.js (x, -z). */
export function buildSignPosts(posts: SignPost[], terrain: Terrain): THREE.Object3D[] {
  if (posts.length === 0) return [];
  const labels: { text: string; kind: LabelKind }[] = [];
  for (const p of posts) {
    for (const pl of p.plates) labels.push({ text: signText(pl.name), kind: 'plate' });
    for (const b of p.blades) {
      labels.push({ text: signText(b.to), kind: 'right' }, { text: signText(b.to), kind: 'left' });
    }
  }
  const { texture, slots } = buildAtlas(labels);
  const boards = new Boards();
  const poleTops: number[] = [];

  for (const p of posts) {
    const px = p.x;
    const pz = -p.y;
    const base = terrain.heightAt(p.x, p.y);
    let y = base + BLADE_LOW;
    // Blades low, so the tip points down the road; plates above, turned along their roads.
    for (const b of p.blades) {
      const text = signText(b.to);
      const right = slots.get(`right:${text}`)!;
      const left = slots.get(`left:${text}`)!;
      const w = BLADE_H * right.aspect;
      const ux = Math.cos(b.h);
      const uz = -Math.sin(b.h);
      boards.add(
        px + ux * (w / 2 + 0.08),
        y,
        pz + uz * (w / 2 + 0.08),
        ux,
        uz,
        w,
        BLADE_H,
        right,
        left,
        BLADE_HALF,
      );
      y += STEP;
    }
    if (p.blades.length) y += 0.08;
    for (const pl of p.plates) {
      const s = slots.get(`plate:${signText(pl.name)}`)!;
      const ux = Math.cos(pl.h);
      const uz = -Math.sin(pl.h);
      boards.add(px, y, pz, ux, uz, PLATE_H * s.aspect, PLATE_H, s, s, PLATE_HALF);
      y += STEP;
    }
    poleTops.push(y - STEP + 0.45 - base);
  }

  const signs = boards.mesh(new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.5 }));
  signs.name = 'signs';
  const poleG = new THREE.CylinderGeometry(0.07, 0.07, 1, 6);
  poleG.translate(0, 0.5, 0);
  const poles = new THREE.InstancedMesh(
    poleG,
    new THREE.MeshLambertMaterial({ color: POLE_GREY }),
    posts.length,
  );
  poles.name = 'sign-poles';
  const m = new THREE.Matrix4();
  posts.forEach((p, i) => {
    // From a little below the ground, so a pole on a slope never floats.
    m.makeScale(1, poleTops[i]! + 0.3, 1).setPosition(p.x, terrain.heightAt(p.x, p.y) - 0.3, -p.y);
    poles.setMatrixAt(i, m);
  });
  poles.instanceMatrix.needsUpdate = true;
  return [signs, poles];
}
