/** The small part of Web Storage the platform code needs, so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** localStorage when it works, otherwise an in-memory store (private mode, blocked storage). */
export function browserStore(): KeyValueStore {
  try {
    const s = window.localStorage;
    s.setItem('onaile.probe', '1');
    s.removeItem('onaile.probe');
    return s;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}

export function readJson(store: KeyValueStore, key: string): unknown {
  try {
    const raw = store.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeJson(store: KeyValueStore, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the choice simply isn't remembered.
  }
}
