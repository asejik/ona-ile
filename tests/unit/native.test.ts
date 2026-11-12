import { describe, expect, it } from 'vitest';
import { LIVE_ORIGIN, configUrl } from '../../src/platform/native';

describe('configUrl (PRIV-11 in the app)', () => {
  it('reads config.json next to the game in a browser', () => {
    expect(configUrl('./', 'web')).toBe('./config.json');
  });

  it('reads the live config.json inside the Android app, so the off switch reaches installed apps', () => {
    expect(configUrl('./', 'android')).toBe('https://ona-ile.asejik.com/config.json');
    expect(LIVE_ORIGIN.startsWith('https://')).toBe(true);
  });

  it('is "web" when not running inside Capacitor', async () => {
    const { PLATFORM } = await import('../../src/platform/native');
    expect(PLATFORM).toBe('web');
  });
});
