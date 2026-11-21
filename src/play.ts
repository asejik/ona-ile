/**
 * The Prologue's ride loop, wiring the pure logic (sim/) to the screens (ui/) and markers (render/).
 * Ported from prototype v0.1's section 6, with CORE-4, CORE-5 and HUD-1 built in.
 */
import type { Markers } from './render/markers';
import {
  BROKEN,
  TOW_FEE,
  addDamage,
  handling,
  impactDamage,
  kerbDamage,
  repairCost,
  repairQuote,
} from './sim/damage';
import {
  addRespect,
  askPrice,
  bumpComfort,
  chooseDestination,
  farePrice,
  haggleChance,
  newGame,
  refillOffers,
  scoreTrip,
  startTrip,
  stepTrip,
  type GameState,
  type Offer,
  type Trip,
} from './sim/rides';
import {
  FINE,
  FINE_RESPECT,
  HONK_RESPECT,
  PRAISE_RESPECT,
  honkAtWardens,
  type Warden,
  type WardenEvent,
} from './sim/wardens';
import type { SaveStore } from './platform/save';
import type { PotholeHit } from './sim/potholes';
import type { Wear } from './sim/vehicle';
import {
  BREAKDOWN,
  INTRO,
  LATI,
  LINES,
  PROLOGUE_GOAL,
  STAGE_DONE,
  CAST,
  PASSENGERS,
  naira,
  passengerWho,
  pick,
  type Passenger,
} from './story/content';
import type { Sound } from './ui/audio';
import type { DialogButton, Dialogs } from './ui/dialog';
import type { TrackerState } from './ui/tracker';
import type { RoadNetwork } from './world/roads';
import { routeFrom, type Route } from './world/routing';
import { atSpot, type Spot } from './world/spots';
import type { Zone } from './world/zone';

/** Photos can be taken within this distance of a notebook place. */
const PHOTO_M = 26;

export interface RideLoop {
  readonly state: GameState;
  readonly trip: Trip | null;
  readonly offers: Offer[];
  /** Index of the notebook place in photo range, or null. */
  readonly photoTarget: number | null;
  /** How the keke drives at its current damage (DMG-3). */
  readonly wear: Wear;
  /** True when the keke has broken down and won't go (DMG-3). */
  readonly broken: boolean;
  begin(fresh: boolean): void;
  update(dt: number, player: { x: number; y: number; h: number; v: number }, onRoad: boolean): void;
  /** A collision at `impact` m/s: the passenger's comfort and the keke's damage (DMG-1). */
  bump(impact: number): void;
  /** The keke left the road at `speed` m/s and knocked the kerb. */
  kerb(speed: number): void;
  /** The keke dropped into a pothole (REAL-5). */
  pothole(hit: PotholeHit): void;
  honk(player: { x: number; y: number }): void;
  wardenEvents(events: WardenEvent[]): void;
  takePhoto(): void;
  restart(): void;
  /** Replaces the game with one from a save code. */
  load(next: GameState): void;
  tracker(player: { x: number; y: number }): TrackerState;
}

export interface RideDeps {
  zone: Zone;
  roads: RoadNetwork;
  spots: Spot[];
  saves: SaveStore;
  dialogs: Dialogs;
  markers: Markers;
  sound: Sound;
  wardens: Warden[];
  rand: () => number;
  /** Called when a payout or flash should play (e.g. the photo flash). */
  flash: () => void;
  /** Oga Lati's workshop stop (DMG-4), or null if the zone has no room for one. */
  workshop: Spot | null;
}

export function createRideLoop(d: RideDeps): RideLoop {
  const pages = d.zone.notebook.length;
  let state: GameState = d.saves.load() ?? newGame(pages);
  let trip: Trip | null = null;
  let offers: Offer[] = [];
  let route: Route | null = null;
  let routeTimer = 0;
  let photoTarget: number | null = null;
  /** Set once the repair card has shown, cleared once the keke drives away from the workshop. */
  let workshopBlocked = false;
  const who = (p: Passenger) => passengerWho(p, PASSENGERS.indexOf(p));
  const save = () => d.saves.save(state);

  const syncWaiting = () =>
    d.markers.setWaiting(
      offers.map((o) => ({
        id: o.pax.id,
        spot: d.spots[o.spot]!,
        cloth: o.pax.cloth,
        ...(o.pax.cap ? { cap: o.pax.cap } : {}),
      })),
    );
  const syncNotebook = () =>
    d.markers.setNotebook(
      d.zone.notebook.map((p, i) => ({ x: p.x, y: p.y, found: state.pages[i] === true })),
    );

  const removeOffer = (o: Offer) => {
    offers = offers.filter((x) => x !== o);
    syncWaiting();
  };

  const respect = (delta: number) => addRespect(state, delta);

  const openPickup = (o: Offer) => {
    const dest = chooseDestination(
      d.roads,
      d.spots,
      o.spot,
      offers.map((x) => x.spot),
      d.rand,
    );
    if (!dest) {
      o.blocked = true;
      return;
    }
    const fare = farePrice(dest.d);
    const ask = askPrice(fare);
    const destName = d.spots[dest.spot]!.name;
    d.dialogs.show({
      who: who(o.pax),
      text: pick(LINES.pickup, d.rand).replace('{d}', destName),
      rows: [
        { label: 'Destination', value: destName },
        { label: 'Distance by road', value: `${Math.round(dest.d)} m` },
        { label: 'Fare offered', value: naira(fare) },
      ],
      buttons: [
        { label: `Accept ${naira(fare)}`, onClick: () => begin(o, dest, fare) },
        {
          label: `Ask for ${naira(ask)}`,
          kind: 'outline',
          onClick: () => {
            if (d.rand() < haggleChance(state.respect)) {
              d.dialogs.toast(pick(LINES.haggleYes, d.rand), 'good', 2600, o.pax.name);
              begin(o, dest, ask);
            } else {
              d.dialogs.toast(pick(LINES.haggleNo, d.rand), 'bad', 2600, o.pax.name);
              respect(-1);
              removeOffer(o);
              save();
            }
          },
        },
        { label: 'Not now', kind: 'outline', onClick: () => (o.blocked = true) },
      ],
    });
  };

  const begin = (o: Offer, dest: NonNullable<ReturnType<typeof chooseDestination>>, fare: number) => {
    removeOffer(o);
    trip = startTrip(o.pax, o.spot, dest, fare, d.rand);
    route = null;
    routeTimer = 0;
    d.markers.setRider({ cloth: o.pax.cloth, ...(o.pax.cap ? { cap: o.pax.cap } : {}) });
    d.markers.setDestination(d.spots[dest.spot]!);
    d.sound.coin();
  };

  const endTrip = () => {
    const t = trip!;
    const r = scoreTrip(t, d.rand);
    state.money += r.total;
    state.rides++;
    respect(r.respect);
    trip = null;
    route = null;
    d.markers.setRider(null);
    d.markers.setDestination(null);
    d.markers.setArrowTarget(null);
    d.sound.coin();
    save();
    const line =
      r.mood === 'late'
        ? pick(LINES.lateEnd, d.rand)
        : r.mood === 'good'
          ? pick(LINES.goodEnd, d.rand)
          : r.mood === 'bad'
            ? pick(LINES.badEnd, d.rand)
            : LINES.okEnd[0]!;
    d.dialogs.show({
      who: who(t.pax),
      text: line,
      stars: r.stars,
      rows: [
        { label: r.onTime ? 'Fare' : 'Fare (late, 20% off)', value: naira(r.base) },
        { label: 'On-time bonus', value: naira(r.bonus) },
        { label: 'Tip', value: naira(r.tip) },
        { label: 'Respect', value: `${r.respect > 0 ? '+' : ''}${r.respect}` },
        { label: 'You earned', value: naira(r.total), total: true },
      ],
      buttons: [{ label: 'Find the next passenger', onClick: checkStage }],
    });
  };

  const checkStage = () => {
    if (state.stageDone || state.money < PROLOGUE_GOAL) return;
    state.stageDone = true;
    save();
    d.dialogs.chain(STAGE_DONE, () =>
      d.dialogs.show({
        who: {
          name: 'Prologue complete',
          role: 'Post Office and Unity Road',
          colour: '#1F6B45',
          initial: '★',
        },
        text: "Mama's medicine is paid for. You can keep driving to earn more and find Baba's places.",
        buttons: [
          { label: 'Keep driving' },
          { label: 'Restart prologue', kind: 'outline', onClick: () => loop.restart() },
        ],
      }),
    );
  };

  /** Drops any ride in progress and starts from the given game. */
  const replace = (next: GameState) => {
    offers = [];
    trip = null;
    route = null;
    syncWaiting();
    d.markers.setRider(null);
    d.markers.setDestination(null);
    d.markers.setArrowTarget(null);
    state = next;
    save();
    syncNotebook();
  };

  const damage = (amount: number) => {
    if (amount <= 0) return;
    const before = state.damage;
    state.damage = addDamage(state.damage, amount);
    if (Math.floor(before / 10) !== Math.floor(state.damage / 10)) save();
  };

  /** Oga Lati's card: his diagnosis, the price, and what the player's money can buy (DMG-4). */
  const openRepair = () => {
    // Shown once per visit: it opens again only after the keke has driven away.
    workshopBlocked = true;
    const dmg = state.damage;
    const broken = dmg >= BROKEN;
    const q = repairQuote(dmg, state.money);
    const band = dmg < 25 ? LATI.light : dmg < 60 ? LATI.medium : LATI.heavy;
    const apply = (line: string) => {
      state.money -= q.cost;
      state.damage = q.after;
      save();
      if (q.cost > 0) d.sound.coin();
      d.dialogs.toast(line, 'good', 3600, CAST.lati.name);
    };
    const buttons: DialogButton[] = [];
    let text = pick(band, d.rand);
    if (q.full)
      buttons.push({ label: `Repair ${naira(q.cost)}`, onClick: () => apply(pick(LATI.done, d.rand)) });
    else if (q.cost > 0)
      buttons.push({ label: `Fix ${naira(q.cost)} worth`, onClick: () => apply(LATI.partial) });
    else if (broken) buttons.push({ label: 'Patch it up', onClick: () => apply(LATI.patch) });
    else text = LATI.broke;
    if (!broken) buttons.push({ label: 'Not now', kind: 'outline' });
    d.dialogs.show({
      who: CAST.lati,
      text,
      rows: [
        { label: 'Damage', value: `${Math.round(dmg)}%` },
        { label: 'Full repair', value: naira(repairCost(dmg)) },
        { label: 'You have', value: naira(state.money) },
      ],
      buttons,
    });
  };

  /** DMG-3: the keke has died. Any passenger leaves, and Oga Lati's boys tow it to his workshop. */
  const breakDown = (player: { x: number; y: number; h: number; v: number }) => {
    player.v = 0;
    if (trip) {
      const t = trip;
      trip = null;
      route = null;
      d.markers.setRider(null);
      d.markers.setDestination(null);
      d.markers.setArrowTarget(null);
      respect(-2);
      d.dialogs.toast(pick(BREAKDOWN.pax, d.rand), 'bad', 3600, t.pax.name);
    }
    const fee = Math.min(TOW_FEE, state.money);
    save();
    d.dialogs.show({
      who: CAST.lati,
      text: LATI.tow,
      rows: [{ label: 'Tow fee', value: naira(fee) }],
      buttons: [
        {
          label: d.workshop ? "Tow it to Oga Lati's" : 'Call Oga Lati',
          onClick: () => {
            state.money -= fee;
            const w = d.workshop;
            if (w) Object.assign(player, { x: w.stopX, y: w.stopY, h: w.heading, v: 0 });
            openRepair();
          },
        },
      ],
    });
  };

  const loop: RideLoop = {
    get state() {
      return state;
    },
    get trip() {
      return trip;
    },
    get offers() {
      return offers;
    },
    get photoTarget() {
      return photoTarget;
    },
    get wear() {
      return handling(state.damage);
    },
    get broken() {
      return state.damage >= BROKEN;
    },
    begin(fresh) {
      if (fresh) {
        state = newGame(pages);
        save();
      }
      syncNotebook();
      if (!state.introDone) {
        d.dialogs.chain(INTRO, () => {
          state.introDone = true;
          save();
          d.dialogs.toast(
            'Passengers wait at the roadside under a ₦ sign. Stop beside them to pick them up.',
            '',
            4200,
          );
        });
      } else d.dialogs.toast('Welcome back. Mama is still waiting for that medicine money.');
    },
    update(dt, player, onRoad) {
      if (state.damage >= BROKEN) {
        if (!d.dialogs.open) breakDown(player);
        return;
      }
      const speed = Math.abs(player.v);
      const w = d.workshop;
      if (w) {
        if (workshopBlocked && Math.hypot(player.x - w.stopX, player.y - w.stopY) > 11)
          workshopBlocked = false;
        if (!trip && !workshopBlocked && state.damage >= 1 && atSpot(w, player.x, player.y, speed)) {
          player.v = 0;
          openRepair();
          return;
        }
      }
      if (trip) {
        if (stepTrip(trip, dt, onRoad, speed, d.rand)) {
          if (trip.pax.special === 'bisi' && trip.chatted === 1 && !state.bisiDone) {
            d.dialogs.toast(LINES.bisi, 'good', 5200, 'Mama Bisi');
            state.bisiDone = true;
            respect(3);
          } else d.dialogs.toast(pick(LINES.chatter, d.rand), '', 3600, trip.pax.name);
        }
        routeTimer -= dt;
        if (routeTimer <= 0 || !route) {
          route = routeFrom(trip.tree, d.roads, d.zone.nodes, player.x, player.y);
          routeTimer = 0.25;
        }
        d.markers.setArrowTarget(pointAlong(route, 18));
        if (atSpot(d.spots[trip.toSpot]!, player.x, player.y, speed)) {
          player.v = 0;
          endTrip();
        }
      } else {
        // CORE-4: keep passengers waiting, one of them close by. A new one appears straight after a drop-off.
        if (refillOffers(offers, d.spots, player, state, [], d.rand).length) syncWaiting();
        for (const o of offers) {
          const s = d.spots[o.spot]!;
          const dist = Math.hypot(player.x - s.stopX, player.y - s.stopY);
          if (o.blocked && dist > 11) o.blocked = false;
          if (!o.blocked && atSpot(s, player.x, player.y, speed)) {
            player.v = 0;
            openPickup(o);
            break;
          }
        }
      }
      photoTarget = null;
      d.zone.notebook.forEach((p, i) => {
        if (photoTarget === null && !state.pages[i] && Math.hypot(player.x - p.x, player.y - p.y) < PHOTO_M)
          photoTarget = i;
      });
    },
    bump(impact) {
      damage(impactDamage(impact));
      if (trip && bumpComfort(trip, impact))
        d.dialogs.toast(pick(LINES.bump, d.rand), 'bad', 2200, trip.pax.name);
    },
    kerb(speed) {
      damage(kerbDamage(speed));
    },
    pothole(hit) {
      damage(hit.wear);
      if (trip && bumpComfort(trip, hit.jolt))
        d.dialogs.toast(pick(LINES.pothole, d.rand), 'bad', 2200, trip.pax.name);
    },
    honk(player) {
      d.sound.horn();
      loop.wardenEvents(honkAtWardens(d.wardens, player));
    },
    wardenEvents(events) {
      for (const e of events) {
        const w = e.warden;
        if (e.kind === 'fine') {
          const fine = Math.min(FINE, state.money);
          state.money -= fine;
          respect(FINE_RESPECT);
          d.sound.whistle(0.08);
          d.dialogs.toast(
            `${w.lines.fine} Fine ${naira(fine)} · Respect ${FINE_RESPECT}`,
            'bad',
            3600,
            w.name,
          );
        } else if (e.kind === 'praise') {
          respect(PRAISE_RESPECT);
          d.dialogs.toast(`${w.lines.nod} Respect +${PRAISE_RESPECT}`, 'good', 3000, w.name);
        } else {
          respect(HONK_RESPECT);
          d.dialogs.toast(`${w.lines.honk} Respect ${HONK_RESPECT}`, 'bad', 2600, w.name);
        }
      }
      if (events.length) save();
    },
    takePhoto() {
      if (photoTarget === null || d.dialogs.open) return;
      const i = photoTarget;
      const place = d.zone.notebook[i]!;
      state.pages[i] = true;
      save();
      syncNotebook();
      d.flash();
      const found = state.pages.filter(Boolean).length;
      d.dialogs.show({
        who: CAST.baba,
        text: place.note,
        note: `Notebook page restored: ${place.name} · ${found} of ${pages}`,
        buttons: [{ label: 'Keep driving' }],
      });
    },
    restart() {
      replace({ ...newGame(pages), introDone: true });
      d.dialogs.toast('Prologue restarted. Look for passengers with the ₦ sign.');
    },
    load(next) {
      replace(next);
      d.dialogs.toast('Save code loaded. Welcome back.', 'good');
    },
    tracker(player) {
      let ride: TrackerState['ride'];
      if (trip) {
        ride = {
          kind: 'ride',
          pax: trip.pax.name,
          dest: d.spots[trip.toSpot]!.name,
          metres: route?.len ?? 0,
          secondsLeft: trip.limit - trip.t,
          comfort: trip.comfort,
        };
      } else {
        let nearest: number | null = null;
        for (const o of offers) {
          const s = d.spots[o.spot]!;
          const dist = Math.hypot(player.x - s.stopX, player.y - s.stopY);
          if (nearest === null || dist < nearest) nearest = dist;
        }
        ride = { kind: 'find', nearestM: nearest };
      }
      return {
        ride,
        money: state.money,
        goal: PROLOGUE_GOAL,
        pagesFound: state.pages.filter(Boolean).length,
        pagesTotal: pages,
        respect: state.respect,
      };
    },
  };
  return loop;
}

/** The point `dist` metres along a route (for the guidance arrow). */
function pointAlong(route: Route, dist: number): { x: number; y: number } {
  const pts = route.pts;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]!;
    const [bx, by] = pts[i]!;
    const seg = Math.hypot(bx - ax, by - ay);
    if (acc + seg >= dist) {
      const k = (dist - acc) / seg;
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k };
    }
    acc += seg;
  }
  const last = pts[pts.length - 1]!;
  return { x: last[0], y: last[1] };
}
