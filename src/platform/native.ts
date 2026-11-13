import { Capacitor } from '@capacitor/core';

/** Where the game is published. The Android app reads live settings from here. */
export const LIVE_ORIGIN = 'https://ona-ile.asejik.com';

/** 'android' inside the Capacitor app, 'web' in a browser. Used to tag crash reports. */
export const PLATFORM: 'web' | 'android' = Capacitor.getPlatform() === 'android' ? 'android' : 'web';

/**
 * The remote-switch file (PRIV-11). In a browser it sits next to the game. Inside the app the game's
 * own files are bundled in the APK, so a bundled config.json could never be switched off; read the
 * live one instead (public/_headers allows the app's https://localhost origin to read it).
 */
export function configUrl(baseUrl: string, platform: 'web' | 'android' = PLATFORM): string {
  return platform === 'android' ? `${LIVE_ORIGIN}/config.json` : `${baseUrl}config.json`;
}
