import { expect, test } from '@playwright/test';
import { closeCards, startGame } from './play';

test.setTimeout(240_000);

test('Credits on the title card name the map, heights, fonts and engine', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
  await page.locator('#titleCredits').click();
  const credits = page.locator('#credits');
  await expect(credits).toBeVisible();
  await expect(credits.getByRole('link', { name: 'OpenStreetMap contributors' })).toBeVisible();
  await expect(credits).toContainText('Copernicus DEM GLO-30');
  await expect(credits).toContainText('SIL Open Font License');
  await expect(credits).toContainText(/Version \d+\.\d+\.\d+/);
  await page.screenshot({ path: `test-results/credits-${isMobile ? 'phone' : 'desktop'}.png` });
  await page.keyboard.press('Escape');
  await expect(credits).toBeHidden();
  // The OSM line stays on the title card too.
  await expect(page.locator('#title')).toContainText('OpenStreetMap contributors');
});

test('text size, reduce motion and graphics quality (ACC-2, SYS-1)', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 360, height: 740 });
  const name = isMobile ? 'phone' : 'desktop';
  await startGame(page);
  const tracker = page.locator('#tracker');
  const size = () => tracker.evaluate((el) => parseFloat(getComputedStyle(el.querySelector('li')!).fontSize));
  const normal = await size();

  await page.locator('#pauseBtn').click();
  await page.locator('#settingsBtn').click();
  const settings = page.locator('#settings');
  await settings.locator('[data-setting="textSize"] [data-value="larger"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await settings.locator('[data-setting="reduceMotion"] [data-value="on"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', '');
  await page.screenshot({ path: `test-results/settings-larger-${name}.png` });

  // Graphics applies on the next start: the card says so and offers a restart.
  const restart = settings.locator('#gfxRestart');
  await expect(restart).toBeHidden();
  await settings.locator('[data-setting="graphics"] [data-value="medium"]').click();
  await expect(restart).toBeVisible();
  await settings.locator('#settingsDone').click();
  await page.locator('#resumeBtn').click();

  // The HUD at the larger size.
  expect(await size()).toBeGreaterThan(normal);
  await page.screenshot({ path: `test-results/hud-larger-${name}.png` });

  await page.locator('#pauseBtn').click();
  await page.locator('#settingsBtn').click();
  await settings.locator('#gfxRestartBtn').click();
  await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
  // Medium quality: 13 vehicles of traffic (low has 10, high 16), and the choices were kept.
  expect(await page.evaluate(() => window.__ona.traffic)).toBe(13);
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', '');
  await page.locator('#startBtn').click();
  await closeCards(page);
});
