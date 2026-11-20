import './fonts.css';
import './style.css';
import { createRideLoop } from './play';
import { loadConfig } from './platform/config';
import { crashReportsAllowed, loadConsent } from './platform/consent';
import { reportError, startCrashReporting } from './platform/crash';
import { configUrl, PLATFORM } from './platform/native';
import { createSaveStore } from './platform/save';
import { loadSettings, saveSettings } from './platform/settings';
import { browserStore } from './platform/storage';
import { createMarkers } from './render/markers';
import { createScene } from './render/scene';
import { createTraffic, pushOutOfTraffic, stepTraffic } from './sim/traffic';
import { createVehicle, stepVehicle, type VehicleState } from './sim/vehicle';
import { createWardens, nearestWarden, secondsLeft, stepWardens, wardenRules } from './sim/wardens';
import { createSound } from './ui/audio';
import { createDialogs } from './ui/dialog';
import { createInput } from './ui/input';
import { createMinimap } from './ui/minimap';
import { createSettingsPanel } from './ui/settings';
import { createSwipe, STEER_GAIN } from './ui/swipe';
import { createTracker } from './ui/tracker';
import { Obstacles } from './world/collision';
import { circlePolygon, placeKiosks, placeTrees, roundaboutIslands, seededRandom } from './world/props';
import { RoadNetwork } from './world/roads';
import { placeSignPosts } from './world/signs';
import { buildSpots } from './world/spots';
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
  /** Street name plates and signposts placed (NAV-2, NAV-3), for tests. */
  signs?: { x: number; y: number; plates: string[]; blades: string[] }[];
  wardens?: { name: string; phase: 'go' | 'stop' }[];
  /** 'pending' until the remote switch and the player's choice have been checked. */
  crashReporting: 'pending' | 'on' | 'off';
  /** Ride loop state and a teleport helper, for tests and debugging. */
  game?: {
    readonly money: number;
    readonly respect: number;
    readonly pages: boolean[];
    readonly trip: { pax: string; to: string; toX: number; toY: number } | null;
    readonly offers: { pax: string; stopX: number; stopY: number; kerbX: number; kerbY: number }[];
    readonly started: boolean;
    readonly paused: boolean;
    teleport(x: number, y: number, h?: number): void;
  };
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
  // The warden signs and the ₦ coin are drawn with the display font, so make sure it has loaded.
  await document.fonts.load('800 34px "Baloo 2"').catch(() => undefined);
  const roads = new RoadNetwork(zone);
  const rand = seededRandom(WORLD_SEED);
  const buildingsOnly = new Obstacles(zone);
  const kiosks = placeKiosks(roads, (x, y) => buildingsOnly.collide(x, y, 1.5).hit, rand);
  const islands = roundaboutIslands(zone);
  // Street name plates and signposts (NAV-2, NAV-3) stand on corners clear of buildings and kiosks.
  const withKiosks = new Obstacles(
    zone,
    kiosks.map((k) => k.poly),
  );
  const signPosts = placeSignPosts(zone, roads, islands, (x, y) => withKiosks.collide(x, y, 0.6).hit);
  // Poles are solid, so the keke bumps them rather than driving through.
  const obstacles = new Obstacles(zone, [
    ...kiosks.map((k) => k.poly),
    ...signPosts.map((p) => circlePolygon(p.x, p.y, 0.25, 6)),
  ]);
  const trees = placeTrees(
    zone,
    roads,
    (x, y) => obstacles.collide(x, y, 1.5).hit,
    rand,
    LOW_DETAIL ? 520 : 900,
  );
  const wardens = createWardens(islands);
  const npcs = createTraffic(roads, zone.nodes, rand, LOW_DETAIL ? 10 : 16);
  const spots = buildSpots(zone, roads);

  const start = startPose(zone, roads);
  const player = createVehicle(start.x, start.y, start.h);
  const store = browserStore();
  const settings = loadSettings(store);
  const sound = createSound();
  sound.muted = !settings.sound;
  const dialogs = createDialogs($('dialog'), $('toasts'));
  const tracker = createTracker($('tracker'));
  const pauseEl = $('pause');
  const titleEl = $('title');
  const settingsEl = $('settings');
  let started = false;
  /** The world stands still on the title screen, while a card is open, and while paused. */
  const paused = () => !started || dialogs.open || !pauseEl.hidden || !settingsEl.hidden;

  const scene = createScene(
    $<HTMLCanvasElement>('gl'),
    zone,
    roads,
    { kiosks, trees, islands, wardens, npcs, signPosts },
    { lowDetail: LOW_DETAIL, reducedMotion: REDUCED_MOTION },
    rand,
  );
  const minimap = createMinimap($<HTMLCanvasElement>('minimap'), $('north'), zone, islands);
  window.addEventListener('resize', () => scene.resize());
  const markers = createMarkers(scene.three, scene.keke);
  const flashEl = $('flash');

  const ride = createRideLoop({
    zone,
    roads,
    spots,
    saves: createSaveStore(store, zone.notebook.length),
    dialogs,
    markers,
    sound,
    wardens,
    rand,
    flash: () => {
      sound.shutter();
      // A paper-coloured flash; softer and shorter with reduced motion (DESIGN A-7).
      flashEl.animate([{ opacity: REDUCED_MOTION ? 0.4 : 0.9 }, { opacity: 0 }], {
        duration: REDUCED_MOTION ? 250 : 600,
        easing: 'ease-out',
      });
    },
  });

  const input = createInput($('app'), {
    horn: () => {
      if (!paused()) ride.honk(player);
    },
    firstGesture: () => sound.unlock(),
  });

  // Controls (ACC-3): swipe, buttons or both. The hint shows on touch screens until the first real drag.
  const hudEl = $('hud');
  const hintEl = $('swipeHint');
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const applySettings = () => {
    hudEl.dataset.controls = settings.controls;
    hintEl.hidden = !touch || settings.controls === 'buttons' || settings.swipeHintDone;
    sound.muted = !settings.sound;
  };
  applySettings();
  const swipe = createSwipe($('gl'), $('swipeRing'), input, {
    enabled: () => settings.controls !== 'buttons' && !paused(),
    gain: () => STEER_GAIN[settings.steer],
    onDrive: () => {
      if (settings.swipeHintDone) return;
      settings.swipeHintDone = true;
      saveSettings(store, settings);
      applySettings();
    },
  });
  const settingsPanel = createSettingsPanel(settingsEl, {
    settings,
    changed: () => {
      saveSettings(store, settings);
      applySettings();
    },
    game: () => ride.state,
    pageCount: zone.notebook.length,
    load: (state) => {
      ride.load(state);
      if (state.introDone) {
        $('startBtn').textContent = 'Continue';
        $('newBtn').hidden = false;
      }
    },
  });

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

  const setPaused = (on: boolean) => {
    if (!started || dialogs.open) return;
    pauseEl.hidden = !on;
    if (on) {
      swipe.cancel();
      input.gas = input.brake = input.left = input.right = 0;
      const st = ride.state;
      $('pauseSummary').textContent =
        `${st.rides} rides · ${st.pages.filter(Boolean).length} of ${st.pages.length} notebook places · Respect ${st.respect}`;
      $('resumeBtn').focus({ preventScroll: true });
    }
  };
  $('pauseBtn').addEventListener('click', () => setPaused(true));
  $('resumeBtn').addEventListener('click', () => setPaused(false));
  $('settingsBtn').addEventListener('click', () => {
    pauseEl.hidden = true;
    settingsPanel.show(() => {
      pauseEl.hidden = false;
      $('resumeBtn').focus({ preventScroll: true });
    });
  });
  $('titleSettings').addEventListener('click', () => settingsPanel.show());
  $('restartBtn').addEventListener('click', () => {
    pauseEl.hidden = true;
    const s = startPose(zone, roads);
    Object.assign(player, { x: s.x, y: s.y, h: s.h, v: 0 });
    ride.restart();
  });
  $('photoBtn').addEventListener('click', () => ride.takePhoto());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && settingsPanel.open) return settingsPanel.close();
    if (!started) return;
    if (e.code === 'Escape') setPaused(pauseEl.hidden === true);
    else if (e.code === 'KeyP' && !e.repeat && !paused()) ride.takePhoto();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
  });

  const begin = (fresh: boolean) => {
    sound.unlock();
    titleEl.hidden = true;
    $('hud').hidden = false;
    started = true;
    scene.resize();
    ride.begin(fresh);
  };
  if (ride.state.introDone) {
    $('startBtn').textContent = 'Continue';
    $('newBtn').hidden = false;
  }
  $('startBtn').addEventListener('click', () => begin(false));
  $('newBtn').addEventListener('click', () => begin(true));

  const speedEl = $('speed');
  const streetEl = $('street');
  const wardenEl = $('warden');
  const wardenName = $('wardenName');
  const wardenSig = $('wardenSig');
  const photoBtn = $('photoBtn');
  let last = performance.now();
  let hudTimer = 0;
  let lastBump = 0;
  let time = 0;

  const frame = (now: number) => {
    // The simulation step is capped so a slow frame can't tunnel through walls; the HUD uses real time.
    const realDt = (now - last) / 1000;
    const dt = Math.min(0.05, realDt);
    last = now;
    time += dt;
    if (!paused()) {
      const step = stepVehicle(player, input, dt, env);
      if (step.impact > 2.2 && time - lastBump > 0.45) {
        lastBump = time;
        sound.thud();
        scene.bump(step.impact);
        ride.bump(step.impact);
      }
      const changed = stepWardens(wardens, dt);
      for (const w of changed) {
        const d = Math.hypot(player.x - w.x, player.y - w.y);
        if (w.phase === 'stop' && d < 90) sound.whistle(0.07 * Math.max(0.2, 1 - d / 90));
      }
      ride.wardenEvents(wardenRules(wardens, changed, player, Math.abs(player.v), dt));
      stepTraffic(npcs, roads, zone.nodes, player, wardens, dt, rand);
      ride.update(dt, player, step.onRoad);
    }
    const still = paused();
    sound.engine(still ? 0 : Math.abs(player.v), still ? 0 : input.gas - input.brake);
    markers.update(player, time);
    scene.render(player, dt);
    minimap.draw(player, wardens, dt);
    hudTimer -= realDt;
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
      if (started) tracker.update(ride.tracker(player));
      photoBtn.hidden = ride.photoTarget === null || still;
    }
    requestAnimationFrame(frame);
  };

  $('loading').hidden = true;
  titleEl.hidden = false;
  if (!window.matchMedia('(pointer: coarse)').matches) $('startBtn').focus({ preventScroll: true });
  Object.assign(window.__ona, {
    ready: true,
    player,
    road: '',
    stats: scene.stats,
    traffic: npcs.length,
    signs: signPosts.map((p) => ({
      x: p.x,
      y: p.y,
      plates: p.plates.map((pl) => pl.name),
      blades: p.blades.map((b) => b.to),
    })),
    game: {
      get money() {
        return ride.state.money;
      },
      get respect() {
        return ride.state.respect;
      },
      get pages() {
        return [...ride.state.pages];
      },
      get trip() {
        const t = ride.trip;
        if (!t) return null;
        const s = spots[t.toSpot]!;
        return { pax: t.pax.name, to: s.name, toX: s.stopX, toY: s.stopY };
      },
      get offers() {
        return ride.offers.map((o) => {
          const s = spots[o.spot]!;
          return { pax: o.pax.name, stopX: s.stopX, stopY: s.stopY, kerbX: s.kerbX, kerbY: s.kerbY };
        });
      },
      get started() {
        return started;
      },
      get paused() {
        return paused();
      },
      teleport(x: number, y: number, h?: number) {
        Object.assign(player, { x, y, v: 0, ...(h === undefined ? {} : { h }) });
      },
    },
  });
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
