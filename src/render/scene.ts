import * as THREE from 'three';
import type { Npc } from '../sim/traffic';
import type { VehicleState } from '../sim/vehicle';
import type { Warden } from '../sim/wardens';
import type { Island, Kiosk, Tree } from '../world/props';
import type { RoadNetwork } from '../world/roads';
import type { SignPost } from '../world/signs';
import type { Zone, ZonePothole } from '../world/zone';
import {
  VERTEX_COLOURS,
  carGeometry,
  kekeGeometry,
  personGeometry,
  signalTexture,
  wardenModel,
  type WardenModel,
} from './models';
import { buildPotholes } from './potholes';
import { buildSignPosts } from './signs';
import { buildBuildings, buildGround, buildIslands, buildRoads, buildTrees } from './world';

const HAZE = '#E6CFA8';
const CAR_COLOURS = ['#F1F1EE', '#B9BCC0', '#6D1F2B', '#24477A', '#1B1B1B', '#B08A3E', '#E3E1DA'];
const KEKE_ROOFS = ['#1D3B2C', '#2C2C2C', '#5B2B1F'];
const DRIVER_SHIRTS = ['#3D6FB6', '#E2E2DC', '#7B3F2B', '#2E7D4F'];

export interface SceneWorld {
  kiosks: Kiosk[];
  trees: Tree[];
  islands: Island[];
  wardens: Warden[];
  npcs: Npc[];
  /** Street name plates and signposts (NAV-2, NAV-3). */
  signPosts: SignPost[];
  /** Potholes (REAL-5), already kept clear of the stops. */
  potholes: ZonePothole[];
}

export interface SceneOptions {
  /** Phones and slow devices: smaller shadow map, shorter fog, no antialiasing at high pixel density. */
  lowDetail: boolean;
  reducedMotion: boolean;
}

export interface GameScene {
  render(player: VehicleState, dt: number): void;
  resize(): void;
  /** Shakes the camera after a collision (skipped when reduced motion is on). */
  bump(impact: number): void;
  /** Draw calls and triangles in the last frame (for the performance budget). */
  readonly stats: { calls: number; triangles: number };
  /** For adding ride and notebook markers. */
  readonly three: THREE.Scene;
  readonly keke: THREE.Group;
}

const angDiff = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

export function createScene(
  canvas: HTMLCanvasElement,
  zone: Zone,
  roads: RoadNetwork,
  world: SceneWorld,
  opts: SceneOptions,
  rand: () => number,
): GameScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !opts.lowDetail,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowDetail ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HAZE);
  scene.fog = new THREE.Fog(HAZE, 55, opts.lowDetail ? 300 : 420);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.4, 700);

  scene.add(new THREE.HemisphereLight('#FFF1D8', '#8D5A3B', 1.4));
  const sun = new THREE.DirectionalLight('#FFE0AD', 2.3);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 46, bottom: -46, near: 1, far: 260 });
  const shadowSize = opts.lowDetail ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.5;
  scene.add(sun, sun.target);

  scene.add(buildGround(zone, rand));
  scene.add(...buildRoads(zone, roads));
  scene.add(...buildBuildings(zone, world.kiosks));
  scene.add(...buildTrees(world.trees));
  scene.add(...buildIslands(world.islands));
  scene.add(...buildSignPosts(world.signPosts));
  scene.add(...buildPotholes(world.potholes));

  // The player's keke, with Ayo at the handlebar.
  const keke = new THREE.Group();
  const kekeBody = new THREE.Mesh(kekeGeometry(), VERTEX_COLOURS);
  kekeBody.castShadow = true;
  const ayo = new THREE.Mesh(personGeometry('#E05A2B', { seated: true, skin: '#5A3622' }), VERTEX_COLOURS);
  ayo.position.set(0.42, 0, 0);
  keke.add(kekeBody, ayo);
  scene.add(keke);

  // Traffic: one merged mesh per vehicle.
  const npcMeshes = world.npcs.map((n) => {
    let mesh: THREE.Mesh;
    if (n.kind === 'keke') {
      mesh = new THREE.Mesh(
        kekeGeometry('#F2C230', '#1F6B45', KEKE_ROOFS[n.colour % KEKE_ROOFS.length]!),
        VERTEX_COLOURS,
      );
      const driver = new THREE.Mesh(
        personGeometry(DRIVER_SHIRTS[n.colour % DRIVER_SHIRTS.length]!, { seated: true }),
        VERTEX_COLOURS,
      );
      driver.position.set(0.42, 0, 0);
      mesh.add(driver);
    } else {
      mesh = new THREE.Mesh(carGeometry(CAR_COLOURS[n.colour % CAR_COLOURS.length]!), VERTEX_COLOURS);
    }
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  });

  const stopTex = signalTexture('stop');
  const goTex = signalTexture('go');
  const wardenModels: WardenModel[] = world.wardens.map((w, i) => {
    const m = wardenModel(i, stopTex, goTex);
    m.group.position.x = w.x;
    m.group.position.z = -w.y;
    scene.add(m.group);
    return m;
  });

  let camYaw: number | null = null;
  let shake = 0;
  let time = 0;

  const api: GameScene = {
    stats: { calls: 0, triangles: 0 },
    three: scene,
    keke,
    resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < h ? 70 : 60;
      camera.updateProjectionMatrix();
    },
    bump(impact) {
      if (!opts.reducedMotion) shake = Math.min(0.5, impact * 0.07);
    },
    render(p, dt) {
      time += dt;
      keke.position.set(p.x, 0, -p.y);
      keke.rotation.y = p.h;
      const speed = Math.abs(p.v);
      kekeBody.rotation.x = -p.steer * Math.min(1, speed / 15) * 0.13;

      sun.position.set(p.x + 40, 85, -p.y + 28);
      sun.target.position.set(p.x, 0, -p.y);

      world.npcs.forEach((n, i) => {
        const m = npcMeshes[i]!;
        m.position.set(n.x, 0, -n.y);
        m.rotation.y = n.h;
      });

      world.wardens.forEach((w, i) => {
        const m = wardenModels[i]!;
        m.group.rotation.y = Math.atan2(p.y - w.y, p.x - w.x);
        const target = w.phase === 'stop' ? Math.PI * 0.97 : -1.55 + Math.sin(time * 7) * 0.45;
        m.arm.rotation.x += (target - m.arm.rotation.x) * (w.phase === 'stop' ? 0.2 : 1);
        const tex = w.phase === 'stop' ? stopTex : goTex;
        if (m.sign.material.map !== tex) {
          m.sign.material.map = tex;
          m.sign.material.needsUpdate = true;
        }
      });

      // Camera: behind the keke, turning with it; higher and further back in portrait.
      const portrait = canvas.clientHeight > canvas.clientWidth;
      if (camYaw === null) camYaw = p.h;
      camYaw += angDiff(camYaw, p.h) * (1 - Math.exp(-(p.v < -0.5 ? 1.5 : 3.2) * dt));
      const dist = portrait ? 10.5 : 8;
      const height = portrait ? 5.6 : 4.1;
      const cx = p.x - Math.cos(camYaw) * dist;
      const cy = p.y - Math.sin(camYaw) * dist;
      const k = camera.position.lengthSq() === 0 ? 1 : 1 - Math.exp(-10 * dt);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.z += (-cy - camera.position.z) * k;
      camera.position.y += (height - camera.position.y) * k;
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        shake = Math.max(0, shake - dt * 1.6);
      }
      camera.lookAt(p.x + Math.cos(p.h) * 4, 1.3, -(p.y + Math.sin(p.h) * 4));

      renderer.render(scene, camera);
      api.stats.calls = renderer.info.render.calls;
      api.stats.triangles = renderer.info.render.triangles;
    },
  };
  api.resize();
  return api;
}
