import { describe, expect, it } from 'vitest';
import { decodeSaveCode, encodeSaveCode } from '../../src/platform/save';
import {
  DEFAULT_SETTINGS,
  QUALITY,
  SETTINGS_KEY,
  effectiveQuality,
  loadSettings,
  saveSettings,
} from '../../src/platform/settings';
import type { KeyValueStore } from '../../src/platform/storage';
import { newGame, type GameState } from '../../src/sim/rides';
import { DEAD_ZONE, STEER_DEAD_BAND, STEER_GAIN, SWIPE_RADIUS, swipeDrive } from '../../src/ui/swipe';

const memory = (): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
};

describe('swipe-to-drive (ACC-3)', () => {
  const R = SWIPE_RADIUS;

  it('does nothing inside the dead zone, so a resting thumb never creeps', () => {
    expect(swipeDrive(0, 0)).toEqual({ gas: 0, brake: 0, left: 0, right: 0 });
    expect(swipeDrive(0, -R * DEAD_ZONE * 0.9)).toEqual({ gas: 0, brake: 0, left: 0, right: 0 });
  });

  it('drag up is full gas, drag down is full brake (and reverse)', () => {
    expect(swipeDrive(0, -R)).toEqual({ gas: 1, brake: 0, left: 0, right: 0 });
    expect(swipeDrive(0, R * 3)).toEqual({ gas: 0, brake: 1, left: 0, right: 0 });
  });

  it('length sets strength', () => {
    const half = swipeDrive(0, -R * 0.6).gas;
    expect(half).toBeGreaterThan(0.3);
    expect(half).toBeLessThan(0.7);
    expect(swipeDrive(0, -R * 0.9).gas).toBeGreaterThan(half);
  });

  it('the angle mixes steering in: up-right is gas and right, down-left is brake and left', () => {
    const ur = swipeDrive(R, -R);
    expect(ur.gas).toBeCloseTo(Math.SQRT1_2, 5);
    // A 45° drag steers about 40%, not 71%: the curve keeps diagonals calm.
    const diagonal = ((Math.SQRT1_2 - STEER_DEAD_BAND) / (1 - STEER_DEAD_BAND)) ** 2;
    expect(ur.right).toBeCloseTo(diagonal, 5);
    expect(ur.right).toBeLessThan(0.45);
    expect(ur.left).toBe(0);
    const dl = swipeDrive(-R, R);
    expect(dl.brake).toBeGreaterThan(0.5);
    expect(dl.left).toBeCloseTo(diagonal, 5);
    // Straight sideways steers without touching the pedals: the keke coasts round the bend.
    const side = swipeDrive(-R, 0);
    expect(side).toEqual({ gas: 0, brake: 0, left: 1, right: 0 });
  });

  it('a thumb drifting a little off straight up does not steer (first phone test: too sharp)', () => {
    // About 11° off vertical: full gas, no steering at all.
    const drift = swipeDrive(R * 0.2, -R);
    expect(drift.gas).toBeGreaterThan(0.9);
    expect(drift.left + drift.right).toBe(0);
    // About 20° off: only a touch of steering.
    const lean = swipeDrive(R * 0.36, -R);
    expect(lean.right).toBeGreaterThan(0);
    expect(lean.right).toBeLessThan(0.05);
  });

  it('steering sensitivity scales the steer and never passes full lock', () => {
    const gentle = swipeDrive(R, -R, STEER_GAIN.low).right;
    const quick = swipeDrive(R, -R, STEER_GAIN.high).right;
    expect(gentle).toBeLessThan(quick);
    expect(swipeDrive(R, 0, STEER_GAIN.high).right).toBe(1);
  });
});

describe('settings', () => {
  it('defaults to swipe and buttons together', () => {
    expect(loadSettings(memory())).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.controls).toBe('both');
  });

  it('round-trips and repairs bad values field by field', () => {
    const store = memory();
    const chosen = {
      controls: 'swipe',
      steer: 'high',
      sound: false,
      swipeHintDone: true,
      textSize: 'larger',
      graphics: 'medium',
      reduceMotion: true,
    } as const;
    saveSettings(store, chosen);
    expect(loadSettings(store)).toEqual(chosen);
    store.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        controls: 'tilt',
        steer: 9,
        sound: 'yes',
        textSize: 'huge',
        graphics: 1,
        reduceMotion: 'y',
      }),
    );
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    store.setItem(SETTINGS_KEY, '{broken');
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('graphics quality (SYS-1)', () => {
  it("'auto' is low on slow devices and high elsewhere; a choice is kept", () => {
    expect(effectiveQuality(DEFAULT_SETTINGS, true)).toBe('low');
    expect(effectiveQuality(DEFAULT_SETTINGS, false)).toBe('high');
    expect(effectiveQuality({ ...DEFAULT_SETTINGS, graphics: 'medium' }, true)).toBe('medium');
  });

  it('draws more at each step up', () => {
    expect(QUALITY.low.traffic).toBeLessThan(QUALITY.medium.traffic);
    expect(QUALITY.medium.traffic).toBeLessThan(QUALITY.high.traffic);
    expect(QUALITY.low.trees).toBeLessThan(QUALITY.high.trees);
    expect(QUALITY.low.fogFar).toBeLessThan(QUALITY.high.fogFar);
  });
});

describe('save code (SYS-1)', () => {
  const game: GameState = {
    ...newGame(3),
    money: 4350,
    respect: 72,
    rides: 9,
    pages: [true, false, true],
    damage: 37,
    best: { 'po-sadiku': 83.4, 'obo-gpo': 129 },
    introDone: true,
    bisiDone: true,
  };

  it('carries the whole game and comes back the same', () => {
    const code = encodeSaveCode(game);
    expect(code).toMatch(/^ONA-4(-[0-9A-Z.]+){8}$/);
    expect(decodeSaveCode(code, 3)).toEqual(game);
  });

  it('forgives case and stray spaces from typing it in by hand', () => {
    const code = encodeSaveCode(game);
    expect(decodeSaveCode(`  ${code.toLowerCase().replace('-', ' - ')} `, 3)).toEqual(game);
  });

  it('rejects typos, other text and codes from another version', () => {
    const code = encodeSaveCode(game);
    const typo = code.replace(/-([0-9A-Z]+)-/, (_m, f: string) => `-${f === '2' ? '3' : '2'}-`);
    expect(decodeSaveCode(typo, 3)).toBeNull();
    expect(decodeSaveCode('', 3)).toBeNull();
    expect(decodeSaveCode('hello', 3)).toBeNull();
    expect(decodeSaveCode(code.replace('ONA', 'ABC'), 3)).toBeNull();
    expect(decodeSaveCode(code.slice(0, -1), 3)).toBeNull();
  });

  it('still loads a version 2 code from before damage, as an undamaged keke', () => {
    // Made by the version 2 encoder from the same game.
    expect(decodeSaveCode('ONA-2-3CU-20-9-5-6-B2LX', 3)).toEqual({ ...game, damage: 0, best: {} });
  });

  it('still loads a version 3 code from before challenges, with no best times', () => {
    // Made by the version 3 encoder from the same game.
    expect(decodeSaveCode('ONA-3-3CU-20-9-5-6-11-I9RD', 3)).toEqual({ ...game, best: {} });
  });

  it('rejects a version 4 code whose challenge times are garbled', () => {
    const code = encodeSaveCode(game);
    const parts = code.split('-');
    parts[8] = 'ZZZZZ.1';
    expect(decodeSaveCode(parts.join('-'), 3)).toBeNull();
  });

  it('clamps values even when the checksum is right', () => {
    const huge = encodeSaveCode({ ...game, money: 99_999_999_999, respect: 500 });
    const back = decodeSaveCode(huge, 3)!;
    expect(back.money).toBe(10_000_000);
    expect(back.respect).toBe(100);
  });
});
