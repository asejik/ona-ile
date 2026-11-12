import * as THREE from 'three';
import type { RoadNetwork } from '../world/roads';
import type { Zone } from '../world/zone';
import type { VehicleState } from '../sim/vehicle';

/** World (x east, y north) to Three.js (x, up, -z). */
const toScene = (x: number, y: number, h = 0) => new THREE.Vector3(x, h, -y);

const HAZE = '#E6CFA8';
const GROUND = '#C79466';
const ROAD = '#6F6C67';
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

export interface GameScene {
  render(player: VehicleState, dt: number): void;
  resize(): void;
  /** Number of draw calls in the last frame (for the performance budget). */
  readonly stats: { calls: number; triangles: number };
}

export function createScene(canvas: HTMLCanvasElement, zone: Zone, roads: RoadNetwork): GameScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2 });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HAZE);
  scene.fog = new THREE.Fog(HAZE, 55, 420);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 900);
  scene.add(new THREE.HemisphereLight('#FFF6E4', '#8a6a4a', 1.6));
  const sun = new THREE.DirectionalLight('#FFE9C2', 1.6);
  sun.position.set(120, 260, 80);
  scene.add(sun);

  const [x0, y0, x1, y1] = zone.bounds;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(x1 - x0 + 400, y1 - y0 + 400),
    new THREE.MeshLambertMaterial({ color: GROUND }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.copy(toScene((x0 + x1) / 2, (y0 + y1) / 2, 0));
  scene.add(ground);

  scene.add(buildRoads(roads, zone));
  scene.add(buildBuildings(zone));

  const keke = buildKeke();
  scene.add(keke);

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let camReady = false;

  const api: GameScene = {
    stats: { calls: 0, triangles: 0 },
    resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < h ? 70 : 60;
      camera.updateProjectionMatrix();
    },
    render(p, dt) {
      keke.position.copy(toScene(p.x, p.y, 0));
      keke.rotation.y = p.h;
      const back = 9.5;
      const target = toScene(p.x - Math.cos(p.h) * back, p.y - Math.sin(p.h) * back, 5.2);
      const look = toScene(p.x + Math.cos(p.h) * 6, p.y + Math.sin(p.h) * 6, 1.2);
      const k = camReady ? 1 - Math.exp(-4 * dt) : 1;
      camPos.lerp(target, k);
      camLook.lerp(look, k);
      camReady = true;
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      renderer.render(scene, camera);
      api.stats.calls = renderer.info.render.calls;
      api.stats.triangles = renderer.info.render.triangles;
    },
  };
  api.resize();
  return api;
}

function buildRoads(roads: RoadNetwork, zone: Zone): THREE.Mesh {
  const pos: number[] = [];
  const quad = (ax: number, ay: number, bx: number, by: number, hw: number, y: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    const nx = (-(by - ay) / len) * hw;
    const ny = ((bx - ax) / len) * hw;
    const p = [
      [ax + nx, ay + ny],
      [ax - nx, ay - ny],
      [bx - nx, by - ny],
      [bx + nx, by + ny],
    ] as const;
    for (const i of [0, 1, 2, 0, 2, 3]) pos.push(p[i]![0], y, -p[i]![1]);
  };
  for (const s of roads.segments) quad(s.ax, s.ay, s.bx, s.by, s.hw, 0.05);
  // Round joints so corners and junctions have no gaps.
  const jointW = new Float32Array(zone.nodes.length);
  for (const s of roads.segments) {
    jointW[s.a] = Math.max(jointW[s.a]!, s.hw);
    jointW[s.b] = Math.max(jointW[s.b]!, s.hw);
  }
  const SIDES = 12;
  zone.nodes.forEach(([x, y], i) => {
    const r = jointW[i]!;
    if (r <= 0) return;
    for (let k = 0; k < SIDES; k++) {
      const a0 = (k / SIDES) * Math.PI * 2;
      const a1 = ((k + 1) / SIDES) * Math.PI * 2;
      pos.push(
        x,
        0.04,
        -y,
        x + Math.cos(a1) * r,
        0.04,
        -(y + Math.sin(a1) * r),
        x + Math.cos(a0) * r,
        0.04,
        -(y + Math.sin(a0) * r),
      );
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.MeshLambertMaterial({
    color: ROAD,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  return new THREE.Mesh(g, m);
}

function buildBuildings(zone: Zone): THREE.Mesh {
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  const push = (x: number, h: number, y: number) => {
    pos.push(x, h, -y);
    col.push(c.r, c.g, c.b);
  };
  zone.buildings.forEach((b, bi) => {
    const levels = b[0]!;
    const h = levels * zone.floorH;
    const n = (b.length - 1) / 2;
    const px = (i: number) => b[1 + 2 * (i % n)]!;
    const py = (i: number) => b[2 + 2 * (i % n)]!;
    c.set(WALLS[(bi * 7 + 3) % WALLS.length]!);
    for (let i = 0; i < n; i++) {
      const ax = px(i);
      const ay = py(i);
      const bx = px(i + 1);
      const by = py(i + 1);
      push(ax, 0, ay);
      push(bx, 0, by);
      push(bx, h, by);
      push(ax, 0, ay);
      push(bx, h, by);
      push(ax, h, ay);
    }
    c.set(levels >= 3 ? ROOFS[3]! : ROOFS[(bi * 3) % ROOFS.length]!);
    const contour: THREE.Vector2[] = [];
    for (let i = 0; i < n; i++) contour.push(new THREE.Vector2(px(i), py(i)));
    for (const tri of THREE.ShapeUtils.triangulateShape(contour, [])) {
      for (const i of tri) push(contour[i]!.x, h, contour[i]!.y);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
}

/** Placeholder keke: a yellow body with a green stripe, facing +x. M5 replaces it with a model. */
function buildKeke(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.7, 1.5),
    new THREE.MeshLambertMaterial({ color: '#F2C230' }),
  );
  body.position.y = 1.15;
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.62, 0.25, 1.52),
    new THREE.MeshLambertMaterial({ color: '#1F6B45' }),
  );
  stripe.position.y = 0.75;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.15, 1.6),
    new THREE.MeshLambertMaterial({ color: '#1C1812' }),
  );
  roof.position.y = 2.05;
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.9, 1.0),
    new THREE.MeshLambertMaterial({ color: '#F2C230' }),
  );
  nose.position.set(1.45, 0.75, 0);
  g.add(body, stripe, roof, nose);
  return g;
}
