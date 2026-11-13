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
export const SCHEMA_VERSION = 2;

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
      if (rec && typeof rec === 'object' && rec.schemaVersion === SCHEMA_VERSION) {
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
