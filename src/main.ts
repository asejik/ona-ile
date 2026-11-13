import './fonts.css';
import './style.css';
import { loadConfig } from './platform/config';
import { crashReportsAllowed, loadConsent } from './platform/consent';
import { reportError, startCrashReporting } from './platform/crash';
import { configUrl, PLATFORM } from './platform/native';
import { browserStore } from './platform/storage';
import { createScene } from './render/scene';
import { createTraffic, pushOutOfTraffic, stepTraffic } from './sim/traffic';
import { createVehicle, stepVehicle, type VehicleState } from './sim/vehicle';
import { createWardens, nearestWarden, secondsLeft, stepWardens } from './sim/wardens';
import { createSound } from './ui/audio';
import { createInput } from './ui/input';
import { createMinimap } from './ui/minimap';
import { Obstacles } from './world/collision';
import { placeKiosks, placeTrees, roundaboutIslands, seededRandom } from './world/props';
import { RoadNetwork } from './world/roads';
import { startPose } from './world/start';
import { loadZone } from './world/zone';

const ZONE_URL = `${import.meta.env.BASE_URL}zones/zone1-post-office.json`;
const CONFIG_URL = configUrl(import.meta.env.BASE_URL);

/** Read-only handle for tests and debugging. Holds no personal data. */
interface DebugHandle {
  ready: boolean;
  player?: VehicleState;
  road?: string;
  stats?: { calls: number; triangles: number };
  /** Traffic and warden state, for tests. */
  traffic?: number;
  wardens?: { name: string; phase: 'go' | 'stop' }[];
  /** 'pending' until the remote switch and the player's choice have been checked. */
  crashReporting: 'pending' | 'on' | 'off';
}
declare global {
  interface Window {
    __ona: DebugHandle;
  }
}
window.__ona = { ready: false, crashReporting: 'pending' };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/** Phones and low-memory devices get fewer trees, a smaller shadow map and shorter view distance. */
const LOW_DETAIL =
  window.matchMedia('(pointer: coarse)').matches ||
  ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Fixed seed: kiosks, trees and traffic are the same on every device and every visit. */
const WORLD_SEED = 20261113;

async function boot(): Promise<void> {
  const zone = await loadZone(ZONE_URL);
  // The warden signs are drawn with the display font, so make sure it has loaded first.
  await document.fonts.load('800 34px "Baloo 2"').catch(() => undefined);
  const roads = new RoadNetwork(zone);
  const rand = seededRandom(WORLD_SEED);
  const buildingsOnly = new Obstacles(zone);
  const kiosks = placeKiosks(roads, (x, y) => buildingsOnly.collide(x, y, 1.5).hit, rand);
  const obstacles = new Obstacles(
    zone,
    kiosks.map((k) => k.poly),
  );
  const trees = placeTrees(
    zone,
    roads,
    (x, y) => obstacles.collide(x, y, 1.5).hit,
    rand,
    LOW_DETAIL ? 520 : 900,
  );
  const islands = roundaboutIslands(zone);
  const wardens = createWardens(islands);
  const npcs = createTraffic(roads, zone.nodes, rand, LOW_DETAIL ? 10 : 16);

  const start = startPose(zone, roads);
  const player = createVehicle(start.x, start.y, start.h);
  const sound = createSound();
  const input = createInput($('app'), { horn: () => sound.horn(), firstGesture: () => sound.unlock() });
  const scene = createScene(
    $<HTMLCanvasElement>('gl'),
    zone,
    roads,
    { kiosks, trees, islands, wardens, npcs },
    { lowDetail: LOW_DETAIL, reducedMotion: REDUCED_MOTION },
    rand,
  );
  const minimap = createMinimap($<HTMLCanvasElement>('minimap'), $('north'), zone, islands);
  window.addEventListener('resize', () => scene.resize());

  // Buildings, kiosks and islands first, then the other vehicles.
  const env = {
    roadDist: (x: number, y: number) => roads.nearest(x, y).dist,
    collide: (x: number, y: number, r: number) => {
      const c = obstacles.collide(x, y, r);
      const pos = { x: c.x, y: c.y };
      if (pushOutOfTraffic(pos, r, Math.abs(player.v), npcs) > 0) {
        const d = Math.hypot(pos.x - c.x, pos.y - c.y) || 1;
        return { x: pos.x, y: pos.y, hit: true, nx: (pos.x - c.x) / d, ny: (pos.y - c.y) / d };
      }
      return c;
    },
    bounds: zone.bounds,
  };

  const speedEl = $('speed');
  const streetEl = $('street');
  const wardenEl = $('warden');
  const wardenName = $('wardenName');
  const wardenSig = $('wardenSig');
  let last = performance.now();
  let hudTimer = 0;
  let lastBump = 0;
  let time = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    const step = stepVehicle(player, input, dt, env);
    if (step.impact > 2.2 && time - lastBump > 0.45) {
      lastBump = time;
      sound.thud();
      scene.bump(step.impact);
    }
    for (const w of stepWardens(wardens, dt)) {
      const d = Math.hypot(player.x - w.x, player.y - w.y);
      if (w.phase === 'stop' && d < 90) sound.whistle(0.07 * Math.max(0.2, 1 - d / 90));
    }
    stepTraffic(npcs, roads, zone.nodes, player, wardens, dt, rand);
    sound.engine(Math.abs(player.v), input.gas - input.brake);
    scene.render(player, dt);
    minimap.draw(player, wardens, dt);
    hudTimer -= dt;
    if (hudTimer <= 0) {
      hudTimer = 0.2;
      speedEl.textContent = `${Math.round(Math.abs(player.v) * 3.6)}`;
      const name = roads.roadNameAt(player.x, player.y);
      streetEl.textContent = name;
      streetEl.hidden = name === '';
      window.__ona.road = name;
      const near = nearestWarden(wardens, player.x, player.y);
      wardenEl.hidden = !near || near.dist > 95;
      if (near && near.dist <= 95) {
        wardenName.textContent = near.warden.name;
        wardenSig.textContent = `${near.warden.phase === 'stop' ? 'STOP' : 'GO'} ${secondsLeft(near.warden)}`;
        wardenSig.className = `signal ${near.warden.phase}`;
      }
      window.__ona.wardens = wardens.map((w) => ({ name: w.name, phase: w.phase }));
    }
    requestAnimationFrame(frame);
  };

  $('loading').hidden = true;
  $('hud').hidden = false;
  Object.assign(window.__ona, { ready: true, player, road: '', stats: scene.stats, traffic: npcs.length });
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
}

/** Crash reports start only if the player opted in and config.json allows it (PRIV-1, PRIV-11). */
async function startDiagnostics(): Promise<void> {
  const store = browserStore();
  const config = await loadConfig(CONFIG_URL, store, (url, init) => fetch(url, init));
  const on =
    crashReportsAllowed(loadConsent(store), config) &&
    (await startCrashReporting(`ona-ile@${__APP_VERSION__}`, PLATFORM));
  window.__ona.crashReporting = on ? 'on' : 'off';
}

const diagnostics = startDiagnostics().catch(() => {
  window.__ona.crashReporting = 'off';
});

boot().catch((err: unknown) => {
  $('loading').hidden = true;
  const card = $('error');
  card.hidden = false;
  $('errorText').textContent = "Couldn't load the map. Check your connection.";
  console.error(err);
  // Boot errors are caught here, so global handlers never see them. Report once diagnostics have decided.
  void diagnostics.then(() => reportError(err));
  $('retry').addEventListener('click', () => window.location.reload());
});
