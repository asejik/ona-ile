/**
 * Game saves (SYS-1). One versioned record on the device, behind a small interface so the backend can
 * change (IndexedDB, Capacitor Preferences) without touching the game.
 *
 * Today the backend is Web Storage, which works the same in browsers and in the Android app's WebView.
 * Holds game progress only: no personal data (DATA_INVENTORY §1).
 */
import { newGame, type GameState } from '../sim/rides';
import { readJson, writeJson, type KeyValueStore } from './storage';

export const SAVE_KEY = 'onaile.save.v2';
/** Prototype v0.1's key. Read once, migrated, then removed. */
export const LEGACY_KEY = 'babaKeke.v1';
export const SCHEMA_VERSION = 3;
/** Version 2 had no damage; its saves load as an undamaged keke. */
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
    stageDone: r.stageDone === true,
    introDone: r.introDone === true,
    bisiDone: r.bisiDone === true,
  };
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
 * "ONA-3-1JK-32-4-3-7-0-0F3A". Fields are base 36: version, money, respect, rides, notebook pages as
 * bits, story flags as bits, damage in whole percent, then a checksum that catches typos (it is not a
 * lock; repairState clamps values). Version 2 codes, without damage, still load.
 */
const CODE_PREFIX = 'ona';
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
  const body = [SCHEMA_VERSION, s.money, s.respect, s.rides, pages, flags, Math.round(s.damage)]
    .map((n) => n.toString(36))
    .join('-');
  return `${CODE_PREFIX}-${body}-${checksum(body)}`.toUpperCase();
}

/** The game in a save code, or null if the code is mistyped or not one of ours. */
export function decodeSaveCode(code: string, pageCount: number): GameState | null {
  const parts = code.trim().toLowerCase().replace(/\s+/g, '').split('-');
  if (parts[0] !== CODE_PREFIX) return null;
  // Version 2 codes have six fields, version 3 adds damage.
  const count = parts[1] === '2' ? 6 : 7;
  if (parts.length !== count + 2) return null;
  const fields = parts.slice(1, count + 1);
  if (checksum(fields.join('-')) !== parts[count + 1]) return null;
  if (!fields.every((f) => /^[0-9a-z]{1,8}$/.test(f))) return null;
  const [version, money, respect, rides, pages, flags, damage = 0] = fields.map((f) => parseInt(f, 36)) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number?,
  ];
  if (version !== (count === 6 ? 2 : SCHEMA_VERSION)) return null;
  const bit = (n: number, i: number) => Math.floor(n / 2 ** i) % 2 === 1;
  return repairState(
    {
      money,
      respect,
      rides,
      damage,
      pages: Array.from({ length: pageCount }, (_, i) => i < MAX_CODE_PAGES && bit(pages, i)),
      stageDone: bit(flags, 0),
      introDone: bit(flags, 1),
      bisiDone: bit(flags, 2),
    },
    pageCount,
  );
}
