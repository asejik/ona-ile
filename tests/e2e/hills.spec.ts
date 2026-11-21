import { expect, test } from '@playwright/test';
import { startGame } from './play';

// Ahmadu Bello Way climbs east from (188, -116) to (348, -133): about 2.5°, the steepest main road in zone 1.
const LOW = { x: 190, y: -116 };
const HIGH = { x: 346, y: -133 };
const EAST = Math.atan2(HIGH.y - LOW.y, HIGH.x - LOW.x);

test('the ground has hills, the keke and the road follow them, and the slope is felt (M4c)', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await startGame(page);

  const [low, high] = await page.evaluate(
    ([a, b]) => [window.__ona.groundAt!(a!.x, a!.y), window.__ona.groundAt!(b!.x, b!.y)],
    [LOW, HIGH],
  );
  expect(high - low).toBeGreaterThan(3);
  await expect(page.locator('#title .fine').last()).toContainText('Copernicus');

  // Looking up the hill, then back down it.
  await page.evaluate(([p, h]) => window.__ona.game!.teleport(p!.x, p!.y, h), [LOW, EAST] as const);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `test-results/hills-up-${info.project.name}.png` });
  await page.evaluate(([p, h]) => window.__ona.game!.teleport(p!.x, p!.y, h), [
    HIGH,
    EAST + Math.PI,
  ] as const);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `test-results/hills-down-${info.project.name}.png` });

  // Let go at the top, facing downhill at 4 m/s with no throttle. On the flat it would stop within about
  // 2.4 s of game time; here it keeps rolling. Game time is counted the way the game does, since CI's
  // frames can be slow.
  const rolled = await page.evaluate(async () => {
    const p = window.__ona.player!;
    p.v = 4;
    let t = 0;
    let last = performance.now();
    while (t < 3) {
      await new Promise(requestAnimationFrame);
      const now = performance.now();
      t += Math.min(0.05, (now - last) / 1000);
      last = now;
    }
    return p.v;
  });
  expect(rolled).toBeGreaterThan(3);
});
