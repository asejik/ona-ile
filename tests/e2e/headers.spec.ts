import { expect, test, type Page } from '@playwright/test';
import { NOTICE_VERSION } from '../../src/platform/consent';

// The preview server ignores public/_headers, so apply its security headers to every page
// response ourselves and check the real game still works under them.
/** The CSP line from public/_headers, as served from the built site. */
async function cspFrom(page: Page): Promise<string> {
  const file = await (await page.request.get('/_headers')).text();
  return file.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';
}

test.skip(({ isMobile }) => isMobile, 'covered by the desktop project');

async function withHeaders(page: Page) {
  const CSP = await cspFrom(page);
  expect(CSP).not.toBe('');
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  await page.route(/\/(privacy\.html)?(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, headers: { ...res.headers(), 'content-security-policy': CSP } });
  });
  return violations;
}

test('the headers file has a content security policy', async ({ page }) => {
  const CSP = await cspFrom(page);
  expect(CSP).toContain("default-src 'self'");
  expect(CSP).toContain("frame-ancestors 'none'");
});

test('the game runs under the content security policy', async ({ page }) => {
  const violations = await withHeaders(page);
  await page.goto('/');
  await page.waitForFunction(() => window.__ona?.ready === true, undefined, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('800 16px "Baloo 2"'))).toBe(true);
  expect(violations).toEqual([]);
  // Proof the policy really applied: an injected inline script must be blocked.
  const inlineRan = await page.evaluate(() => {
    const el = document.createElement('script');
    el.textContent = 'window.__inlineRan = true';
    document.body.append(el);
    return '__inlineRan' in window;
  });
  expect(inlineRan).toBe(false);
});

test('crash reports still reach Sentry under the policy', async ({ page }) => {
  const violations = await withHeaders(page);
  const sent: string[] = [];
  await page.route(/sentry\.io/, async (route) => {
    sent.push(route.request().url());
    await route.fulfill({ status: 200, body: '{}' });
  });
  await page.addInitScript((v) => {
    window.localStorage.setItem(
      'onaile.diagnostics.v1',
      JSON.stringify({
        crash: true,
        stats: false,
        at: '2026-11-12T00:00:00.000Z',
        noticeVersion: v,
        ageConfirmed18: true,
      }),
    );
  }, NOTICE_VERSION);
  await page.goto('/');
  await page.waitForFunction(() => window.__ona?.crashReporting === 'on', undefined, { timeout: 60_000 });
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('csp test');
    }, 0);
  });
  await expect.poll(() => sent.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(violations).toEqual([]);
});

test('the privacy page runs under the content security policy', async ({ page }) => {
  const violations = await withHeaders(page);
  await page.goto('/privacy.html');
  await expect(page.getByRole('heading', { name: 'Privacy notice' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(violations).toEqual([]);
});

test('the Android app (origin https://localhost) may read config.json, and nothing else may', async ({
  page,
}) => {
  const file = await (await page.request.get('/_headers')).text();
  const block = file.split(/\n(?=\S)/).find((b) => b.startsWith('/config.json')) ?? '';
  expect(block).toContain('Access-Control-Allow-Origin: https://localhost');
  // The only cross-origin grant in the file is for config.json.
  expect(file.match(/Access-Control-Allow-Origin/g)).toHaveLength(1);
});
