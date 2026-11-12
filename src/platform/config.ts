import { readJson, writeJson, type KeyValueStore } from './storage';

/**
 * Remote switches served next to the game as config.json (PRIV-11).
 * Flipping a value there turns a feature off on the next launch, without a new release.
 */
export interface RemoteConfig {
  crashReports: boolean;
  analytics: boolean;
  /** Oldest game version that should keep running, or "" for no minimum. */
  minVersion: string;
}

/** Used until a config has been fetched at least once. Diagnostics fail closed. */
export const SAFE_CONFIG: RemoteConfig = { crashReports: false, analytics: false, minVersion: '' };

const CACHE_KEY = 'onaile.config.v1';
const TIMEOUT_MS = 3000;

/** Anything that isn't exactly `true` counts as off. */
export function parseConfig(data: unknown): RemoteConfig {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  return {
    crashReports: d.crashReports === true,
    analytics: d.analytics === true,
    minVersion: typeof d.minVersion === 'string' ? d.minVersion : '',
  };
}

type Fetcher = (url: string, init: { cache: 'no-store'; signal: AbortSignal }) => Promise<Response>;

/** Fetches config.json; falls back to the last good copy, then to SAFE_CONFIG. Never throws. */
export async function loadConfig(url: string, store: KeyValueStore, fetcher: Fetcher): Promise<RemoteConfig> {
  try {
    const res = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const config = parseConfig(await res.json());
    writeJson(store, CACHE_KEY, config);
    return config;
  } catch {
    const cached = readJson(store, CACHE_KEY);
    return cached === null ? SAFE_CONFIG : parseConfig(cached);
  }
}
