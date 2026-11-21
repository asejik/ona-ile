/**
 * The ride loop (CORE-1) as pure logic, ported from prototype v0.1, plus the second playtest's
 * CORE-4: a waiting passenger is always close by.
 */
import { PASSENGERS, type Passenger } from '../story/content';
import type { RoadNetwork } from '../world/roads';
import { routeTree, type RouteTree } from '../world/routing';
import type { Spot } from '../world/spots';

export interface GameState {
  /** Naira earned, whole naira. */
  money: number;
  /** 0–100. */
  respect: number;
  /** Notebook pages restored, one flag per notebook place. */
  pages: boolean[];
  rides: number;
  /** Keke damage, 0–100 to one decimal (DMG-1). 100 means broken down. */
  damage: number;
  /** Best timed-challenge times in seconds, to tenths, by challenge id (TIME-1). */
  best: Record<string, number>;
  stageDone: boolean;
  introDone: boolean;
  bisiDone: boolean;
}

export function newGame(pageCount: number): GameState {
  return {
    money: 0,
    respect: 30,
    pages: Array.from({ length: pageCount }, () => false),
    rides: 0,
    damage: 0,
    best: {},
    stageDone: false,
    introDone: false,
    bisiDone: false,
  };
}

export function addRespect(s: GameState, delta: number): number {
  const before = s.respect;
  s.respect = Math.min(100, Math.max(0, s.respect + delta));
  return s.respect - before;
}

/** Fare for a road distance in metres: ₦200 plus ₦0.50 a metre, rounded to ₦50. */
export function farePrice(d: number): number {
  return Math.round((200 + d * 0.5) / 50) * 50;
}

/** What Ayo asks for when haggling: 30% more, rounded to ₦50. */
export function askPrice(fare: number): number {
  return Math.round((fare * 1.3) / 50) * 50;
}

/** Chance a passenger accepts the higher price: 30%, plus more with Respect. */
export function haggleChance(respect: number): number {
  return 0.3 + respect / 180;
}

/** Seconds allowed for a trip of d metres by road. */
export function tripLimit(d: number): number {
  return d / 6.2 + 22;
}

export interface Offer {
  spot: number;
  pax: Passenger;
  /** "Not now" was chosen: don't ask again until the keke has driven away. */
  blocked: boolean;
}

/** Waiting passengers further than this (straight line) don't count as "close by" (CORE-4). */
export const NEAR_M = 250;
/** Offers never spawn right under the keke. */
const MIN_SPAWN_M = 70;
export const MAX_OFFERS = 3;

/**
 * Tops up the waiting passengers to MAX_OFFERS and guarantees one within NEAR_M (CORE-4).
 * Returns the offers that were added.
 */
export function refillOffers(
  offers: Offer[],
  spots: Spot[],
  player: { x: number; y: number },
  state: GameState,
  busySpots: number[],
  rand: () => number,
): Offer[] {
  const added: Offer[] = [];
  const dist = (i: number) => Math.hypot(spots[i]!.stopX - player.x, spots[i]!.stopY - player.y);
  const free = () => {
    const used = new Set([...offers.map((o) => o.spot), ...busySpots]);
    return spots.map((_, i) => i).filter((i) => !used.has(i) && dist(i) > MIN_SPAWN_M);
  };
  const freePax = () => {
    const used = new Set(offers.map((o) => o.pax.id));
    return PASSENGERS.filter((p) => !used.has(p.id) && !(p.special === 'bisi' && state.bisiDone));
  };
  const add = (spot: number) => {
    const pax = freePax();
    if (!pax.length) return false;
    const o: Offer = { spot, pax: pax[Math.floor(rand() * pax.length)]!, blocked: false };
    offers.push(o);
    added.push(o);
    return true;
  };

  // CORE-4: if nobody is waiting close by, swap the furthest offer for a close one.
  if (!offers.some((o) => dist(o.spot) <= NEAR_M)) {
    const near = free().filter((i) => dist(i) <= NEAR_M);
    if (near.length) {
      if (offers.length >= MAX_OFFERS) {
        offers.sort((a, b) => dist(a.spot) - dist(b.spot));
        offers.pop();
      }
      add(near[Math.floor(rand() * near.length)]!);
    }
  }
  while (offers.length < MAX_OFFERS) {
    const c = free();
    if (!c.length || !add(c[Math.floor(rand() * c.length)]!)) break;
  }
  return added;
}

export interface Destination {
  spot: number;
  tree: RouteTree;
  /** Road distance in metres. */
  d: number;
}

/** A destination 250–1100 m away by road, else anything over 150 m. Null if none can be reached. */
export function chooseDestination(
  roads: RoadNetwork,
  spots: Spot[],
  from: number,
  avoid: number[],
  rand: () => number,
): Destination | null {
  const options = spots.map((_, i) => i).filter((i) => i !== from && !avoid.includes(i));
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  let fallback: Destination | null = null;
  for (const i of options) {
    const tree = routeTree(roads, spots[i]!.node);
    const d = tree.dist[spots[from]!.node]!;
    if (!Number.isFinite(d)) continue;
    if (d > 250 && d < 1100) return { spot: i, tree, d };
    if (!fallback && d > 150) fallback = { spot: i, tree, d };
  }
  return fallback;
}

export interface Trip {
  pax: Passenger;
  fromSpot: number;
  toSpot: number;
  tree: RouteTree;
  fare: number;
  /** Seconds allowed. */
  limit: number;
  /** Seconds elapsed. */
  t: number;
  /** 0–100. */
  comfort: number;
  chatAt: number;
  chatted: number;
}

export function startTrip(
  pax: Passenger,
  fromSpot: number,
  dest: Destination,
  fare: number,
  rand: () => number,
): Trip {
  return {
    pax,
    fromSpot,
    toSpot: dest.spot,
    tree: dest.tree,
    fare,
    limit: tripLimit(dest.d),
    t: 0,
    comfort: 100,
    chatAt: 9 + rand() * 6,
    chatted: 0,
  };
}

/** Advances a trip. Returns true when the passenger has something to say. */
export function stepTrip(
  trip: Trip,
  dt: number,
  onRoad: boolean,
  speed: number,
  rand: () => number,
): boolean {
  trip.t += dt;
  if (!onRoad && speed > 3) trip.comfort -= 2.5 * dt;
  if (trip.t > trip.chatAt && trip.chatted < 2) {
    trip.chatted++;
    trip.chatAt += 14 + rand() * 8;
    return true;
  }
  return false;
}

/** A bump costs comfort. Returns true when it was hard enough for the passenger to complain. */
export function bumpComfort(trip: Trip, impact: number): boolean {
  trip.comfort -= Math.min(30, impact * 4.5);
  return impact > 4.5;
}

/** Comfort as a word, so the bar never relies on colour alone (DESIGN A-9). */
export function comfortWord(comfort: number): 'Smooth' | 'Bumpy' | 'Rough' {
  return comfort >= 70 ? 'Smooth' : comfort >= 40 ? 'Bumpy' : 'Rough';
}

export interface TripResult {
  onTime: boolean;
  stars: 1 | 2 | 3 | 4 | 5;
  base: number;
  bonus: number;
  tip: number;
  total: number;
  respect: number;
  mood: 'good' | 'ok' | 'bad' | 'late';
}

export function scoreTrip(trip: Trip, rand: () => number): TripResult {
  const onTime = trip.t <= trip.limit;
  const comfort = Math.min(100, Math.max(0, trip.comfort));
  const score = comfort * 0.7 + (onTime ? 30 : 8);
  const stars = Math.min(5, Math.max(1, Math.round(score / 20))) as TripResult['stars'];
  const base = onTime ? trip.fare : Math.round((trip.fare * 0.8) / 10) * 10;
  const bonus = onTime ? Math.round((trip.fare * 0.15) / 10) * 10 : 0;
  const tip = stars >= 4 ? (stars - 3) * 60 + Math.round(rand() * 4) * 10 : 0;
  const respect = [-3, -1, 1, 3, 5][stars - 1]!;
  const mood = !onTime ? 'late' : stars >= 4 ? 'good' : stars <= 2 ? 'bad' : 'ok';
  return { onTime, stars, base, bonus, tip, total: base + bonus + tip, respect, mood };
}
