import { expect, test, type Page } from '@playwright/test';
import { startGame } from './play';

// NAV-5: road names on the minimap, and a full map with pinch, drag, zoom and a legend.
test.setTimeout(180_000);

const painted = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('#fullmap canvas') as HTMLCanvasElement;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    // Count distinct colours in a sample: a drawn map has many, a blank canvas one.
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!);
    return seen.size;
  });

test('tapping the minimap opens the full map; it pans, zooms and closes', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startGame(page);
  await page.screenshot({ path: `test-results/minimap-${isMobile ? 'phone' : 'desktop'}.png` });

  await page.locator('#mapBtn').click();
  const map = page.locator('#fullmap');
  await expect(map).toBeVisible();
  expect(await page.evaluate(() => window.__ona.game!.paused)).toBe(true);
  await expect.poll(() => painted(page), { timeout: 20_000 }).toBeGreaterThan(5);
  await expect(map.getByRole('list', { name: 'Map key' })).toContainText('Passenger waiting');
  await expect(map).toContainText('OpenStreetMap contributors');
  await page.screenshot({ path: `test-results/fullmap-${isMobile ? 'phone' : 'desktop'}.png` });

  // Drag the map, then zoom with the buttons; both must leave a drawn map behind.
  const box = (await map.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  await map.getByRole('button', { name: 'Zoom in' }).click();
  await map.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => painted(page), { timeout: 20_000 }).toBeGreaterThan(5);
  await page.screenshot({ path: `test-results/fullmap-zoomed-${isMobile ? 'phone' : 'desktop'}.png` });

  await map.getByRole('button', { name: 'Close the map' }).click();
  await expect(map).toBeHidden();
  expect(await page.evaluate(() => window.__ona.game!.paused)).toBe(false);
  expect(errors).toEqual([]);
});

test('the pause card opens the full map, and Esc goes back to the pause card', async ({ page, isMobile }) => {
  test.skip(isMobile, 'covered on the desktop project');
  await startGame(page);
  await page.keyboard.press('KeyM');
  await expect(page.locator('#fullmap')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#fullmap')).toBeHidden();
  await expect(page.locator('#pause')).toBeHidden();

  await page.locator('#pauseBtn').click();
  await page.locator('#fullMapBtn').click();
  await expect(page.locator('#fullmap')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause')).toBeVisible();
});
