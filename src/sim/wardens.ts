/**
 * Traffic wardens at roundabouts (CORE-2), ported from prototype v0.1. Pure logic.
 * Each warden runs a 15 s cycle: 9 s GO, then 6 s STOP. Fines and praise need money and
 * Respect, which arrive with the ride loop in M2b.
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
      return { name: cast.name, lines: cast.lines, x: r.x, y: r.y, r: r.r, t, phase: phaseAt(t) };
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
