/**
 * Low-poly models built from boxes and cylinders, merged into one mesh each (one draw call per model).
 * Ported from prototype v0.1. Each model faces +x (east) at rotation 0, like the vehicle physics.
 * The PRD's hand-made glTF models replace these in M5.
 */
import * as THREE from 'three';

type Part = [
  geometry: THREE.BufferGeometry,
  colour: string,
  x: number,
  y: number,
  z: number,
  rx?: number,
  ry?: number,
  rz?: number,
];

const BOX = (l: number, h: number, w: number) => new THREE.BoxGeometry(l, h, w);

/** Merges coloured parts into one geometry with per-vertex colours. */
export function mergeParts(list: Part[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  const one = new THREE.Vector3(1, 1, 1);
  for (const [g0, hex, x, y, z, rx = 0, ry = 0, rz = 0] of list) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), one);
    g.applyMatrix4(m);
    const P = g.getAttribute('position').array;
    const N = g.getAttribute('normal').array;
    c.set(hex);
    for (let i = 0; i < P.length; i += 3) {
      pos.push(P[i]!, P[i + 1]!, P[i + 2]!);
      nor.push(N[i]!, N[i + 1]!, N[i + 2]!);
      col.push(c.r, c.g, c.b);
    }
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

export const VERTEX_COLOURS = new THREE.MeshLambertMaterial({ vertexColors: true });

/** The keke: yellow body, green stripe, dark canopy, three wheels. */
export function kekeGeometry(body = '#F2C230', stripe = '#1F6B45', roof = '#1D3B2C'): THREE.BufferGeometry {
  const wheel = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
  const post = BOX(0.06, 1.05, 0.06);
  return mergeParts([
    [BOX(2.0, 0.55, 1.25), body, -0.15, 0.62, 0],
    [BOX(2.02, 0.1, 1.27), stripe, -0.15, 0.8, 0],
    [BOX(0.7, 0.9, 0.95), body, 1.0, 0.77, 0],
    [BOX(0.08, 0.66, 1.0), '#A7CFDD', 1.32, 1.5, 0],
    [BOX(2.35, 0.09, 1.38), roof, -0.05, 1.9, 0],
    [post, '#222222', 1.0, 1.36, 0.6],
    [post, '#222222', 1.0, 1.36, -0.6],
    [post, '#222222', -1.12, 1.36, 0.62],
    [post, '#222222', -1.12, 1.36, -0.62],
    [BOX(0.42, 0.62, 1.24), roof, -1.02, 1.18, 0],
    [BOX(0.5, 0.14, 1.12), '#5A3A2A', -0.58, 0.94, 0],
    [BOX(0.32, 0.12, 0.6), '#5A3A2A', 0.42, 0.98, 0],
    [wheel, '#1D1D1D', 1.1, 0.3, 0, Math.PI / 2],
    [wheel, '#1D1D1D', -0.85, 0.3, 0.66, Math.PI / 2],
    [wheel, '#1D1D1D', -0.85, 0.3, -0.66, Math.PI / 2],
    [BOX(0.06, 0.2, 0.32), '#FFF3B8', 1.37, 0.96, 0],
  ]);
}

export function carGeometry(body: string): THREE.BufferGeometry {
  const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12);
  return mergeParts([
    [BOX(4.1, 0.62, 1.76), body, 0, 0.62, 0],
    [BOX(2.1, 0.58, 1.6), '#2A3138', -0.25, 1.2, 0],
    [BOX(2.0, 0.06, 1.5), body, -0.25, 1.52, 0],
    [wheel, '#1B1B1B', 1.3, 0.34, 0.84, Math.PI / 2],
    [wheel, '#1B1B1B', 1.3, 0.34, -0.84, Math.PI / 2],
    [wheel, '#1B1B1B', -1.3, 0.34, 0.84, Math.PI / 2],
    [wheel, '#1B1B1B', -1.3, 0.34, -0.84, Math.PI / 2],
    [BOX(0.05, 0.16, 0.4), '#FFF3B8', 2.06, 0.72, 0.6],
    [BOX(0.05, 0.16, 0.4), '#FFF3B8', 2.06, 0.72, -0.6],
    [BOX(0.05, 0.14, 0.36), '#B3261E', -2.06, 0.72, 0.62],
    [BOX(0.05, 0.14, 0.36), '#B3261E', -2.06, 0.72, -0.62],
  ]);
}

export interface PersonStyle {
  seated?: boolean;
  skin?: string;
  pants?: string;
  cap?: string;
  /** Leave out the right arm, so it can be animated separately (wardens). */
  noRightArm?: boolean;
}

/** A simple standing or seated figure. Expressive characters arrive with the art pipeline (M5). */
export function personGeometry(cloth: string, o: PersonStyle = {}): THREE.BufferGeometry {
  const yb = o.seated ? -0.18 : 0;
  const parts: Part[] = [];
  if (!o.seated) parts.push([BOX(0.24, 0.8, 0.36), o.pants ?? '#2B2B33', 0, 0.4, 0]);
  parts.push([new THREE.CylinderGeometry(0.2, 0.25, 0.72, 8), cloth, 0, yb + 1.16, 0]);
  parts.push([BOX(0.12, 0.62, 0.12), cloth, 0, yb + 1.13, -0.31]);
  if (!o.noRightArm) parts.push([BOX(0.12, 0.62, 0.12), cloth, 0, yb + 1.13, 0.31]);
  parts.push([new THREE.SphereGeometry(0.17, 10, 8), o.skin ?? '#6B4128', 0.02, yb + 1.68, 0]);
  if (o.cap) parts.push([new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), o.cap, 0, yb + 1.82, 0]);
  return mergeParts(parts);
}

/** STOP (white-bordered octagon) and GO (circle with an arrow) signs, as DESIGN.md §6 asks. */
export function signalTexture(kind: 'stop' | 'go'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const shape = (r: number) => {
    g.beginPath();
    if (kind === 'stop') {
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 8 + (i * Math.PI) / 4;
        g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
      }
      g.closePath();
    } else g.arc(64, 64, r, 0, Math.PI * 2);
  };
  g.fillStyle = '#FFFFFF';
  shape(62);
  g.fill();
  g.fillStyle = kind === 'stop' ? '#B83220' : '#38A95B';
  shape(55);
  g.fill();
  g.fillStyle = kind === 'stop' ? '#FFFFFF' : '#1C1812';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 ${kind === 'stop' ? 34 : 38}px "Baloo 2", sans-serif`;
  g.fillText(kind === 'stop' ? 'STOP' : 'GO', 64, kind === 'stop' ? 68 : 58);
  if (kind === 'go') {
    g.beginPath();
    g.moveTo(44, 86);
    g.lineTo(78, 86);
    g.lineTo(78, 78);
    g.lineTo(90, 90);
    g.lineTo(78, 102);
    g.lineTo(78, 94);
    g.lineTo(44, 94);
    g.closePath();
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface WardenModel {
  group: THREE.Group;
  arm: THREE.Group;
  sign: THREE.Sprite;
}

const UMBRELLAS = ['#1F6B45', '#C0392B', '#2F5D8A'];

/** A warden on a podium under an umbrella, with a raisable arm and a STOP/GO sign above. */
export function wardenModel(index: number, stop: THREE.Texture, go: THREE.Texture): WardenModel {
  const group = new THREE.Group();
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.7, 0.4, 14),
    new THREE.MeshLambertMaterial({ color: '#E9E4D8' }),
  );
  podium.position.y = 0.2;
  const body = new THREE.Mesh(
    personGeometry('#F4F4F0', { pants: '#1F2A44', cap: '#151515', noRightArm: true }),
    VERTEX_COLOURS,
  );
  body.position.y = 0.4;
  body.castShadow = true;
  const arm = new THREE.Group();
  arm.position.set(0, 1.82, 0.31);
  const sleeve = new THREE.Mesh(BOX(0.12, 0.64, 0.12), new THREE.MeshLambertMaterial({ color: '#F4F4F0' }));
  sleeve.position.y = -0.3;
  arm.add(sleeve);
  const umbrella = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 0.6, 10),
    new THREE.MeshLambertMaterial({ color: UMBRELLAS[index % UMBRELLAS.length]! }),
  );
  umbrella.position.y = 3.3;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6),
    new THREE.MeshLambertMaterial({ color: '#333333' }),
  );
  pole.position.set(-0.45, 2.1, 0);
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: go, fog: false }));
  sign.scale.set(2.4, 2.4, 1);
  sign.position.y = 4.9;
  sign.userData.textures = { stop, go };
  group.add(podium, body, arm, umbrella, pole, sign);
  group.position.y = 0.42;
  return { group, arm, sign };
}
