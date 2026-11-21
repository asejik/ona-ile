import './fonts.css';
import './style.css';
import { createRideLoop } from './play';
import { loadConfig } from './platform/config';
import { crashReportsAllowed, loadConsent } from './platform/consent';
import { reportError, startCrashReporting } from './platform/crash';
import { configUrl, PLATFORM } from './platform/native';
import { createSaveStore } from './platform/save';
import { QUALITY, effectiveQuality, loadSettings, saveSettings } from './platform/settings';
import { browserStore } from './platform/storage';
import { createMarkers } from './render/markers';
import { createScene } from './render/scene';
import { Potholes } from './sim/potholes';
import { createTraffic, pushOutOfTraffic, stepTraffic } from './sim/traffic';
import { createVehicle, stepVehicle, type VehicleState } from './sim/vehicle';
import { CHALLENGES } from './story/content';
import { createWardens, nearestWarden, secondsLeft, stepWardens, wardenRules } from './sim/wardens';
import { createSound } from './ui/audio';
import { createCredits } from './ui/credits';
import { createDialogs } from './ui/dialog';
import { createInput } from './ui/input';
import { createFullMap } from './ui/fullmap';
import type { MapMark } from './ui/mapdraw';
import { createMinimap } from './ui/minimap';
import { createSettingsPanel } from './ui/settings';
import { createSwipe, STEER_GAIN } from './ui/swipe';
import { stackHud } from './ui/hudlayout';
import { createTracker } from './ui/tracker';
import { Obstacles } from './world/collision';
import { circlePolygon, placeKiosks, placeTrees, roundaboutIslands, seededRandom } from './world/props';
import { RoadNetwork } from './world/roads';
import { placeSignPosts } from './world/signs';
import { buildSpots } from './world/spots';
import { Terrain } from './world/terrain';
import { placeWorkshop, WORKSHOP_NAME } from './world/workshop';
import { placeChallenges } from './world/challenges';
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
  /** Ground height at a point (M4c), for tests. */
  groundAt?: (x: number, y: number) => number;
  /** Potholes in the world (REAL-5): [x, y, radius, deep], for tests. */
  potholes?: [number, number, number, 0 | 1][];
  /** 'pending' until the remote switch and the player's choice have been checked. */
  crashReporting: 'pending' | 'on' | 'off';
  /** Ride loop state and a teleport helper, for tests and debugging. */
  game?: {
    readonly money: number;
    readonly respect: number;
    readonly pages: boolean[];
    /** Keke damage, 0–100 (DMG-1). */
    readonly damage: number;
    /** Oga Lati's workshop stop, for tests. */
    readonly workshop: { stopX: number; stopY: number } | null;
    /** Timed challenges (TIME-1): where each starts and finishes, for tests. */
    readonly challenges: { id: string; startX: number; startY: number; finishX: number; finishY: number }[];
    /** The challenge being driven, or null. */
    readonly run: { id: string; t: number; countdown: number } | null;
    /** Best challenge times by id. */
    readonly best: Record<string, number>;
    /** Sets the damage, for tests and debugging. */
    setDamage(n: number): void;
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

/** Phones and low-memory devices: graphics quality 'auto' means low there (SYS-1). */
const SLOW_DEVICE =
  window.matchMedia('(pointer: coarse)').matches ||
  ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
const SYSTEM_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Fixed seed: kiosks, trees and traffic are the same on every device and every visit. */
const WORLD_SEED = 20261113;

async function boot(): Promise<void> {
  const zone = await loadZone(ZONE_URL);
  const store = browserStore();
  const settings = loadSettings(store);
  // Graphics quality is read once: the world is built for it. A change applies on the next start.
  const quality = QUALITY[effectiveQuality(settings, SLOW_DEVICE)];
  const reducedMotion = () => settings.reduceMotion ?? SYSTEM_REDUCED_MOTION;
  // The warden signs and the ₦ coin are drawn with the display font, so make sure it has loaded.
  await document.fonts.load('800 34px "Baloo 2"').catch(() => undefined);
  const roads = new RoadNetwork(zone);
  const terrain = new Terrain(zone.terrain);
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
  const trees = placeTrees(zone, roads, (x, y) => obstacles.collide(x, y, 1.5).hit, rand, quality.trees);
  const wardens = createWardens(islands);
  const npcs = createTraffic(roads, zone.nodes, rand, quality.traffic);
  const spots = buildSpots(zone, roads);
  const workshop = placeWorkshop(zone, roads, spots, (x, y) => obstacles.collide(x, y, 1.2).hit);
  // TIME-1: challenge boards on kerbs clear of the pickup stops and the workshop.
  const challenges = placeChallenges(
    zone,
    roads,
    CHALLENGES,
    [...spots, ...(workshop ? [workshop] : [])],
    (x, y) => obstacles.collide(x, y, 1.2).hit,
  );
  // REAL-5: kept clear of every stop, so nobody waits (or finishes a challenge) beside a hole.
  const potholes = new Potholes(zone.potholes, [
    ...spots.map((s) => ({ x: s.stopX, y: s.stopY })),
    ...(workshop ? [{ x: workshop.stopX, y: workshop.stopY }] : []),
    ...challenges.flatMap((c) => [
      { x: c.start.stopX, y: c.start.stopY },
      { x: c.finish.stopX, y: c.finish.stopY },
    ]),
  ]);

  const start = startPose(zone, roads);
  const player = createVehicle(start.x, start.y, start.h);
  const sound = createSound();
  sound.muted = !settings.sound;
  const dialogs = createDialogs($('dialog'), $('toasts'));
  const tracker = createTracker($('tracker'));
  const pauseEl = $('pause');
  const titleEl = $('title');
  const settingsEl = $('settings');
  const fullMapEl = $('fullmap');
  let started = false;
  /** The world stands still on the title screen, while a card is open, and while paused. */
  const paused = () => !started || dialogs.open || !pauseEl.hidden || !settingsEl.hidden || !fullMapEl.hidden;

  const scene = createScene(
    $<HTMLCanvasElement>('gl'),
    zone,
    roads,
    { kiosks, trees, islands, wardens, npcs, signPosts, potholes: potholes.list, terrain },
    { detail: quality, reducedMotion },
    rand,
  );
  const minimap = createMinimap($<HTMLCanvasElement>('minimap'), $('north'), zone, islands);
  // NAV-5 and CORE-4: where passengers wait, where the rider is going, and Baba's places still to find.
  const liveMarks = (): MapMark[] => {
    const marks: MapMark[] = ride.offers.map((o) => {
      const s = spots[o.spot]!;
      return { kind: 'pax', x: s.kerbX, y: s.kerbY, label: `${o.pax.name} at ${s.name}` };
    });
    const t = ride.trip;
    if (t) {
      const s = spots[t.toSpot]!;
      marks.push({ kind: 'drop', x: s.stopX, y: s.stopY, label: s.name });
    }
    zone.notebook.forEach((n, i) => {
      if (!ride.state.pages[i]) marks.push({ kind: 'notebook', x: n.x, y: n.y, label: n.name });
    });
    // Oga Lati's, held on the minimap's rim once the keke needs him (DMG-4).
    // TIME-1: challenge boards, until a run starts.
    if (!ride.run)
      for (const c of challenges)
        marks.push({ kind: 'challenge', x: c.start.kerbX, y: c.start.kerbY, label: `${c.from} to ${c.to}` });
    if (workshop)
      marks.push({
        kind: 'repair',
        x: workshop.kerbX,
        y: workshop.kerbY,
        label: WORKSHOP_NAME,
        rim: ride.state.damage > 50,
      });
    return marks;
  };
  const fullMap = createFullMap(fullMapEl, {
    zone,
    islands,
    player: () => player,
    marks: () => [
      ...zone.spots.map((s): MapMark => ({ kind: 'place', x: s.x, y: s.y, label: s.name })),
      ...liveMarks(),
    ],
  });
  window.addEventListener('resize', () => scene.resize());
  const markers = createMarkers(scene.three, scene.keke, terrain);
  const flashEl = $('flash');
  markers.setWorkshop(workshop);
  markers.setChallenges(challenges.map((c) => c.start));

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
    workshop,
    challenges,
    flash: () => {
      sound.shutter();
      // A paper-coloured flash; softer and shorter with reduced motion (DESIGN A-7).
      flashEl.animate([{ opacity: reducedMotion() ? 0.4 : 0.9 }, { opacity: 0 }], {
        duration: reducedMotion() ? 250 : 600,
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
    // ACC-2 text size and reduced motion, as attributes the stylesheet reads.
    document.documentElement.dataset.textSize = settings.textSize;
    document.documentElement.toggleAttribute('data-reduce-motion', reducedMotion());
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
    reducedMotion,
    restart: () => location.reload(),
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
    grade: (x: number, y: number, h: number) => terrain.grade(x, y, h),
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
  const credits = createCredits($('credits'), __APP_VERSION__);
  $('titleCredits').addEventListener('click', () => credits.show());
  const openMap = () => {
    if (!started || paused()) return;
    swipe.cancel();
    input.gas = input.brake = input.left = input.right = 0;
    fullMap.show();
  };
  $('mapBtn').addEventListener('click', openMap);
  $('fullMapBtn').addEventListener('click', () => {
    pauseEl.hidden = true;
    fullMap.show(() => {
      pauseEl.hidden = false;
      $('resumeBtn').focus({ preventScroll: true });
    });
  });
  $('restartBtn').addEventListener('click', () => {
    pauseEl.hidden = true;
    const s = startPose(zone, roads);
    Object.assign(player, { x: s.x, y: s.y, h: s.h, v: 0 });
    ride.restart();
  });
  $('photoBtn').addEventListener('click', () => ride.takePhoto());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && settingsPanel.open) return settingsPanel.close();
    if (fullMap.open) {
      if (e.code === 'KeyM') fullMap.close();
      return;
    }
    if (!started) return;
    if (e.code === 'KeyM' && !e.repeat) return openMap();
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
  // ACC-2: at larger text sizes, later elements move down clear of Today's page.
  const hudStack = [$('tracker'), $('mapBtn'), wardenEl, streetEl];
  let last = performance.now();
  let hudTimer = 0;
  let lastBump = 0;
  let time = 0;
  let wasOnRoad = true;
  const dmgEl = $('dmg');
  const dmgFill = $('dmgFill');
  const dmgPct = $('dmgPct');
  /** A broken-down keke, or one held for a challenge countdown, won't go whatever the controls say. */
  const stalled = { gas: 0, brake: 0, left: 0, right: 0 };

  const frame = (now: number) => {
    // The simulation step is capped so a slow frame can't tunnel through walls; the HUD uses real time.
    const realDt = (now - last) / 1000;
    const dt = Math.min(0.05, realDt);
    last = now;
    time += dt;
    if (!paused()) {
      const step = stepVehicle(player, ride.held ? stalled : input, dt, env, ride.wear);
      if (step.impact > 2.2 && time - lastBump > 0.45) {
        lastBump = time;
        sound.thud();
        scene.bump(step.impact);
        ride.bump(step.impact);
      }
      if (wasOnRoad && !step.onRoad) ride.kerb(Math.abs(player.v));
      const hole = potholes.step(player.x, player.y, Math.abs(player.v));
      if (hole) {
        player.v *= hole.slow;
        sound.thud();
        scene.bump(hole.jolt * 0.6);
        ride.pothole(hole);
      }
      wasOnRoad = step.onRoad;
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
    minimap.draw(player, wardens, dt, liveMarks());
    hudTimer -= realDt;
    if (hudTimer <= 0) {
      hudTimer = 0.2;
      speedEl.textContent = `${Math.round(Math.abs(player.v) * 3.6)}`;
      const dmg = Math.round(ride.state.damage);
      dmgPct.textContent = `${dmg}%`;
      dmgFill.style.transform = `scaleX(${dmg / 100})`;
      dmgEl.classList.toggle('hi', dmg > 50);
      dmgEl.setAttribute('aria-valuenow', `${dmg}`);
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
      stackHud(hudStack);
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
    potholes: potholes.list,
    groundAt: (x: number, y: number) => terrain.heightAt(x, y),
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
      get damage() {
        return ride.state.damage;
      },
      workshop: workshop && { stopX: workshop.stopX, stopY: workshop.stopY },
      challenges: challenges.map((c) => ({
        id: c.id,
        startX: c.start.stopX,
        startY: c.start.stopY,
        finishX: c.finish.stopX,
        finishY: c.finish.stopY,
      })),
      get run() {
        return ride.run;
      },
      get best() {
        return { ...ride.state.best };
      },
      setDamage(n: number) {
        ride.state.damage = Math.min(100, Math.max(0, n));
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
