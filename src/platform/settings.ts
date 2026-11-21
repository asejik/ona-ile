/**
 * Player settings (SYS-1, ACC-2, ACC-3). Kept on the device next to the save; no personal data.
 */
import { readJson, writeJson, type KeyValueStore } from './storage';

export const SETTINGS_KEY = 'onaile.settings.v1';

export type ControlScheme = 'both' | 'swipe' | 'buttons';
export type SteerLevel = 'low' | 'normal' | 'high';
export type TextSize = 'normal' | 'large' | 'larger';
/** 'auto' picks low on phones and low-memory devices, high elsewhere. */
export type Graphics = 'auto' | 'low' | 'medium' | 'high';

export interface Settings {
  /** Swipe-to-drive, on-screen buttons, or both (touch screens; the keyboard always works). */
  controls: ControlScheme;
  steer: SteerLevel;
  sound: boolean;
  /** The "Drag to drive" hint has done its job. */
  swipeHintDone: boolean;
  /** ACC-2: text size across the HUD, cards and menus. */
  textSize: TextSize;
  /** SYS-1: how much the game draws. Takes effect when the game next starts. */
  graphics: Graphics;
  /** Less movement (no camera shake, softer flash, no pop-in). Null follows the device's setting. */
  reduceMotion: boolean | null;
}

export const DEFAULT_SETTINGS: Settings = {
  controls: 'both',
  steer: 'normal',
  sound: true,
  swipeHintDone: false,
  textSize: 'normal',
  graphics: 'auto',
  reduceMotion: null,
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
    textSize: pickOne(r.textSize, ['normal', 'large', 'larger'] as const, d.textSize),
    graphics: pickOne(r.graphics, ['auto', 'low', 'medium', 'high'] as const, d.graphics),
    reduceMotion: typeof r.reduceMotion === 'boolean' ? r.reduceMotion : null,
  };
}

export function saveSettings(store: KeyValueStore, s: Settings): void {
  writeJson(store, SETTINGS_KEY, s);
}

export type Quality = 'low' | 'medium' | 'high';

/** The graphics quality to use: the player's choice, or for 'auto' low on slow devices and high elsewhere. */
export function effectiveQuality(s: Settings, slowDevice: boolean): Quality {
  return s.graphics === 'auto' ? (slowDevice ? 'low' : 'high') : s.graphics;
}

/** What each quality level draws (SYS-1). Low is what phones always had; high what desktops had. */
export const QUALITY: Record<
  Quality,
  {
    trees: number;
    traffic: number;
    shadowMap: number;
    maxPixelRatio: number;
    fogFar: number;
    antialias: boolean;
  }
> = {
  low: { trees: 520, traffic: 10, shadowMap: 1024, maxPixelRatio: 1.5, fogFar: 300, antialias: false },
  medium: { trees: 700, traffic: 13, shadowMap: 1024, maxPixelRatio: 1.75, fogFar: 360, antialias: false },
  high: { trees: 900, traffic: 16, shadowMap: 2048, maxPixelRatio: 2, fogFar: 420, antialias: true },
};
