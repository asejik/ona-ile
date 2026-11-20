/**
 * Player settings (SYS-1, ACC-3). Kept on the device next to the save; no personal data.
 */
import { readJson, writeJson, type KeyValueStore } from './storage';

export const SETTINGS_KEY = 'onaile.settings.v1';

export type ControlScheme = 'both' | 'swipe' | 'buttons';
export type SteerLevel = 'low' | 'normal' | 'high';

export interface Settings {
  /** Swipe-to-drive, on-screen buttons, or both (touch screens; the keyboard always works). */
  controls: ControlScheme;
  steer: SteerLevel;
  sound: boolean;
  /** The "Drag to drive" hint has done its job. */
  swipeHintDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  controls: 'both',
  steer: 'normal',
  sound: true,
  swipeHintDone: false,
};

const pickOne = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;

export function loadSettings(store: KeyValueStore): Settings {
  const raw = readJson(store, SETTINGS_KEY);
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_SETTINGS;
  return {
    controls: pickOne(r.controls, ['both', 'swipe', 'buttons'] as const, d.controls),
    steer: pickOne(r.steer, ['low', 'normal', 'high'] as const, d.steer),
    sound: typeof r.sound === 'boolean' ? r.sound : d.sound,
    swipeHintDone: r.swipeHintDone === true,
  };
}

export function saveSettings(store: KeyValueStore, s: Settings): void {
  writeJson(store, SETTINGS_KEY, s);
}
