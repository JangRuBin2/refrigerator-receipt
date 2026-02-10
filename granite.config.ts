import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: '밀키퍼',
  brand: {
    displayName: '밀키퍼',
    icon: './public/icon-512.png',
    primaryColor: '#3182F6',
  },
  permissions: [],
  web: {
    host: 'https://refrigerator-receipt.vercel.app',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build',
    },
  },
  outdir: 'out',
});
