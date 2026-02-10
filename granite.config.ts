import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'acorn',
  brand: {
    displayName: '밀키퍼',
    icon: './public/icon-512.png',
    primaryColor: '#3182F6',
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
  },
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build && node scripts/fix-root-html.mjs',
    },
  },
  outdir: 'out',
});
