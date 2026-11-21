/**
 * Game saves (SYS-1). One versioned record on the device, behind a small interface so the backend can
 * change (IndexedDB, Capacitor Preferences) without touching the game.
 *
 * Today the backend is Web Storage, which works the same in browsers and in the Android app's WebView.
 * Holds game progress only: no personal data (DATA_INVENTORY §1).
 */
import { newGame, type GameState } from '../sim/rides';
import { CHALLENGES } from '../story/content';
import { readJson, writeJson, type KeyValueStore } from './storage';

export const SAVE_KEY = 'onaile.save.v2';
/** Prototype v0.1's key. Read once, migrated, then removed. */
export const LEGACY_KEY = 'babaKeke.v1';
export const SCHEMA_VERSION = 4;
/** Version 2 had no damage and version 3 no challenge times; their saves load with none. */
const OLDEST_VERSION = 2;

interface SaveRecord {
  schemaVersion: number;
  updatedAt: string;
  state: GameState;
}

/** Keeps only valid fields, so a damaged or tampered save can never break the game. */
export function repairState(raw: unknown, pageCount: number): GameState {
  const base = newGame(pageCount);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, lo: number, hi: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback;
  const pages = Array.isArray(r.pages) ? r.pages : [];
  return {
    money: num(r.money, 0, 10_000_000, base.money),
    respect: num(r.respect, 0, 100, base.respect),
    pages: base.pages.map((_, i) => pages[i] === true),
    rides: num(r.rides, 0, 1_000_000, 0),
    damage:
      typeof r.damage === 'number' && Number.isFinite(r.damage)
        ? Math.round(Math.min(100, Math.max(0, r.damage)) * 10) / 10
        : 0,
    best: repairBest(r.best),
    stageDone: r.stageDone === true,
    introDone: r.introDone === true,
    bisiDone: r.bisiDone === true,
  };
}

/** Challenge times: ids like "po-sadiku", seconds above 0 and under an hour, to tenths. */
function repairBest(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, t] of Object.entries(raw)) {
    if (/^[a-z0-9-]{1,24}$/.test(id) && typeof t === 'number' && Number.isFinite(t) && t > 0 && t < 3600)
      out[id] = Math.round(t * 10) / 10;
  }
  return out;
}

export interface SaveStore {
  /** The saved game, or null when there is none. */
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

export function createSaveStore(store: KeyValueStore, pageCount: number): SaveStore {
  return {
    load() {
      const rec = readJson(store, SAVE_KEY) as Partial<SaveRecord> | null;
      if (
        rec &&
        typeof rec === 'object' &&
        typeof rec.schemaVersion === 'number' &&
        rec.schemaVersion >= OLDEST_VERSION &&
        rec.schemaVersion <= SCHEMA_VERSION
      ) {
        return repairState(rec.state, pageCount);
      }
      // Migration from prototype v0.1 (same fields, no wrapper).
      const legacy = readJson(store, LEGACY_KEY);
      if (legacy && typeof legacy === 'object' && typeof (legacy as { money?: unknown }).money === 'number') {
        const state = repairState(legacy, pageCount);
        this.save(state);
        store.removeItem(LEGACY_KEY);
        return state;
      }
      return null;
    },
    save(state) {
      const rec: SaveRecord = { schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString(), state };
      writeJson(store, SAVE_KEY, rec);
    },
    clear() {
      store.removeItem(SAVE_KEY);
    },
  };
}

/*
 * Save code (SYS-1): the whole save as a short code the player can copy to another device, e.g.
 * "ONA-4-1JK-32-4-3-7-0-B-25.0.0-0F3A". Fields are base 36: version, money, respect, rides, notebook pages
 * as bits, story flags as bits, damage in whole percent, best challenge times in tenths of a second (one
 * per challenge, dot-separated, 0 for none), then a checksum that catches typos (it is not a lock;
 * repairState clamps values). Version 2 (no damage) and version 3 (no challenge times) codes still load.
 */
const CODE_PREFIX = 'ona';
/** How many fields each code version has, after the prefix and before the checksum. */
const FIELDS: Record<string, number> = { '2': 6, '3': 7, '4': 8 };
/** Pages are stored as bits of one number. */
const MAX_CODE_PAGES = 30;

function checksum(body: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 36 ** 4).toString(36).padStart(4, '0');
}

export function encodeSaveCode(s: GameState): string {
  const pages = s.pages.slice(0, MAX_CODE_PAGES).reduce((m, p, i) => m + (p ? 2 ** i : 0), 0);
  const flags = (s.stageDone ? 1 : 0) + (s.introDone ? 2 : 0) + (s.bisiDone ? 4 : 0);
  // Best times in tenths of a second, in CHALLENGES order, "0" for none, joined by dots.
  const best = CHALLENGES.map((c) => Math.round((s.best[c.id] ?? 0) * 10).toString(36)).join('.');
  const body = [
    ...[SCHEMA_VERSION, s.money, s.respect, s.rides, pages, flags, Math.round(s.damage)].map((n) =>
      n.toString(36),
    ),
    best,
  ].join('-');
  return `${CODE_PREFIX}-${body}-${checksum(body)}`.toUpperCase();
}

/** The game in a save code, or null if the code is mistyped or not one of ours. */
export function decodeSaveCode(code: string, pageCount: number): GameState | null {
  const parts = code.trim().toLowerCase().replace(/\s+/g, '').split('-');
  if (parts[0] !== CODE_PREFIX) return null;
  // Version 2 codes have six fields, version 3 adds damage, version 4 the challenge times.
  const count = FIELDS[parts[1] ?? ''];
  if (count === undefined || parts.length !== count + 2) return null;
  const fields = parts.slice(1, count + 1);
  if (checksum(fields.join('-')) !== parts[count + 1]) return null;
  const numbers = fields.slice(0, 7);
  if (!numbers.every((f) => /^[0-9a-z]{1,8}$/.test(f))) return null;
  const [, money, respect, rides, pages, flags, damage = 0] = numbers.map((f) => parseInt(f, 36)) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number?,
  ];
  const best: Record<string, number> = {};
  if (count === 8) {
    const times = fields[7]!.split('.');
    if (times.length !== CHALLENGES.length || !times.every((t) => /^[0-9a-z]{1,4}$/.test(t))) return null;
    CHALLENGES.forEach((c, i) => {
      const tenths = parseInt(times[i]!, 36);
      if (tenths > 0) best[c.id] = tenths / 10;
    });
  }
  const bit = (n: number, i: number) => Math.floor(n / 2 ** i) % 2 === 1;
  return repairState(
    {
      money,
      respect,
      rides,
      damage,
      best,
      pages: Array.from({ length: pageCount }, (_, i) => i < MAX_CODE_PAGES && bit(pages, i)),
      stageDone: bit(flags, 0),
      introDone: bit(flags, 1),
      bisiDone: bit(flags, 2),
    },
    pageCount,
  );
}
