import { expect, test } from '@playwright/test';
import { startGame } from './play';

test('potholes are visible on the road, slow the keke and wear it a little (REAL-5)', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await startGame(page);
  const holes = await page.evaluate(() => window.__ona.potholes!);
  expect(holes.length).toBeGreaterThan(50);

  // A deep pothole, and the direction of the road it lies on (from the zone file's nearest segment).
  const [hx, hy] = holes.find((h) => h[3] === 1)!;
  const heading = await page.evaluate(
    async ([x, y]) => {
      const zone = await (await fetch('./zones/zone1-post-office.json')).json();
      let best = Infinity;
      let h = 0;
      for (const r of zone.roads as { p: number[] }[]) {
        for (let k = 1; k < r.p.length; k++) {
          const [ax, ay] = zone.nodes[r.p[k - 1]!] as [number, number];
          const [bx, by] = zone.nodes[r.p[k]!] as [number, number];
          const ex = bx - ax;
          const ey = by - ay;
          const t = Math.max(0, Math.min(1, ((x! - ax) * ex + (y! - ay) * ey) / (ex * ex + ey * ey)));
          const d = Math.hypot(x! - (ax + t * ex), y! - (ay + t * ey));
          if (d < best) {
            best = d;
            h = Math.atan2(ey, ex);
          }
        }
      }
      return h;
    },
    [hx, hy],
  );

  // Look at it from 14 m back along the road, for the screenshot.
  await page.evaluate(
    ([x, y, h]) => window.__ona.game!.teleport(x! - Math.cos(h!) * 14, y! - Math.sin(h!) * 14, h!),
    [hx, hy, heading],
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/potholes-${info.project.name}.png` });

  // Drive into the deep pothole at speed.
  const before = await page.evaluate(() => window.__ona.game!.damage);
  await page.evaluate(
    ([x, y, h]) => {
      window.__ona.game!.teleport(x! - Math.cos(h!) * 1.5, y! - Math.sin(h!) * 1.5, h!);
      window.__ona.player!.v = 12;
    },
    [hx, hy, heading],
  );
  await expect
    .poll(() => page.evaluate(() => window.__ona.game!.damage), { timeout: 20_000 })
    .toBeGreaterThan(before);
  // The deep pothole cut the speed well below the 12 m/s it was going.
  expect(await page.evaluate(() => Math.abs(window.__ona.player!.v))).toBeLessThan(8);
});
