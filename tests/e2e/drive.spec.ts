import { expect, test } from '@playwright/test';
import { startGame } from './play';

// window.__ona is typed by src/main.ts.

test('the map loads and the keke drives', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await startGame(page);
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#hud .credit')).toContainText('OpenStreetMap contributors');

  const start = await page.evaluate(() => ({ ...window.__ona.player! }));
  // Software rendering in CI is slow, so hold the pedal until the keke has moved rather than for a fixed time.
  const moved = async () => {
    const p = await page.evaluate(() => ({ ...window.__ona.player! }));
    return Math.hypot(p.x - start.x, p.y - start.y);
  };

  if (isMobile) {
    const gas = page.locator('[data-ctl="gas"]');
    await expect(gas).toBeVisible();
    const box = (await gas.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(() => moved(), { timeout: 30_000 }).toBeGreaterThan(2);
    await page.mouse.up();
  } else {
    await expect(page.locator('[data-ctl="gas"]')).toBeHidden();
    await page.keyboard.down('ArrowUp');
    await expect.poll(() => moved(), { timeout: 30_000 }).toBeGreaterThan(2);
    await page.keyboard.up('ArrowUp');
  }

  await expect(page.locator('#speed')).not.toHaveText('0');
  await page.screenshot({ path: `test-results/drive-${isMobile ? 'phone' : 'desktop'}.png` });
  expect(errors).toEqual([]);
});
