import { describe, expect, it } from 'vitest';
import { SAFE_CONFIG, loadConfig, parseConfig, type RemoteConfig } from '../../src/platform/config';
import {
  NOTICE_VERSION,
  NO_CONSENT,
  crashReportsAllowed,
  loadConsent,
  saveConsent,
  statsAllowed,
} from '../../src/platform/consent';
import { scrubEvent, scrubText } from '../../src/platform/scrub';
import type { KeyValueStore } from '../../src/platform/storage';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
const ON: RemoteConfig = { crashReports: true, analytics: true, minVersion: '' };
const ok = (body: unknown) => () => Promise.resolve(new Response(JSON.stringify(body)));
const fail = () => Promise.reject(new Error('offline'));

describe('remote config (PRIV-11)', () => {
  it('treats anything except true as off', () => {
    expect(parseConfig({ crashReports: 'yes', analytics: 1 })).toEqual(SAFE_CONFIG);
    expect(parseConfig(null)).toEqual(SAFE_CONFIG);
    expect(parseConfig({ crashReports: true, analytics: false, minVersion: '0.3.0' })).toEqual({
      crashReports: true,
      analytics: false,
      minVersion: '0.3.0',
    });
  });

  it('uses the fetched config and caches it', async () => {
    const store = memoryStore();
    expect(await loadConfig('config.json', store, ok({ crashReports: true }))).toEqual({
      ...SAFE_CONFIG,
      crashReports: true,
    });
    expect(store.data.size).toBe(1);
  });

  it('falls back to the cached copy when offline', async () => {
    const store = memoryStore();
    await loadConfig('config.json', store, ok({ crashReports: true }));
    expect((await loadConfig('config.json', store, fail)).crashReports).toBe(true);
  });

  it('keeps diagnostics off when there is no config and no cache', async () => {
    expect(await loadConfig('config.json', memoryStore(), fail)).toEqual(SAFE_CONFIG);
    const notFound = () => Promise.resolve(new Response('', { status: 404 }));
    expect(await loadConfig('config.json', memoryStore(), notFound)).toEqual(SAFE_CONFIG);
  });

  it('a switched-off config replaces an earlier switched-on cache', async () => {
    const store = memoryStore();
    await loadConfig('config.json', store, ok({ crashReports: true }));
    await loadConfig('config.json', store, ok({ crashReports: false }));
    expect((await loadConfig('config.json', store, fail)).crashReports).toBe(false);
  });
});

describe('diagnostics consent (PRIV-1, PRIV-3)', () => {
  it('is off for a new player', () => {
    const c = loadConsent(memoryStore());
    expect(c).toEqual(NO_CONSENT);
    expect(crashReportsAllowed(c, ON)).toBe(false);
    expect(statsAllowed(c, ON)).toBe(false);
  });

  it('records the choice with a date and the notice version', () => {
    const store = memoryStore();
    const saved = saveConsent(
      store,
      { crash: true, stats: false, ageConfirmed18: true },
      new Date('2026-11-12T10:00:00Z'),
    );
    expect(saved).toEqual({
      crash: true,
      stats: false,
      at: '2026-11-12T10:00:00.000Z',
      noticeVersion: NOTICE_VERSION,
      ageConfirmed18: true,
    });
    expect(loadConsent(store)).toEqual(saved);
    expect(crashReportsAllowed(saved, ON)).toBe(true);
    expect(statsAllowed(saved, ON)).toBe(false);
  });

  it('never turns anything on for a player who is not 18 or older', () => {
    const c = saveConsent(memoryStore(), { crash: true, stats: true, ageConfirmed18: false });
    expect(c.crash).toBe(false);
    expect(c.stats).toBe(false);
    expect(crashReportsAllowed(c, ON)).toBe(false);
  });

  it('needs the remote switch as well as the opt-in', () => {
    const c = saveConsent(memoryStore(), { crash: true, stats: true, ageConfirmed18: true });
    expect(crashReportsAllowed(c, { ...ON, crashReports: false })).toBe(false);
    expect(statsAllowed(c, { ...ON, analytics: false })).toBe(false);
  });

  it('stops counting when the privacy notice version changes', () => {
    const c = saveConsent(memoryStore(), { crash: true, stats: true, ageConfirmed18: true });
    expect(crashReportsAllowed({ ...c, noticeVersion: 'older' }, ON)).toBe(false);
  });

  it('ignores a tampered or corrupt record', () => {
    const store = memoryStore();
    store.setItem('onaile.diagnostics.v1', '{"crash":"true","ageConfirmed18":1,"at":5}');
    expect(loadConsent(store)).toEqual(NO_CONSENT);
    store.setItem('onaile.diagnostics.v1', 'not json');
    expect(loadConsent(store)).toEqual(NO_CONSENT);
  });
});

describe('crash report scrubbing (PRIV-5)', () => {
  it('removes emails, long tokens and URL queries from text', () => {
    expect(scrubText('Bad save code eyJzdGFnZSI6MSwibmFpcmEiOjUwMDB9abcdef for ada@example.com')).toBe(
      'Bad save code [token] for [email]',
    );
    expect(scrubText('Failed https://ona-ile.asejik.com/?ref=someone#frag')).toBe(
      'Failed https://ona-ile.asejik.com/?[removed]',
    );
    expect(scrubText('x'.repeat(10) + ' ' + 'word '.repeat(200)).length).toBeLessThanOrEqual(300);
  });

  it('keeps only allow-listed fields', () => {
    const out = scrubEvent({
      event_id: 'abc',
      timestamp: 1,
      level: 'error',
      platform: 'javascript',
      release: 'ona-ile@0.2.0',
      environment: 'production',
      user: { ip_address: '{{auto}}', id: 'u1' },
      request: { url: 'https://example.com/?q=1', headers: { 'User-Agent': 'x' } },
      breadcrumbs: [{ message: 'clicked' }],
      extra: { save: 'secret' },
      sdk: { name: 'sentry.javascript.browser' },
      server_name: 'DESKTOP-ADA',
      tags: { platform: 'web', other: 'x' },
      contexts: {
        os: { name: 'Android', version: '14', build: 'abc' },
        browser: { name: 'Chrome', version: '130' },
        device: { family: 'Tecno', model: 'Spark 20', name: "Ada's phone" },
        culture: { locale: 'en-NG', timezone: 'Africa/Lagos' },
      },
      exception: {
        values: [
          {
            type: 'TypeError',
            value: 'x is undefined for ada@example.com',
            mechanism: { type: 'onerror', handled: false },
            stacktrace: {
              frames: [
                {
                  filename: 'https://ona-ile.asejik.com/assets/index-abc.js?v=1',
                  function: 'frame',
                  lineno: 10,
                  colno: 5,
                  in_app: true,
                  vars: { secret: 1 },
                } as never,
              ],
            },
          },
        ],
      },
    });
    expect(out).toEqual({
      event_id: 'abc',
      timestamp: 1,
      level: 'error',
      platform: 'javascript',
      release: 'ona-ile@0.2.0',
      environment: 'production',
      tags: { platform: 'web' },
      contexts: {
        os: { name: 'Android', version: '14' },
        browser: { name: 'Chrome', version: '130' },
        device: { family: 'Tecno', model: 'Spark 20' },
      },
      exception: {
        values: [
          {
            type: 'TypeError',
            value: 'x is undefined for [email]',
            mechanism: { type: 'onerror', handled: false },
            stacktrace: {
              frames: [
                { filename: '/assets/index-abc.js', function: 'frame', lineno: 10, colno: 5, in_app: true },
              ],
            },
          },
        ],
      },
    });
  });
});
