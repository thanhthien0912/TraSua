import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trasua.app',
  appName: 'TraSua',
  webDir: 'out',
  server: {
    url: 'https://tra-sua.vercel.app',
    cleartext: true
  }
};

export default config;
