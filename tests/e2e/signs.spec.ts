import { expect, test } from '@playwright/test';
import { startGame } from './play';

// NAV-2 and NAV-3: plates and signposts stand at the junctions, readable from the road, within budget.
// Software WebGL is slow; the camera needs frames to settle before the screenshot.
test.setTimeout(180_000);

test('street name plates and signposts stand at the junctions (NAV-2, NAV-3)', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The budget is checked at the real default graphics setting.
  await startGame(page, { graphics: 'auto' });

  const signs = await page.evaluate(() => window.__ona.signs!);
  expect(signs.length).toBeGreaterThan(50);
  expect(signs.flatMap((s) => s.plates)).toContain('Unity Road');

  // Drive (teleport) up to a junction where two named roads cross and the post has blades.
  const view = await page.evaluate(async () => {
    const zone = await (await fetch('./zones/zone1-post-office.json')).json();
    type J = { x: number; y: number; rb?: number; plates: string[]; exits: { h: number; to?: string }[] };
    const j = (zone.junctions as J[]).find(
      (j) => j.rb === undefined && j.plates.length >= 2 && j.exits.filter((e) => e.to).length >= 2,
    )!;
    const e = j.exits.find((x) => x.to)!;
    const a = (e.h * Math.PI) / 180;
    // 18 m out along one road, facing back towards the junction.
    return { x: j.x + Math.cos(a) * 18, y: j.y + Math.sin(a) * 18, h: a + Math.PI, plates: j.plates };
  });
  await page.evaluate(([x, y, h]) => window.__ona.game!.teleport(x!, y!, h!), [view.x, view.y, view.h]);
  // Let the chase camera settle behind the keke: it eases in per frame, and software WebGL is slow.
  await page.evaluate(async () => {
    for (let i = 0; i < 80; i++) await new Promise((r) => requestAnimationFrame(r));
  });
  await page.screenshot({ path: `test-results/signs-${isMobile ? 'phone' : 'desktop'}.png` });

  const s = await page.evaluate(() => window.__ona.stats!);
  expect(s.calls).toBeLessThanOrEqual(150);
  expect(s.triangles).toBeLessThanOrEqual(300_000);
  expect(errors).toEqual([]);
});
