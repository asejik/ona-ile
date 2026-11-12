import type { RemoteConfig } from './config';
import { readJson, writeJson, type KeyValueStore } from './storage';

/**
 * The player's diagnostics choice (PRIV-3). Stored on the device only.
 * Everything is off until the player confirms being 18 or older and opts in.
 */
export interface DiagnosticsConsent {
  /** Send crash reports (Sentry). */
  crash: boolean;
  /** Send anonymous play stats (Umami). */
  stats: boolean;
  /** When the choice was made, UTC ISO 8601. "" if never asked. */
  at: string;
  /** Version of the privacy notice the player saw. */
  noticeVersion: string;
  ageConfirmed18: boolean;
}

/** Bump when the privacy notice changes materially; the game then asks again. */
export const NOTICE_VERSION = '2026-11-draft';

const KEY = 'onaile.diagnostics.v1';

export const NO_CONSENT: DiagnosticsConsent = {
  crash: false,
  stats: false,
  at: '',
  noticeVersion: '',
  ageConfirmed18: false,
};

export function loadConsent(store: KeyValueStore): DiagnosticsConsent {
  const d = readJson(store, KEY) as Record<string, unknown> | null;
  if (!d || typeof d !== 'object') return { ...NO_CONSENT };
  return {
    crash: d.crash === true,
    stats: d.stats === true,
    at: typeof d.at === 'string' ? d.at : '',
    noticeVersion: typeof d.noticeVersion === 'string' ? d.noticeVersion : '',
    ageConfirmed18: d.ageConfirmed18 === true,
  };
}

/** Records a choice with the current time and notice version. */
export function saveConsent(
  store: KeyValueStore,
  choice: { crash: boolean; stats: boolean; ageConfirmed18: boolean },
  now: Date = new Date(),
): DiagnosticsConsent {
  const adult = choice.ageConfirmed18;
  const consent: DiagnosticsConsent = {
    crash: adult && choice.crash,
    stats: adult && choice.stats,
    at: now.toISOString(),
    noticeVersion: NOTICE_VERSION,
    ageConfirmed18: adult,
  };
  writeJson(store, KEY, consent);
  return consent;
}

/** True when the stored choice was made against the current notice. */
function current(c: DiagnosticsConsent): boolean {
  return c.ageConfirmed18 && c.at !== '' && c.noticeVersion === NOTICE_VERSION;
}

/** Crash reports need the player's opt-in AND the remote switch. */
export function crashReportsAllowed(c: DiagnosticsConsent, config: RemoteConfig): boolean {
  return current(c) && c.crash && config.crashReports;
}

export function statsAllowed(c: DiagnosticsConsent, config: RemoteConfig): boolean {
  return current(c) && c.stats && config.analytics;
}
