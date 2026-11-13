import { expect, test } from '@playwright/test';
import { startGame } from './play';

// Checks that the prototype's world is present (M2a), and that it stays within the PRD budgets.
test('the world has traffic, wardens, a minimap and stays within budget', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__ona.wardens?.length ?? 0)).toBe(3);

  const s = await page.evaluate(() => ({ stats: window.__ona.stats!, traffic: window.__ona.traffic! }));
  expect(s.traffic).toBe(isMobile ? 10 : 16);
  // PRD performance budget: at most 150 draw calls and 300k triangles on screen.
  expect(s.stats.calls).toBeGreaterThan(0);
  expect(s.stats.calls).toBeLessThanOrEqual(150);
  expect(s.stats.triangles).toBeLessThanOrEqual(300_000);

  // The minimap has been painted (not blank) and the north tag is placed on its rim.
  const painted = await page.evaluate(() => {
    const c = document.getElementById('minimap') as HTMLCanvasElement;
    const d = c.getContext('2d')!.getImageData(c.width / 2 - 20, c.height / 2 - 20, 40, 40).data;
    return d.some((v, i) => i % 4 === 3 && v > 0);
  });
  expect(painted).toBe(true);
  await expect(page.locator('#north')).toHaveAttribute('style', /left: \d/);

  // The nearest warden (Officer Biodun, by the Post Office) shows a signal with a countdown.
  await expect(page.locator('#warden')).toBeVisible();
  await expect(page.locator('#wardenSig')).toHaveText(/^(GO|STOP) \d+$/);
  expect(errors).toEqual([]);
});

test('the horn button is there on phones', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'buttons are touch-only');
  await startGame(page);
  const box = (await page.locator('[data-act="horn"]').boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(48);
});
