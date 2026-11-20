import { expect, test } from '@playwright/test';
import { encodeSaveCode } from '../../src/platform/save';
import { newGame } from '../../src/sim/rides';
import { startGame } from './play';

test.describe('on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch controls');

  test('swipe-to-drive: drag up anywhere on the road and the keke goes (ACC-3)', async ({ page }) => {
    await startGame(page);
    const hint = page.locator('#swipeHint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Drag to drive');

    const start = await page.evaluate(() => ({ ...window.__ona.player! }));
    const vp = page.viewportSize()!;
    const x = vp.width / 2;
    const y = vp.height * 0.55;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 25, { steps: 3 });
    await page.mouse.move(x, y - 60, { steps: 3 });
    await expect(page.locator('#swipeRing')).toHaveClass(/\bon\b/);
    await expect
      .poll(
        async () => {
          const p = await page.evaluate(() => ({ ...window.__ona.player! }));
          return Math.hypot(p.x - start.x, p.y - start.y);
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThan(2);
    await page.screenshot({ path: 'test-results/swipe-phone.png' });
    await page.mouse.up();
    await expect(page.locator('#swipeRing')).not.toHaveClass(/\bon\b/);
    // Letting go coasts: no pedal is held.
    expect(await page.evaluate(() => window.__ona.player!.v)).toBeGreaterThan(0);
    await expect(hint).toBeHidden();
  });

  test('the controls setting hides the buttons, keeps the horn, and is remembered', async ({ page }) => {
    await startGame(page);
    await expect(page.locator('[data-ctl="gas"]')).toBeVisible();
    await page.locator('#pauseBtn').click();
    await page.locator('#settingsBtn').click();
    const settings = page.locator('#settings');
    await expect(settings).toBeVisible();
    await page.screenshot({ path: 'test-results/settings-phone.png' });
    const swipeOnly = settings.getByRole('button', { name: 'Swipe', exact: true });
    await swipeOnly.click();
    await expect(swipeOnly).toHaveAttribute('aria-pressed', 'true');
    await settings.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('#pause')).toBeVisible();
    await page.locator('#resumeBtn').click();
    await expect(page.locator('[data-ctl="gas"]')).toBeHidden();
    await expect(page.locator('[data-act="horn"]')).toBeVisible();

    // Remembered: the HUD is set up for swipe only as soon as the game loads.
    await page.reload();
    await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
    await expect(page.locator('#hud')).toHaveAttribute('data-controls', 'swipe');
    await page.screenshot({ path: 'test-results/swipe-only-phone.png' });
  });
});

test.describe('save code', () => {
  test.skip(({ isMobile }) => isMobile, 'covered by the desktop project');

  test('a code from another device loads, and a bad one is refused (SYS-1)', async ({ page }) => {
    const code = encodeSaveCode({
      ...newGame(3),
      money: 1234,
      rides: 3,
      pages: [true, false, false],
      introDone: true,
    });
    await page.goto('/');
    await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
    await expect(page.locator('#startBtn')).toHaveText('Start driving');
    await page.locator('#titleSettings').click();
    const settings = page.locator('#settings');
    await expect(settings).toBeVisible();

    const field = page.locator('#importCode');
    await field.fill('ONA-NOT-A-REAL-CODE');
    await page.locator('#importBtn').click();
    await expect(page.locator('#importMsg')).toHaveText("That save code isn't valid");

    await field.fill(code);
    await page.locator('#importBtn').click();
    await expect(page.locator('#importSummary')).toContainText('₦1,234, 3 rides and 1 of 3 notebook places');
    await page.locator('#importYes').click();
    await expect(page.locator('#saveCode')).toHaveText(code);
    await page.keyboard.press('Escape');
    await expect(settings).toBeHidden();
    await expect(page.locator('#startBtn')).toHaveText('Continue');
    expect(await page.evaluate(() => window.__ona.game!.money)).toBe(1234);

    // It is saved on this device too.
    await page.reload();
    await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
    expect(await page.evaluate(() => window.__ona.game!.money)).toBe(1234);
  });
});
