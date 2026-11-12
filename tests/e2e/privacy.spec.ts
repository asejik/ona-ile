import { expect, test, type Page } from '@playwright/test';
import { NOTICE_VERSION } from '../../src/platform/consent';

// These checks don't depend on screen size, and WebGL is slow here, so run them once.
test.skip(({ isMobile }) => isMobile, 'covered by the desktop project');

const OPTED_IN = {
  crash: true,
  stats: false,
  at: '2026-11-12T00:00:00.000Z',
  noticeVersion: NOTICE_VERSION,
  ageConfirmed18: true,
};

/** Records every request the page makes and answers Sentry itself, so nothing reaches the real project. */
async function watch(page: Page) {
  const urls: string[] = [];
  const sentryBodies: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.route(/sentry\.io/, async (route) => {
    sentryBodies.push(route.request().postData() ?? '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return { urls, sentryBodies };
}

async function optIn(page: Page) {
  await page.addInitScript((consent) => {
    window.localStorage.setItem('onaile.diagnostics.v1', JSON.stringify(consent));
  }, OPTED_IN);
}

async function settle(page: Page, state: 'on' | 'off') {
  await page.goto('/');
  await page.waitForFunction((s) => window.__ona?.ready && window.__ona.crashReporting === s, state, {
    timeout: 60_000,
  });
}

async function crash(page: Page) {
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('test crash for ada@example.com');
    }, 0);
  });
}

test('a new player: nothing leaves for a third party (PRIV-1, PRIV-10)', async ({ page, baseURL }) => {
  const { urls, sentryBodies } = await watch(page);
  await settle(page, 'off');
  await crash(page);
  await page.waitForTimeout(1500);

  expect(sentryBodies).toEqual([]);
  expect(urls.filter((u) => !u.startsWith(baseURL!))).toEqual([]);
  expect(urls.some((u) => u.endsWith('/config.json'))).toBe(true);
  // Fonts come from the game's own files.
  await page.evaluate(() => document.fonts.ready);
  expect(urls.some((u) => /\.woff2$/.test(u))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('800 16px "Baloo 2"'))).toBe(true);
});

test('after opting in: a scrubbed crash report is sent, and nothing else (PRIV-5)', async ({
  page,
  baseURL,
}) => {
  const { urls, sentryBodies } = await watch(page);
  await optIn(page);
  await settle(page, 'on');
  await crash(page);
  await expect.poll(() => sentryBodies.length, { timeout: 15_000 }).toBeGreaterThan(0);

  const sent = sentryBodies.join('\n');
  expect(sent).toContain('test crash for [email]');
  expect(sent).not.toContain('ada@example.com');
  expect(sent).toContain('"infer_ip":"never"');
  for (const banned of ['"user"', 'ip_address', '"request"', '"breadcrumbs"', '"extra"', '"url"']) {
    expect(sent, `crash report must not contain ${banned}`).not.toContain(banned);
  }
  const outside = urls.filter((u) => !u.startsWith(baseURL!));
  expect(outside.length).toBeGreaterThan(0);
  expect(outside.every((u) => u.startsWith('https://o4512250670219264.ingest.de.sentry.io/'))).toBe(true);
});

test('the config.json switch turns crash reports off, even after opt-in (PRIV-11)', async ({ page }) => {
  const { sentryBodies } = await watch(page);
  await optIn(page);
  await page.route('**/config.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"crashReports":false,"analytics":false}' }),
  );
  await settle(page, 'off');
  await crash(page);
  await page.waitForTimeout(1500);
  expect(sentryBodies).toEqual([]);
});

test('a boot failure is reported when opted in', async ({ page }) => {
  const { sentryBodies } = await watch(page);
  await optIn(page);
  await page.route('**/zones/*.json', (route) => route.fulfill({ status: 500, body: '' }));
  await page.goto('/');
  await expect(page.locator('#error')).toBeVisible();
  await expect.poll(() => sentryBodies.join(' '), { timeout: 15_000 }).toContain("Couldn't load the map");
});

test('the deployed build has no source maps', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const js = html.match(/assets\/[^"]+\.js/)?.[0];
  expect(js).toBeTruthy();
  const body = await (await request.get(`/${js}`)).text();
  expect(body).not.toContain('sourceMappingURL');
  // The preview server answers unknown paths with index.html, so check the body, not the status.
  expect(await (await request.get(`/${js}.map`)).text()).not.toContain('"mappings"');
});

test('the privacy page opens from the game', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { name: 'Privacy notice' })).toBeVisible();
  await expect(page.getByText('Draft, version')).toBeVisible();
  // Same fonts as the game, and the page can scroll on a phone.
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('800 16px "Baloo 2"'))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe('auto');
});
