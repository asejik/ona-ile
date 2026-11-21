import { expect, type Page } from '@playwright/test';

/** Loads the game, presses Start driving and taps through any intro cards, leaving the player driving. */
export async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
  await page.locator('#startBtn').click();
  // The first frame after Start can hold the page's main thread for seconds with software WebGL (CI).
  await expect.poll(() => page.evaluate(() => window.__ona.game!.started), { timeout: 30_000 }).toBe(true);
  await closeCards(page);
  await expect(page.locator('#hud')).toBeVisible();
  // The ride loop runs inside game frames, and the first frames after starting can take seconds with
  // software WebGL (CI). Wait until it has run once: CORE-4 puts a passenger out on the first update.
  await expect
    .poll(() => page.evaluate(() => window.__ona.game!.offers.length), { timeout: 30_000 })
    .toBeGreaterThan(0);
}

/** Clicks the first button of each open card until none is left. */
export async function closeCards(page: Page, max = 8): Promise<void> {
  const dialog = page.locator('#dialog');
  for (let i = 0; i < max && (await dialog.isVisible()); i++) {
    await dialog.locator('button').first().click();
  }
  await expect(dialog).toBeHidden();
}
