// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.guinezgalaz.cl',
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // No inlinear scripts en el HTML: la CSP (script-src 'self', sin
      // unsafe-inline) bloquea cualquier <script> inline. Forzamos que
      // todos los scripts de componentes se emitan como /_astro/*.js.
      assetsInlineLimit: 0,
    },
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
