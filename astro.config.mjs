// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.guinezgalaz.cl',
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/pago-resultado') &&
        !page.includes('/gracias'),
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-CL',
          en: 'en-US',
          zh: 'zh-CN',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'zh'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
