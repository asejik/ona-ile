/**
 * Timed challenges (TIME-1) as pure logic: medal times from the road distance, the countdown and the
 * clock. A run starts at a yellow board, ends at the target's stop, and fails when the bronze time runs out.
 */

export type Medal = 'gold' | 'silver' | 'bronze';

export interface MedalTimes {
  /** Seconds. */
  gold: number;
  silver: number;
  /** Also the time limit: past it, the run has failed. */
  bronze: number;
}

/** Average speeds (m/s, along the road) each medal asks for. Top speed is 15 m/s on the flat. */
const PACE: Record<Medal, number> = { gold: 11, silver: 9.5, bronze: 7.5 };
/** Seconds of "3, 2, 1" before the clock starts; the keke is held still. */
export const COUNTDOWN = 3;

/** Medal times for a route of `d` metres by road, each rounded up to 5 s. */
export function medalTimes(d: number): MedalTimes {
  const t = (m: Medal) => Math.ceil(d / PACE[m] / 5) * 5;
  return { gold: t('gold'), silver: t('silver'), bronze: t('bronze') };
}

/** The medal a time earns, or null if it is over the limit. */
export function medalFor(seconds: number, m: MedalTimes): Medal | null {
  if (seconds <= m.gold) return 'gold';
  if (seconds <= m.silver) return 'silver';
  if (seconds <= m.bronze) return 'bronze';
  return null;
}

export interface Run {
  id: string;
  medals: MedalTimes;
  /** Seconds of countdown left; the clock runs once this reaches 0. */
  countdown: number;
  /** Seconds on the clock. */
  t: number;
}

export function startRun(id: string, medals: MedalTimes): Run {
  return { id, medals, countdown: COUNTDOWN, t: 0 };
}

/**
 * Advances the run. Returns 'go' on the step the countdown ends, 'timeup' once the bronze time has passed,
 * otherwise null.
 */
export function stepRun(run: Run, dt: number): 'go' | 'timeup' | null {
  if (run.countdown > 0) {
    run.countdown -= dt;
    if (run.countdown > 0) return null;
    run.t = -run.countdown;
    run.countdown = 0;
    return 'go';
  }
  run.t += dt;
  return run.t > run.medals.bronze ? 'timeup' : null;
}

/** Rounds a finish time to tenths of a second, as it is shown and saved. */
export function finishTime(t: number): number {
  return Math.round(t * 10) / 10;
}

/** "1:07.4" */
export function clock(seconds: number, tenths = false): string {
  const s = Math.max(0, seconds);
  const whole = tenths ? Math.floor(s) : Math.round(s);
  const text = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  return tenths ? `${text}.${Math.floor((s - whole) * 10 + 1e-6)}` : text;
}
