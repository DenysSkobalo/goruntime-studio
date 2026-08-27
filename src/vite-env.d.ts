/**
 * @file src/vite-env.d.ts
 * @module vite-env
 *
 * @architecture Ambient TypeScript Environment Declarations
 * @description Global type definitions for Vite environment build parameters, injected package constants,
 * asset module declarations, and Svelte compiler interfaces.
 */
/// <reference types="svelte" />
/// <reference types="vite/client" />

/** Injected application version string constant resolved from package.json during Vite bundling. ANCHOR: APP_VERSION_DECLARATION */
declare const __APP_VERSION__: string;

/** Module declaration enabling TypeScript imports for CSS stylesheets. ANCHOR: CSS_MODULE_DECLARATION */
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
