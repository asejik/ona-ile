import { expect, test } from '@playwright/test';
import { startGame } from './play';

test('a crash dents the keke, a breakdown is towed, and Oga Lati repairs it (DMG-1, DMG-3, DMG-4)', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await startGame(page);
  const chip = page.locator('#dmg');
  await expect(chip).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('#dmgPct')).toHaveText('0%');

  // DMG-1: drive at full speed into a signpost pole.
  await page.evaluate(() => {
    const g = window.__ona.game!;
    const post = window.__ona.signs![0]!;
    g.teleport(post.x - 9, post.y, 0);
    window.__ona.player!.v = 14;
  });
  await expect
    .poll(() => page.evaluate(() => window.__ona.game!.damage), { timeout: 20_000 })
    .toBeGreaterThan(5);
  await expect(chip).not.toHaveAttribute('aria-valuenow', '0');
  await page.screenshot({ path: `test-results/damage-chip-${info.project.name}.png` });

  // DMG-3: at 100% the keke breaks down and Oga Lati's boys tow it.
  await page.evaluate(() => {
    window.__ona.game!.setDamage(100);
  });
  const card = page.locator('#dialog');
  await expect(card).toContainText('Oga Lati');
  await expect(card).toContainText('Tow fee');
  await card.getByRole('button', { name: "Tow it to Oga Lati's" }).click();

  // DMG-4: towed to the workshop, where the repair card shows the diagnosis and the price.
  await expect(card).toContainText('Full repair');
  await expect(card).toContainText('₦1,500');
  const where = await page.evaluate(() => {
    const p = window.__ona.player!;
    const w = window.__ona.game!.workshop!;
    return Math.hypot(p.x - w.stopX, p.y - w.stopY);
  });
  expect(where).toBeLessThan(1);
  await page.screenshot({ path: `test-results/damage-repair-${info.project.name}.png` });
  // A new player has no money, so Oga Lati patches it up for free and the keke drives again.
  await card.getByRole('button', { name: 'Patch it up' }).click();
  await expect(card).toBeHidden();
  const after = await page.evaluate(() => window.__ona.game!.damage);
  expect(after).toBeLessThan(100);
  await expect(page.locator('#dmgPct')).toHaveText(`${Math.round(after)}%`);
  await expect(chip).toHaveClass(/hi/);
});
