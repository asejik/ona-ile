import { expect, test } from '@playwright/test';
import { closeCards, startGame } from './play';

// The ride loop works the same at any screen size; WebGL is slow here, so run it once.
test.skip(({ isMobile }) => isMobile, 'covered by the desktop project');

test('a full ride: find a passenger nearby, pick up at the kerb, deliver, get paid, saved (CORE-1/4/5, HUD-1)', async ({
  page,
}) => {
  await startGame(page);

  // HUD-1 + CORE-4: Today's page points to a passenger close by.
  const rideLine = page.locator('#tracker [data-line="ride"]');
  await expect(rideLine).toContainText(/Find a passenger: nearest \d+ m/);
  const nearest = Number((await rideLine.textContent())!.match(/nearest (\d+) m/)![1]);
  expect(nearest).toBeLessThanOrEqual(250);
  await expect(page.locator('#tracker')).toContainText("Mama's medicine: ₦0 of ₦5,000");

  // Drive (teleport) to the nearest waiting passenger's stop point, beside the kerb.
  const offer = await page.evaluate(() => {
    const g = window.__ona.game!;
    const p = window.__ona.player!;
    return [...g.offers].sort(
      (a, b) => Math.hypot(a.stopX - p.x, a.stopY - p.y) - Math.hypot(b.stopX - p.x, b.stopY - p.y),
    )[0]!;
  });
  await page.evaluate(([x, y]) => window.__ona.game!.teleport(x!, y!), [offer.stopX, offer.stopY]);

  const card = page.locator('#dialog');
  await expect(card).toBeVisible();
  await expect(card).toContainText(offer.pax);
  await expect(card).toContainText('Fare offered');
  await card.getByRole('button', { name: /^Accept/ }).click();

  const trip = await page.evaluate(() => window.__ona.game!.trip);
  expect(trip).not.toBeNull();
  await expect(rideLine).toContainText(`Take ${trip!.pax} to ${trip!.to}`);
  await expect(page.locator('#tracker .comfort')).toContainText('Smooth');

  // Deliver.
  await page.evaluate(([x, y]) => window.__ona.game!.teleport(x!, y!), [trip!.toX, trip!.toY]);
  await expect(card).toContainText('You earned');
  await expect(card.locator('.stars')).toHaveAttribute('aria-label', /^[1-5] of 5 stars$/);
  const money = await page.evaluate(() => window.__ona.game!.money);
  expect(money).toBeGreaterThan(0);
  await card.getByRole('button', { name: 'Find the next passenger' }).click();
  await expect(card).toBeHidden();

  // CORE-4: someone new is waiting close by straight after the drop-off.
  await expect(rideLine).toContainText(/Find a passenger: nearest \d+ m/, { timeout: 10_000 });

  // SYS-1: the progress survives a reload.
  await page.reload();
  await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
  await expect(page.locator('#startBtn')).toHaveText('Continue');
  expect(await page.evaluate(() => window.__ona.game!.money)).toBe(money);
});

test("a notebook photo restores a page of Baba's notebook (CORE-3)", async ({ page }) => {
  await startGame(page);
  const place = await page.evaluate(async () => {
    const zone = await (await fetch('./zones/zone1-post-office.json')).json();
    return zone.notebook[0] as { x: number; y: number; name: string };
  });
  await page.evaluate(([x, y]) => window.__ona.game!.teleport(x! + 5, y!), [place.x, place.y]);
  const photo = page.locator('#photoBtn');
  // The first frame at a new place can take seconds with software WebGL (CI).
  await expect(photo).toBeVisible({ timeout: 20_000 });
  await photo.click();
  await expect(page.locator('#dialog')).toContainText(`Notebook page restored: ${place.name} · 1 of 3`);
  await closeCards(page);
  expect((await page.evaluate(() => window.__ona.game!.pages))[0]).toBe(true);
  await expect(page.locator('#tracker')).toContainText("Baba's notebook: 1 of 3 places");
});

test('pause stops the world, and Esc toggles it', async ({ page }) => {
  await startGame(page);
  await page.locator('#pauseBtn').click();
  await expect(page.locator('#pause')).toBeVisible();
  expect(await page.evaluate(() => window.__ona.game!.paused)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause')).toBeHidden();
  expect(await page.evaluate(() => window.__ona.game!.paused)).toBe(false);
});
