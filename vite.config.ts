import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/shared', import.meta.url)),
      $core: fileURLToPath(new URL('./src/core', import.meta.url)),
      $features: fileURLToPath(new URL('./src/features', import.meta.url)),
      $shared: fileURLToPath(new URL('./src/shared', import.meta.url)),
      $app: fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
