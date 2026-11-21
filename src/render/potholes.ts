/**
 * Potholes (REAL-5, DESIGN §6): a dark patch with a lighter broken rim, flat on the road, readable from
 * 30 m. One instanced mesh for all of them: a single draw call.
 */
import * as THREE from 'three';
import type { Terrain } from '../world/terrain';
import type { ZonePothole } from '../world/zone';

const DARK = '#1E1A16';
const RIM = '#ABA192';

/** A ragged hole drawn once into a small canvas; each pothole turns and scales it differently. */
function holeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const blob = (r: number, wobble: number[]) => {
    g.beginPath();
    wobble.forEach((w, i) => {
      const a = (i / wobble.length) * Math.PI * 2;
      const x = 64 + Math.cos(a) * r * w;
      const y = 64 + Math.sin(a) * r * w;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.closePath();
    g.fill();
  };
  const shape = [1, 0.86, 0.95, 0.78, 0.92, 1, 0.84, 0.97, 0.8, 0.93, 0.88, 1, 0.82, 0.96];
  // Broken rim: lighter crumbled asphalt, a little wider than the hole and uneven.
  g.fillStyle = RIM;
  blob(
    62,
    shape.map((w, i) => Math.min(1, w + (i % 3 === 0 ? 0.04 : -0.03))),
  );
  g.fillStyle = DARK;
  blob(50, shape);
  // A few chips of rim scattered inside the edge.
  g.fillStyle = RIM;
  for (const [x, y, r] of [
    [30, 52, 4],
    [92, 78, 3],
    [70, 24, 3],
    [44, 96, 3],
  ] as const) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** World (x, y) maps to Three.js (x, -z). The rim reaches a little past each pothole's radius. */
export function buildPotholes(list: ZonePothole[], terrain: Terrain): THREE.Object3D[] {
  if (list.length === 0) return [];
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({
    map: holeTexture(),
    alphaTest: 0.5,
    transparent: false,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  mesh.name = 'potholes';
  mesh.receiveShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const tilt = new THREE.Quaternion();
  const n = new THREE.Vector3();
  list.forEach(([x, y, r], i) => {
    const size = r * 2 * 1.45;
    // Turned for variety, then tilted to lie flat on the slope.
    const [nx, ny, nz] = terrain.normal(x, y);
    tilt.setFromUnitVectors(up, n.set(nx, nz, -ny));
    q.setFromAxisAngle(up, (i * 2.399) % (Math.PI * 2)).premultiply(tilt);
    m.compose(
      new THREE.Vector3(x, terrain.heightAt(x, y) + 0.06, -y),
      q,
      new THREE.Vector3(size, 1, size * (0.8 + ((i * 7) % 5) * 0.08)),
    );
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return [mesh];
}
