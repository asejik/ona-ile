/**
 * Damage (DMG-1, DMG-3, DMG-4) as pure logic: how much a crash costs, how a worn keke drives, and what
 * Oga Lati charges. Damage is a percentage, 0 (like new) to 100 (broken down).
 */
import type { Wear } from './vehicle';

/** Impacts below this speed (m/s) are scrapes: they still shake the camera but add no damage. */
export const DAMAGE_MIN_IMPACT = 2.2;
/** Leaving the road faster than this (m/s) knocks the wheels on the kerb. */
export const KERB_SPEED = 8;
/** Above this, the keke slows and pulls to one side (DMG-3). */
export const WORN = 50;
export const BROKEN = 100;
/** Naira per percent of damage at Oga Lati's (DMG-4). */
export const REPAIR_PER_PERCENT = 15;
/** The tow to Oga Lati's after a breakdown. */
export const TOW_FEE = 1000;
/** When the player can't pay for any repair, Oga Lati patches a broken keke this far, for free. */
export const PATCH_TO = 95;

/**
 * Damage from one collision at `impact` m/s, growing faster than the speed: a 5 m/s knock adds about 3%,
 * a full-speed 15 m/s crash about 23%.
 */
export function impactDamage(impact: number): number {
  if (impact <= DAMAGE_MIN_IMPACT) return 0;
  return 0.5 * (impact - DAMAGE_MIN_IMPACT) ** 1.5;
}

/** Damage from mounting the kerb at `speed` m/s: small, about 3.5% at full speed. */
export function kerbDamage(speed: number): number {
  return speed > KERB_SPEED ? (speed - KERB_SPEED) * 0.5 : 0;
}

/** Adds damage, kept within 0..100 and to one decimal place. */
export function addDamage(damage: number, amount: number): number {
  return Math.round(Math.min(BROKEN, Math.max(0, damage + amount)) * 10) / 10;
}

/** DMG-3: from 50% the top speed falls (to 70% just before a breakdown) and the steering pulls right. */
export function handling(damage: number): Wear {
  if (damage <= WORN) return { top: 1, pull: 0 };
  const k = Math.min(1, (damage - WORN) / (BROKEN - WORN));
  return { top: 1 - 0.3 * k, pull: 0.12 * k };
}

/** What a full repair costs: ₦15 a percent, rounded up to ₦50. */
export function repairCost(damage: number): number {
  return damage <= 0 ? 0 : Math.ceil((damage * REPAIR_PER_PERCENT) / 50) * 50;
}

export interface RepairQuote {
  /** Naira charged. */
  cost: number;
  /** Damage left after the work. */
  after: number;
  /** True when this fixes everything. */
  full: boolean;
}

/**
 * What Oga Lati can do for the money the player has: a full repair, as much as the money covers, or (for a
 * broken keke and an empty pocket) a free patch so the player is never stuck.
 */
export function repairQuote(damage: number, money: number): RepairQuote {
  const full = repairCost(damage);
  if (money >= full) return { cost: full, after: 0, full: true };
  const affordable = Math.floor(money / 50) * 50;
  let after = addDamage(damage, -affordable / REPAIR_PER_PERCENT);
  if (damage >= BROKEN) after = Math.min(after, PATCH_TO);
  return { cost: affordable, after, full: false };
}
