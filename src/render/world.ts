/**
 * Static world meshes: ground, roads, buildings, kiosks, trees and roundabout islands.
 * Ported from prototype v0.1. Everything is merged into a few large meshes to keep draw calls low.
 */
import * as THREE from 'three';
import type { Island, Kiosk, Tree } from '../world/props';
import { KIOSK_COLOURS, TREE_GREENS } from '../world/props';
import type { RoadNetwork } from '../world/roads';
import type { Zone } from '../world/zone';

type Pt = readonly [number, number];
interface Buffers {
  p: number[];
  c: number[];
}

const col = (hex: string) => new THREE.Color(hex);

function meshFrom(t: Buffers, material: THREE.Material, upNormals = false): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(t.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(t.c, 3));
  if (upNormals) {
    const n = new Float32Array(t.p.length);
    for (let i = 1; i < n.length; i += 3) n[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  } else g.computeVertexNormals();
  g.computeBoundingSphere();
  return new THREE.Mesh(g, material);
}

/** Red laterite earth with dusty grass patches, as a repeating canvas texture. */
export function buildGround(zone: Zone, rand: () => number): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#B57A51';
  g.fillRect(0, 0, 256, 256);
  const tones = ['#A96B45', '#C48C60', '#9C6440', '#BB8657', '#8C7D47', '#7D8A4C', '#C99A6A'];
  for (let i = 0; i < 1600; i++) {
    g.globalAlpha = 0.18 + rand() * 0.25;
    g.fillStyle = tones[Math.floor(rand() * tones.length)]!;
    g.beginPath();
    g.arc(rand() * 256, rand() * 256, 1 + rand() * 7, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const [x0, y0, x1, y1] = zone.bounds;
  const w = x1 - x0 + 500;
  const h = y1 - y0 + 500;
  tex.repeat.set(w / 34, h / 34);
  tex.anisotropy = 4;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((x0 + x1) / 2, 0, -(y0 + y1) / 2);
  ground.receiveShadow = true;
  return ground;
}

/** Road ribbons in layers: dusty shoulders, minor and major asphalt, white centre dashes on major roads. */
export function buildRoads(zone: Zone, roads: RoadNetwork): THREE.Mesh[] {
  const layers = {
    sh: { p: [], c: [] },
    mn: { p: [], c: [] },
    mj: { p: [], c: [] },
    da: { p: [], c: [] },
  } as Record<'sh' | 'mn' | 'mj' | 'da', Buffers>;
  const cMaj = col('#4B4845');
  const cMin = col('#6A625A');
  const cSh = col('#A87D58');
  const cDa = col('#EFE7D3');
  const tri = (t: Buffers, c: THREE.Color, a: Pt, b: Pt, d: Pt, y: number) => {
    t.p.push(a[0], y, -a[1], b[0], y, -b[1], d[0], y, -d[1]);
    for (let k = 0; k < 3; k++) t.c.push(c.r, c.g, c.b);
  };
  const ribbon = (t: Buffers, pts: Pt[], hw: number, y: number, c: THREE.Color) => {
    const n = pts.length;
    const L: Pt[] = [];
    const R: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i]!;
      let nx = 0;
      let ny = 0;
      if (i > 0) {
        const q = pts[i - 1]!;
        const l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
        nx += -(p[1] - q[1]) / l;
        ny += (p[0] - q[0]) / l;
      }
      if (i < n - 1) {
        const q = pts[i + 1]!;
        const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        nx += -(q[1] - p[1]) / l;
        ny += (q[0] - p[0]) / l;
      }
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      let m = 1;
      if (i > 0 && i < n - 1) {
        const q = pts[i + 1]!;
        const ll = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        m = 1 / Math.max(0.55, (-(q[1] - p[1]) / ll) * nx + ((q[0] - p[0]) / ll) * ny);
      }
      L.push([p[0] + nx * hw * m, p[1] + ny * hw * m]);
      R.push([p[0] - nx * hw * m, p[1] - ny * hw * m]);
    }
    for (let i = 0; i < n - 1; i++) {
      tri(t, c, L[i]!, R[i]!, R[i + 1]!, y);
      tri(t, c, L[i]!, R[i + 1]!, L[i + 1]!, y);
    }
  };
  const disc = (t: Buffers, x: number, y: number, r: number, h: number, c: THREE.Color) => {
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = ((i + 1) / 16) * Math.PI * 2;
      tri(
        t,
        c,
        [x, y],
        [x + Math.cos(a0) * r, y + Math.sin(a0) * r],
        [x + Math.cos(a1) * r, y + Math.sin(a1) * r],
        h,
      );
    }
  };
  const dashes = (t: Buffers, pts: Pt[], y: number) => {
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]!;
      const [bx, by] = pts[i + 1]!;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy);
      if (len < 0.2) continue;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy * 0.12;
      const ny = ux * 0.12;
      for (let s = (7 - (acc % 7)) % 7; s + 3 <= len; s += 7) {
        const a: Pt = [ax + ux * s + nx, ay + uy * s + ny];
        const b: Pt = [ax + ux * s - nx, ay + uy * s - ny];
        const c2: Pt = [ax + ux * (s + 3) - nx, ay + uy * (s + 3) - ny];
        const d: Pt = [ax + ux * (s + 3) + nx, ay + uy * (s + 3) + ny];
        tri(t, cDa, a, b, c2, y);
        tri(t, cDa, a, c2, d, y);
      }
      acc += len;
    }
  };
  for (const r of zone.roads) {
    const pts = r.p.map((i) => zone.nodes[i]!);
    const hw = r.w / 2;
    const major = r.w >= 10;
    ribbon(layers.sh, pts, hw + 1.3, 0.012, cSh);
    ribbon(major ? layers.mj : layers.mn, pts, hw, major ? 0.036 : 0.03, major ? cMaj : cMin);
    if (major && !r.rb) dashes(layers.da, pts, 0.05);
  }
  zone.nodes.forEach(([x, y], i) => {
    const w = roads.nodeWidth[i]!;
    if (w <= 0 || roads.adjacency[i]!.length === 2) return;
    const major = w >= 10;
    disc(layers.sh, x, y, w / 2 + 1.3, 0.012, cSh);
    disc(major ? layers.mj : layers.mn, x, y, w / 2, major ? 0.036 : 0.03, major ? cMaj : cMin);
  });
  return (
    [
      ['sh', -1],
      ['mn', -2],
      ['mj', -3],
      ['da', -4],
    ] as const
  ).map(([k, off]) => {
    const m = meshFrom(
      layers[k],
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: off,
        polygonOffsetUnits: off,
      }),
      true,
    );
    m.receiveShadow = true;
    return m;
  });
}

const WALLS = [
  '#EADCC0',
  '#DCBF92',
  '#CF9A5C',
  '#B9C7A3',
  '#A9C6D6',
  '#F0EBE0',
  '#E3B3A1',
  '#C7835C',
  '#D8D0B0',
  '#BFA98A',
  '#E9D39B',
];
const ROOFS = ['#9AA0A4', '#8A5236', '#6E7A82', '#B7AEA0', '#7F8B8F', '#A0643F'];

/** OSM footprints extruded by storey count, with window bands, plus kiosks; grouped into 170 m chunks. */
export function buildBuildings(zone: Zone, kiosks: Kiosk[]): THREE.Mesh[] {
  const walls = WALLS.map(col);
  const roofs = ROOFS.map(col);
  const win = col('#3B3F46');
  const tc = new THREE.Color();
  const CH = 170;
  const chunks = new Map<string, Buffers>();
  const chunk = (x: number, y: number) => {
    const k = `${Math.floor(x / CH)},${Math.floor(y / CH)}`;
    let t = chunks.get(k);
    if (!t) chunks.set(k, (t = { p: [], c: [] }));
    return t;
  };
  const quad = (
    t: Buffers,
    c: THREE.Color,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    y0: number,
    y1: number,
  ) => {
    t.p.push(ax, y0, -ay, bx, y0, -by, bx, y1, -by, ax, y0, -ay, bx, y1, -by, ax, y1, -ay);
    for (let k = 0; k < 6; k++) t.c.push(c.r, c.g, c.b);
  };
  const extrude = (
    t: Buffers,
    p: number[],
    h: number,
    wall: THREE.Color,
    roof: THREE.Color,
    bandsFor: (edgeLen: number) => [number, number, number][],
  ) => {
    const n = p.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = p[2 * i]!;
      const ay = p[2 * i + 1]!;
      const bx = p[2 * j]!;
      const by = p[2 * j + 1]!;
      for (const [y0, y1, shade] of bandsFor(Math.hypot(bx - ax, by - ay))) {
        if (y1 <= y0) continue;
        if (shade < 0) tc.copy(wall).lerp(win, 0.6);
        else tc.copy(wall).multiplyScalar(shade);
        quad(t, tc, ax, ay, bx, by, y0, y1);
      }
    }
    const contour: THREE.Vector2[] = [];
    for (let i = 0; i < n; i++) contour.push(new THREE.Vector2(p[2 * i]!, p[2 * i + 1]!));
    let tris: number[][];
    try {
      tris = THREE.ShapeUtils.triangulateShape(contour, []);
    } catch {
      // A self-intersecting footprint: keep the walls, skip the roof.
      tris = [];
    }
    for (const tr of tris) {
      const A = contour[tr[0]!]!;
      let B = contour[tr[1]!]!;
      let C = contour[tr[2]!]!;
      if ((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x) < 0) [B, C] = [C, B];
      t.p.push(A.x, h, -A.y, B.x, h, -B.y, C.x, h, -C.y);
      for (let q = 0; q < 3; q++) t.c.push(roof.r, roof.g, roof.b);
    }
  };

  zone.buildings.forEach((b, bi) => {
    const levels = b[0]!;
    const p = b.slice(1);
    const h = levels * zone.floorH + 0.45 + (bi % 5) * 0.1;
    const wall = walls[(bi * 7 + 3) % walls.length]!;
    const roof = levels >= 3 ? roofs[3]! : roofs[(bi * 3) % roofs.length]!;
    extrude(chunk(p[0]!, p[1]!), p, h, wall, roof, (edgeLen) => {
      const bands: [number, number, number][] = [[0, 0.6, 0.72]];
      for (let f = 0; f < levels; f++) {
        const fy = f * zone.floorH;
        if (edgeLen > 2.6)
          bands.push(
            [Math.max(0.6, fy), fy + 1.0, 1],
            [fy + 1.0, fy + 2.0, -1],
            [fy + 2.0, fy + zone.floorH, 1],
          );
        else bands.push([Math.max(0.6, fy), fy + zone.floorH, 1]);
      }
      bands.push([levels * zone.floorH, h, 0.9]);
      return bands;
    });
  });
  const roofGrey = col('#7D8288');
  for (const k of kiosks) {
    extrude(chunk(k.poly[0]!, k.poly[1]!), k.poly, 2.3, col(KIOSK_COLOURS[k.colour]!), roofGrey, () => [
      [0, 0.3, 0.72],
      [0.3, 2.3, 1],
    ]);
  }

  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  return [...chunks.values()].map((t) => {
    const m = meshFrom(t, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  });
}

/** Neem and mango shapes: two instanced meshes (trunks, crowns) for all trees. */
export function buildTrees(trees: Tree[]): THREE.Object3D[] {
  const trunkG = new THREE.CylinderGeometry(0.18, 0.26, 2.4, 6);
  trunkG.translate(0, 1.2, 0);
  const crownG = new THREE.IcosahedronGeometry(2.1, 0);
  crownG.translate(0, 3.4, 0);
  const trunks = new THREE.InstancedMesh(
    trunkG,
    new THREE.MeshLambertMaterial({ color: '#6B4A33' }),
    Math.max(1, trees.length),
  );
  const crowns = new THREE.InstancedMesh(
    crownG,
    new THREE.MeshLambertMaterial({ color: '#FFFFFF' }),
    Math.max(1, trees.length),
  );
  const greens = TREE_GREENS.map(col);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  trees.forEach((t, i) => {
    q.setFromAxisAngle(up, t.rotation);
    s.set(t.scale, t.scale * t.stretch, t.scale);
    p.set(t.x, 0, -t.y);
    m.compose(p, q, s);
    trunks.setMatrixAt(i, m);
    crowns.setMatrixAt(i, m);
    crowns.setColorAt(i, greens[t.green]!);
  });
  trunks.count = crowns.count = trees.length;
  trunks.castShadow = crowns.castShadow = true;
  return [trunks, crowns];
}

/** Grass islands with a pale kerb in the middle of each roundabout. */
export function buildIslands(islands: Island[]): THREE.Object3D[] {
  const kerbMat = new THREE.MeshLambertMaterial({ color: '#DCD6C8' });
  const grassMat = new THREE.MeshLambertMaterial({ color: '#6F8F3A' });
  return islands.flatMap((r) => {
    const kerb = new THREE.Mesh(
      new THREE.CylinderGeometry(r.island + 0.35, r.island + 0.35, 0.3, 28),
      kerbMat,
    );
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(r.island, r.island, 0.42, 28), grassMat);
    kerb.position.set(r.x, 0.15, -r.y);
    grass.position.set(r.x, 0.21, -r.y);
    grass.receiveShadow = true;
    return [kerb, grass];
  });
}
