import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trasua.app',
  appName: 'TraSua App',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.22:3000', // Sửa IP này theo IP Laptop của bạn
    cleartext: true
  }
};

export default config;
