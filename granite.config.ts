import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'acorn',
  brand: {
    displayName: '밀키퍼',
    icon: 'https://static.toss.im/appsintoss/20071/c0a9e942-eb1f-440e-8021-163501f7463a.png',
    primaryColor: '#3182F6',
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
    bounces: false,
    overScrollMode: 'never',
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
