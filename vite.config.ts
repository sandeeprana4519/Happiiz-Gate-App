import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'offline.html',
          '.htaccess',
          'guard/manifest.webmanifest',
          'guard/sw.js',
          'guard/offline.html',
          'guard/pwa-192x192.png',
          'guard/pwa-512x512.png',
          'guard/pwa-maskable-512x512.png',
          'guard/apple-touch-icon.png',
          'guard/icon.svg',
          'supporter/manifest.webmanifest',
          'supporter/sw.js',
          'supporter/offline.html',
          'supporter/pwa-192x192.png',
          'supporter/pwa-512x512.png',
          'supporter/pwa-maskable-512x512.png',
          'supporter/apple-touch-icon.png',
          'supporter/icon.svg',
          'partner/manifest.webmanifest',
          'partner/sw.js',
          'partner/offline.html',
          'partner/pwa-192x192.png',
          'partner/pwa-512x512.png',
          'partner/pwa-maskable-512x512.png',
          'partner/apple-touch-icon.png',
          'partner/icon.svg',
        ],
        manifest: {
          id: '/',
          name: 'Happiiz Gate App',
          short_name: 'Happiiz Gate',
          description:
            'Mobile-first Society Management, Security, Visitor Management and Facility Management Progressive Web Application.',
          theme_color: '#0A192F',
          background_color: '#0A192F',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['guard/**', 'supporter/**', 'partner/**'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/guard\/(manifest\.webmanifest|sw\.js|offline\.html|.*\.png|icon\.svg)/,
            /^\/supporter\/(manifest\.webmanifest|sw\.js|offline\.html|.*\.png|icon\.svg)/,
            /^\/partner\/(manifest\.webmanifest|sw\.js|offline\.html|.*\.png|icon\.svg)/,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
