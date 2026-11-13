/**
 * Traffic wardens at roundabouts (CORE-2), ported from prototype v0.1. Pure logic.
 * Each warden runs a 15 s cycle: 9 s GO, then 6 s STOP. Running a STOP costs ₦200 and 6 Respect;
 * waiting for it earns 2 Respect; honking at a warden costs 1.
 */

export const CYCLE_S = 15;
export const GO_S = 9;

export type Phase = 'go' | 'stop';

export interface WardenLines {
  fine: string;
  nod: string;
  honk: string;
}

export interface Warden {
  name: string;
  lines: WardenLines;
  x: number;
  y: number;
  /** Roundabout ring radius. */
  r: number;
  /** Seconds into the cycle. */
  t: number;
  phase: Phase;
  /** Rule memory for the current signal. */
  fined: boolean;
  praised: boolean;
  /** Seconds the player has waited at this STOP. */
  waited: number;
  /** The player was already on the roundabout when STOP began, so isn't fined for finishing it. */
  insideAtStop: boolean;
  /** Seconds until this warden reacts to the horn again. */
  honkCooldown: number;
}

export const WARDEN_CAST: { name: string; lines: WardenLines }[] = [
  {
    name: 'Officer Biodun',
    lines: {
      fine: 'Hey! Where are you going in this manner?!',
      nod: 'Good. You see? Ilorin is a city of order.',
      honk: 'Who is honking at me? Do I look like a goat?',
    },
  },
  {
    name: 'Officer Kemi',
    lines: {
      fine: "Is it your father's road? Park there!",
      nod: 'Well done. Lagos people can learn after all.',
      honk: 'Honk again and see what will happen.',
    },
  },
  {
    name: 'Officer Musa',
    lines: {
      fine: 'Stop! You did not see my hand?',
      nod: 'Very good. Go well.',
      honk: 'Horn is not a greeting, my friend.',
    },
  },
];

export function phaseAt(t: number): Phase {
  return t % CYCLE_S < GO_S ? 'go' : 'stop';
}

/** Wardens stand at the first three proper roundabouts (ring radius under 19 m). */
export function createWardens(islands: { x: number; y: number; r: number }[]): Warden[] {
  return islands
    .filter((r) => r.r < 19)
    .slice(0, WARDEN_CAST.length)
    .map((r, i) => {
      const cast = WARDEN_CAST[i]!;
      const t = i * 4.3;
      return {
        name: cast.name,
        lines: cast.lines,
        x: r.x,
        y: r.y,
        r: r.r,
        t,
        phase: phaseAt(t),
        fined: false,
        praised: false,
        waited: 0,
        insideAtStop: false,
        honkCooldown: 0,
      };
    });
}

/** Advances every warden. Returns the wardens whose signal changed this step. */
export function stepWardens(wardens: Warden[], dt: number): Warden[] {
  const changed: Warden[] = [];
  for (const w of wardens) {
    w.t += dt;
    const phase = phaseAt(w.t);
    if (phase !== w.phase) {
      w.phase = phase;
      changed.push(w);
    }
  }
  return changed;
}

/** Whole seconds until this warden's signal changes. */
export function secondsLeft(w: Warden): number {
  const c = w.t % CYCLE_S;
  return Math.ceil(w.phase === 'go' ? GO_S - c : CYCLE_S - c);
}

export function nearestWarden(
  wardens: Warden[],
  x: number,
  y: number,
): { warden: Warden; dist: number } | null {
  let best: Warden | null = null;
  let dist = Infinity;
  for (const w of wardens) {
    const d = Math.hypot(x - w.x, y - w.y);
    if (d < dist) {
      dist = d;
      best = w;
    }
  }
  return best ? { warden: best, dist } : null;
}

export const FINE = 200;
export const FINE_RESPECT = -6;
export const PRAISE_RESPECT = 2;
export const HONK_RESPECT = -1;

export type WardenEvent =
  { kind: 'fine'; warden: Warden } | { kind: 'praise'; warden: Warden } | { kind: 'honk'; warden: Warden };

/**
 * Applies the warden rules for one step. Call after stepWardens with the wardens that changed signal.
 * Returns what happened; the caller applies money and Respect and shows the lines.
 */
export function wardenRules(
  wardens: Warden[],
  changed: Warden[],
  player: { x: number; y: number },
  speed: number,
  dt: number,
): WardenEvent[] {
  const events: WardenEvent[] = [];
  for (const w of changed) {
    w.fined = false;
    w.praised = false;
    w.waited = 0;
    w.insideAtStop = Math.hypot(player.x - w.x, player.y - w.y) < w.r + 5;
  }
  for (const w of wardens) {
    w.honkCooldown = Math.max(0, w.honkCooldown - dt);
    if (w.phase !== 'stop') continue;
    const d = Math.hypot(player.x - w.x, player.y - w.y);
    if (!w.insideAtStop && !w.fined && d < w.r + 2.5 && speed > 2.5) {
      w.fined = true;
      events.push({ kind: 'fine', warden: w });
    }
    if (d > w.r + 2.5 && d < w.r + 22 && speed < 0.8) {
      w.waited += dt;
      if (w.waited > 1.3 && !w.praised && !w.fined) {
        w.praised = true;
        events.push({ kind: 'praise', warden: w });
      }
    }
  }
  return events;
}

/** Honking near a warden annoys them, once every 8 s. */
export function honkAtWardens(wardens: Warden[], player: { x: number; y: number }): WardenEvent[] {
  const events: WardenEvent[] = [];
  for (const w of wardens) {
    if (w.honkCooldown <= 0 && Math.hypot(player.x - w.x, player.y - w.y) < 32) {
      w.honkCooldown = 8;
      events.push({ kind: 'honk', warden: w });
    }
  }
  return events;
}
