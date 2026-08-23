import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      '$lib': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '$core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '$features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '$shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '$app': fileURLToPath(new URL('./src/app', import.meta.url)),
    }
  }
});
