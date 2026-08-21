import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import VitePWA from '@vite-pwa/astro';
import sitemap from '@astrojs/sitemap';

const R2_MEDIA_ORIGIN = 'https://media.amdo.app';

// https://astro.build/config
export default defineConfig({
  site: 'https://amdo.app',
  // Default output is fully static — no SSR adapter (deploys to Netlify as static).
  prefetch: { prefetchAll: true },
  integrations: [
    sitemap(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: 'Amdo Stories',
        short_name: 'Amdo',
        description: '11 oral Bible stories, Creation to Christ, narrated in the Amdo dialect of Tibetan',
        theme_color: '#0d2d3d',
        background_color: '#0d2d3d',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,webp,png,jpg,svg}'],
        runtimeCaching: [
          {
            // Audio/video hosted on R2 — cache what's been played for offline replay,
            // but never block the network waiting on cache (media is large; don't precache).
            urlPattern: new RegExp(`^${R2_MEDIA_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'amdo-media-cache',
              cacheableResponse: { statuses: [0, 200, 206] },
              rangeRequests: true,
              expiration: { maxEntries: 33, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
