import './fonts.css';
import './style.css';
import { loadConfig } from './platform/config';
import { crashReportsAllowed, loadConsent } from './platform/consent';
import { reportError, startCrashReporting } from './platform/crash';
import { configUrl, PLATFORM } from './platform/native';
import { browserStore } from './platform/storage';
import { createScene } from './render/scene';
import { createVehicle, stepVehicle, type VehicleState } from './sim/vehicle';
import { createInput } from './ui/input';
import { Obstacles } from './world/collision';
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

async function boot(): Promise<void> {
  const zone = await loadZone(ZONE_URL);
  const roads = new RoadNetwork(zone);
  const obstacles = new Obstacles(zone);
  const start = startPose(zone, roads);
  const player = createVehicle(start.x, start.y, start.h);
  const input = createInput($('app'));
  const scene = createScene($<HTMLCanvasElement>('gl'), zone, roads);
  window.addEventListener('resize', () => scene.resize());

  const env = {
    roadDist: (x: number, y: number) => roads.nearest(x, y).dist,
    collide: (x: number, y: number, r: number) => obstacles.collide(x, y, r),
    bounds: zone.bounds,
  };

  const speedEl = $('speed');
  const streetEl = $('street');
  let last = performance.now();
  let hudTimer = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepVehicle(player, input, dt, env);
    scene.render(player, dt);
    hudTimer -= dt;
    if (hudTimer <= 0) {
      hudTimer = 0.2;
      speedEl.textContent = `${Math.round(Math.abs(player.v) * 3.6)}`;
      const name = roads.roadNameAt(player.x, player.y);
      streetEl.textContent = name;
      streetEl.hidden = name === '';
      window.__ona.road = name;
    }
    requestAnimationFrame(frame);
  };

  $('loading').hidden = true;
  $('hud').hidden = false;
  Object.assign(window.__ona, { ready: true, player, road: '', stats: scene.stats });
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
