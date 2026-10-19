import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath, URL } from 'node:url';

/**
 * Architecture notes
 * - `manualChunks` splits framework code (react, router) and animation code
 *   (framer-motion) from app code so returning visitors keep them cached across deploys.
 * - Pages are lazy-loaded in App.tsx, so each route is its own small chunk.
 * - The PWA plugin precaches the built shell and uses `autoUpdate` so users get new
 *   versions without a manual refresh prompt. All app data lives in localStorage, so
 *   the app is fully usable offline once installed.
 * - Run `npm run analyze` to emit dist/stats.html with a bundle treemap.
 */
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PromptForge',
        short_name: 'PromptForge',
        description:
          'Turn a rough idea into a well-engineered AI prompt, then learn why it works.',
        theme_color: '#5b5bd6',
        background_color: '#0b0b0f',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'education'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'New prompt', url: '/', description: 'Generate a new prompt' },
          { name: 'Review cards', url: '/review', description: 'Practice due cards' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
    mode === 'analyze' &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
