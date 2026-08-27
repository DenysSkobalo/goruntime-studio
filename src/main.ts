/**
 * @file src/main.ts
 * @module main
 *
 * @architecture Client Application Entry Bootstrap Point
 * @description Client-side entry point mounting the Svelte 5 root application component into DOM container,
 * loading global CSS stylesheets, and bootstrapping single-page application lifecycle.
 *
 * @see {@link App} Root application Svelte component.
 */
import { mount } from 'svelte';
import './app.css';
import App from './app/App.svelte';

/**
 * Mounts Svelte 5 root application component into target DOM container.
 * ANCHOR: MOUNT_APP_BOOTSTRAP
 */
const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
