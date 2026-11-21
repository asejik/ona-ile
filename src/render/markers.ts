/**
 * Ride and notebook markers in the 3D world (CORE-1, CORE-3, CORE-5), ported from prototype v0.1.
 * Passengers stand on the kerb; the yellow pickup ring and green drop-off ring sit in the lane beside it.
 */
import * as THREE from 'three';
import type { Spot } from '../world/spots';
import type { Terrain } from '../world/terrain';
import { VERTEX_COLOURS, personGeometry } from './models';

export interface WaitingPassenger {
  id: string;
  spot: Spot;
  cloth: string;
  cap?: string;
}

export interface Markers {
  setWaiting(list: WaitingPassenger[]): void;
  /** The passenger riding in the keke, or null. */
  setRider(rider: { cloth: string; cap?: string } | null): void;
  /** Drop-off point, or null when there is no trip. */
  setDestination(spot: Spot | null): void;
  /** Point ~18 m along the route the arrow should face, or null to hide it. */
  setArrowTarget(target: { x: number; y: number } | null): void;
  setNotebook(places: { x: number; y: number; found: boolean }[]): void;
  /** Oga Lati's workshop (DMG-4): a spanner board on the kerb and a paper ring where the keke stops. */
  setWorkshop(spot: Spot | null): void;
  /** Timed challenge boards (TIME-1): a yellow stopwatch board on the kerb and a yellow ring to stop in. */
  setChallenges(starts: Spot[]): void;
  update(player: { x: number; y: number }, time: number): void;
}

function sprite(draw: (g: CanvasRenderingContext2D) => void): THREE.SpriteMaterial {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: t, fog: false });
}

const COIN = () =>
  sprite((g) => {
    g.fillStyle = '#1C1812';
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#F2C230';
    g.beginPath();
    g.arc(64, 64, 52, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1C1812';
    g.font = '800 70px "Baloo 2", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('₦', 64, 70);
  });

const BOOK = () =>
  sprite((g) => {
    g.fillStyle = '#1C1812';
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#FFF6E4';
    g.fillRect(28, 34, 34, 58);
    g.fillRect(66, 34, 34, 58);
    g.fillStyle = '#B5643F';
    g.fillRect(62, 30, 4, 66);
    g.strokeStyle = '#B5643F';
    g.lineWidth = 3;
    for (let y = 46; y < 88; y += 10) {
      g.beginPath();
      g.moveTo(33, y);
      g.lineTo(57, y);
      g.moveTo(71, y);
      g.lineTo(95, y);
      g.stroke();
    }
  });

/** A spanner on a paper disc, for Oga Lati's workshop. */
const SPANNER = () =>
  sprite((g) => {
    g.fillStyle = '#1C1812';
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#FFF6E4';
    g.beginPath();
    g.arc(64, 64, 52, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1C1812';
    g.fillStyle = '#1C1812';
    g.lineCap = 'round';
    g.lineWidth = 13;
    g.beginPath();
    g.moveTo(40, 88);
    g.lineTo(78, 50);
    g.stroke();
    g.beginPath();
    g.arc(82, 46, 18, 0, Math.PI * 2);
    g.fill();
    // The open jaw.
    g.fillStyle = '#FFF6E4';
    g.beginPath();
    g.arc(90, 38, 9, 0, Math.PI * 2);
    g.fill();
  });

/** DESIGN §6: a yellow --keke board with ink text and a stopwatch icon. */
const CHALLENGE_BOARD = () => {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1C1812';
  g.beginPath();
  g.roundRect(4, 14, 312, 100, 16);
  g.fill();
  g.fillStyle = '#F2C230';
  g.beginPath();
  g.roundRect(10, 20, 300, 88, 12);
  g.fill();
  // Stopwatch.
  g.fillStyle = '#1C1812';
  g.fillRect(48, 30, 16, 10);
  g.lineWidth = 7;
  g.strokeStyle = '#1C1812';
  g.beginPath();
  g.arc(56, 70, 26, 0, Math.PI * 2);
  g.stroke();
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(56, 70);
  g.lineTo(56, 52);
  g.moveTo(56, 70);
  g.lineTo(70, 70);
  g.stroke();
  // Sized so the longer word fits the board, whatever the font's exact widths.
  let px = 34;
  g.font = `800 ${px}px "Baloo 2", sans-serif`;
  while (px > 18 && g.measureText('CHALLENGE').width > 200) g.font = `800 ${--px}px "Baloo 2", sans-serif`;
  g.textBaseline = 'middle';
  g.fillText('TIMED', 98, 50);
  g.fillText('CHALLENGE', 98, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: t, fog: false });
};

export function createMarkers(scene: THREE.Scene, keke: THREE.Group, terrain: Terrain): Markers {
  const ground = (x: number, y: number) => terrain.heightAt(x, y);
  const coinMat = COIN();
  const bookMat = BOOK();
  const spannerMat = SPANNER();
  const ringGeo = new THREE.RingGeometry(2.0, 2.6, 40).rotateX(-Math.PI / 2);
  // Yellow ring with an ink edge, so it reads on light and dark asphalt.
  const ringMat = (colour: string) =>
    new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.9, depthWrite: false });
  const pickupMat = ringMat('#F2C230');
  const workshopMat = ringMat('#FFF6E4');
  const dropMat = ringMat('#36D07A');
  const edgeGeo = new THREE.RingGeometry(2.6, 2.85, 40).rotateX(-Math.PI / 2);
  const edgeMat = ringMat('#1C1812');

  const waiting = new Map<
    string,
    { group: THREE.Group; ring: THREE.Group; coin: THREE.Sprite; spot: Spot }
  >();

  const ring = (mat: THREE.Material) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(ringGeo, mat), new THREE.Mesh(edgeGeo, edgeMat));
    return g;
  };

  const dest = ring(dropMat);
  dest.visible = false;
  dest.position.y = 0.09;
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 70, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#36D07A',
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  beacon.visible = false;
  scene.add(dest, beacon);

  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 1.15);
  arrowShape.lineTo(0.95, -0.6);
  arrowShape.lineTo(0, -0.15);
  arrowShape.lineTo(-0.95, -0.6);
  arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(-Math.PI / 2);
  const arrow = new THREE.Mesh(
    arrowGeo,
    new THREE.MeshBasicMaterial({
      color: '#36D07A',
      fog: false,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
    }),
  );
  arrow.renderOrder = 10;
  arrow.visible = false;
  scene.add(arrow);
  let arrowTarget: { x: number; y: number } | null = null;

  const workshop = new THREE.Group();
  const workshopRing = ring(workshopMat);
  const spanner = new THREE.Sprite(spannerMat);
  spanner.scale.set(3, 3, 1);
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6).translate(0, 1.6, 0),
    new THREE.MeshLambertMaterial({ color: '#8C8C8C' }),
  );
  workshop.visible = workshopRing.visible = false;
  let workshopAt: Spot | null = null;
  workshop.add(post, spanner);
  scene.add(workshop, workshopRing);

  const boardMat = CHALLENGE_BOARD();
  const boards: THREE.Object3D[] = [];
  const boardSigns: { sprite: THREE.Sprite; x: number; y: number }[] = [];

  let rider: THREE.Mesh | null = null;
  const books: { sprite: THREE.Sprite; beam: THREE.Mesh; x: number; y: number; g: number }[] = [];

  return {
    setWaiting(list) {
      const keep = new Set(list.map((w) => w.id));
      for (const [id, w] of waiting) {
        if (!keep.has(id)) {
          scene.remove(w.group, w.ring);
          waiting.delete(id);
        }
      }
      for (const w of list) {
        if (waiting.has(w.id)) continue;
        const group = new THREE.Group();
        group.position.set(w.spot.kerbX, ground(w.spot.kerbX, w.spot.kerbY), -w.spot.kerbY);
        const person = new THREE.Mesh(personGeometry(w.cloth, w.cap ? { cap: w.cap } : {}), VERTEX_COLOURS);
        person.castShadow = true;
        // Face the road.
        person.rotation.y = Math.atan2(w.spot.stopY - w.spot.kerbY, w.spot.stopX - w.spot.kerbX);
        const coin = new THREE.Sprite(coinMat);
        coin.scale.set(2.4, 2.4, 1);
        coin.position.y = 3.6;
        group.add(person, coin);
        const r = ring(pickupMat);
        r.position.set(w.spot.stopX, ground(w.spot.stopX, w.spot.stopY) + 0.09, -w.spot.stopY);
        scene.add(group, r);
        waiting.set(w.id, { group, ring: r, coin, spot: w.spot });
      }
    },
    setRider(r) {
      if (rider) keke.remove(rider);
      rider = null;
      if (r) {
        rider = new THREE.Mesh(
          personGeometry(r.cloth, r.cap ? { seated: true, cap: r.cap } : { seated: true }),
          VERTEX_COLOURS,
        );
        rider.position.set(-0.6, 0, 0);
        keke.add(rider);
      }
    },
    setDestination(spot) {
      dest.visible = beacon.visible = spot !== null;
      if (spot) {
        const g = ground(spot.stopX, spot.stopY);
        dest.position.set(spot.stopX, g + 0.09, -spot.stopY);
        beacon.position.set(spot.stopX, g + 35, -spot.stopY);
      }
    },
    setArrowTarget(t) {
      arrowTarget = t;
      arrow.visible = t !== null;
    },
    setNotebook(places) {
      for (const b of books) scene.remove(b.sprite, b.beam);
      books.length = 0;
      for (const p of places) {
        if (p.found) continue;
        const s = new THREE.Sprite(bookMat);
        s.scale.set(4.2, 4.2, 1);
        const g = ground(p.x, p.y);
        s.position.set(p.x, g + 9, -p.y);
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 40, 10, 1, true),
          new THREE.MeshBasicMaterial({
            color: '#FFB14A',
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            fog: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          }),
        );
        beam.position.set(p.x, g + 20, -p.y);
        scene.add(s, beam);
        books.push({ sprite: s, beam, x: p.x, y: p.y, g });
      }
    },
    setWorkshop(spot) {
      workshopAt = spot;
      workshop.visible = workshopRing.visible = spot !== null;
      if (!spot) return;
      workshop.position.set(spot.kerbX, ground(spot.kerbX, spot.kerbY), -spot.kerbY);
      spanner.position.y = 4.4;
      workshopRing.position.set(spot.stopX, ground(spot.stopX, spot.stopY) + 0.09, -spot.stopY);
    },
    setChallenges(starts) {
      for (const b of boards) scene.remove(b);
      boards.length = 0;
      boardSigns.length = 0;
      for (const s of starts) {
        const g = ground(s.kerbX, s.kerbY);
        const board = new THREE.Group();
        board.position.set(s.kerbX, g, -s.kerbY);
        const sign = new THREE.Sprite(boardMat);
        sign.scale.set(5, 2, 1);
        sign.position.y = 4.2;
        board.add(post.clone(), sign);
        const r = ring(pickupMat);
        r.position.set(s.stopX, ground(s.stopX, s.stopY) + 0.09, -s.stopY);
        scene.add(board, r);
        boards.push(board, r);
        boardSigns.push({ sprite: sign, x: s.kerbX, y: s.kerbY });
      }
    },
    update(player, time) {
      const pulse = 1 + Math.sin(time * 4) * 0.06;
      for (const w of waiting.values()) {
        w.ring.scale.set(pulse, 1, pulse);
        w.coin.position.y = 3.6 + Math.sin(time * 3 + w.spot.node) * 0.25;
        // The coin would block the view when right beside it.
        w.coin.visible = Math.hypot(player.x - w.spot.kerbX, player.y - w.spot.kerbY) > 16;
      }
      dest.scale.set(pulse, 1, pulse);
      // Like the coins, the spanner would fill the view when parked right beside it.
      for (const b of boardSigns) b.sprite.visible = Math.hypot(player.x - b.x, player.y - b.y) > 12;
      if (workshopAt)
        spanner.visible = Math.hypot(player.x - workshopAt.kerbX, player.y - workshopAt.kerbY) > 12;
      books.forEach((b, i) => {
        b.sprite.position.y = b.g + 9 + Math.sin(time * 2 + i) * 0.4;
      });
      if (arrowTarget) {
        const a = Math.atan2(arrowTarget.y - player.y, arrowTarget.x - player.x);
        arrow.position.set(player.x, ground(player.x, player.y) + 3.3, -player.y);
        arrow.rotation.y = a - Math.PI / 2;
      }
    },
  };
}
