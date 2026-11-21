import { expect, test } from '@playwright/test';
import { closeCards, startGame } from './play';

// Game logic is the same at any screen size, and the 3D game is slow to test without a GPU: desktop only.
test.skip(({ isMobile }) => isMobile, 'covered by the desktop project');

test('a timed challenge: stop at the board, count down, race to the finish, get a medal (TIME-1)', async ({
  page,
}, info) => {
  test.setTimeout(240_000);
  await startGame(page);
  const c = await page.evaluate(() => window.__ona.game!.challenges.find((x) => x.id === 'po-sadiku')!);
  expect(c).toBeTruthy();

  // Look at the board from down the road, then stop beside it.
  await page.evaluate(([x, y]) => window.__ona.game!.teleport(x! - 20, y!), [c.startX, c.startY]);
  await page.evaluate(async () => {
    for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r));
  });
  await page.evaluate(([x, y]) => window.__ona.game!.teleport(x!, y!), [c.startX, c.startY]);
  const card = page.locator('#dialog');
  await expect(card).toContainText('Timed challenge', { timeout: 20_000 });
  await expect(card).toContainText('Post Office Terminus to Sadiku Hospital');
  await expect(card).toContainText('Bronze (time limit)');
  await expect(card).toContainText('No run yet');
  await page.screenshot({ path: `test-results/challenge-card-${info.project.name}.png` });
  await card.getByRole('button', { name: 'Start' }).click();

  // The countdown holds the keke still, then the clock runs (game time; CI's frames can be slow).
  await expect(page.locator('#tracker [data-line="ride"]')).toContainText('Challenge: to Sadiku Hospital', {
    timeout: 20_000,
  });
  await page.evaluate(() => {
    window.__ona.player!.v = 0;
  });
  await expect
    .poll(() => page.evaluate(() => window.__ona.game!.run?.countdown ?? -1), { timeout: 60_000 })
    .toBe(0);
  await page.screenshot({ path: `test-results/challenge-run-${info.project.name}.png` });

  // Arrive at the finish (teleport), stopped in the ring.
  await page.evaluate(([x, y]) => window.__ona.game!.teleport(x!, y!), [c.finishX, c.finishY]);
  await expect(card).toContainText('Your time', { timeout: 20_000 });
  await expect(card).toContainText(/Medal\s*Gold/);
  await page.screenshot({ path: `test-results/challenge-result-${info.project.name}.png` });
  const best = await page.evaluate(() => window.__ona.game!.best);
  expect(best['po-sadiku']).toBeGreaterThan(0);
  await closeCards(page);
  expect(await page.evaluate(() => window.__ona.game!.run)).toBeNull();
});
