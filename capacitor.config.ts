import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calderecho.app',
  appName: 'Calendario Derecho',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Preferences: {
      group: 'group.com.calderecho.app',
    },
  },
};

export default config;
