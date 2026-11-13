import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asejik.onaile',
  appName: 'Ọ̀nà Ilé',
  webDir: 'dist',
  android: {
    // The game runs from https://localhost inside the app; nothing loads over plain http.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
