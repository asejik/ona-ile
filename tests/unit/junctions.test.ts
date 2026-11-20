import { describe, expect, it } from 'vitest';
import { realZone } from './fixtures';

// Junction data is computed at build time (tools/build_zone.py). These checks keep it sensible; the
// M3 exit check (plates and signposts match the real streets) is done by a local on the review page.
const zone = realZone();
const roadNames = new Set(zone.roads.map((r) => r.n).filter(Boolean));
const places = new Map<string, { x: number; y: number }>();
for (const p of [...zone.spots, ...zone.notebook]) places.set(p.name, p);
for (const rb of zone.roundabouts) places.set(rb.name, rb);
const ordinary = zone.junctions.filter((j) => j.rb === undefined);
const angle = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('junctions (NAV-2, NAV-3)', () => {
  it('are computed for zone1, one per real crossing', () => {
    expect(ordinary.length).toBeGreaterThan(40);
    // Divided roads are merged: no two ordinary junctions within 25 m.
    for (const a of ordinary) {
      for (const b of ordinary) {
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(25);
      }
    }
  });

  it('every junction has name plates, and every plate is a real road in the zone', () => {
    for (const j of zone.junctions) {
      expect(j.plates.length).toBeGreaterThan(0);
      for (const name of j.plates) expect(roadNames.has(name)).toBe(true);
    }
  });

  it('exits are distinct ways out', () => {
    for (const j of zone.junctions) {
      if (j.rb === undefined) expect(j.exits.length).toBeGreaterThanOrEqual(3);
      for (const e of j.exits) {
        expect(Number.isInteger(e.h) && e.h >= 0 && e.h < 360).toBe(true);
        if (e.road) expect(roadNames.has(e.road)).toBe(true);
      }
      for (let a = 0; a < j.exits.length; a++) {
        for (let b = a + 1; b < j.exits.length; b++) {
          expect(angle(j.exits[a]!.h, j.exits[b]!.h)).toBeGreaterThanOrEqual(35);
        }
      }
    }
  });

  it('signposts point to a known place, roughly the way the road goes, not to where you already are', () => {
    let blades = 0;
    for (const j of zone.junctions) {
      for (const e of j.exits) {
        if (!e.to) continue;
        blades++;
        const p = places.get(e.to);
        expect(p, e.to).toBeDefined();
        expect(e.to).not.toBe('Roundabout');
        expect(e.d).toBeGreaterThan(0);
        expect(e.d).toBeLessThanOrEqual(800);
        expect(Math.hypot(p!.x - j.x, p!.y - j.y)).toBeGreaterThan(60);
        const bearing = (Math.atan2(p!.y - j.y, p!.x - j.x) * 180) / Math.PI;
        expect(angle(bearing, e.h), `${j.plates.join(' / ')} → ${e.to}`).toBeLessThan(100);
      }
    }
    expect(blades).toBeGreaterThan(50);
  });

  it('every named roundabout is a junction, and no business name is used as a road name', () => {
    zone.roundabouts.forEach((rb, k) => {
      if (rb.name !== 'Roundabout') expect(zone.junctions.some((j) => j.rb === k)).toBe(true);
    });
    expect([...roadNames].some((n) => /\.(ng|com)\b/i.test(n))).toBe(false);
  });
});
