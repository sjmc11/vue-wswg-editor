/**
 * Iframe Guard Utilities
 *
 * These utilities help consuming apps properly handle the iframe preview context.
 * When blocks and layouts are bundled with the consuming app, loading the iframe
 * preview chunk can trigger side effects from the parent app's code.
 *
 * This module provides utilities to detect and guard against this.
 */

/**
 * Check if the current context is the WSWG iframe preview.
 *
 * This checks multiple indicators:
 * 1. The `__wswg_iframe_preview` flag set by the preview HTML
 * 2. The URL path ending in `__wswg-iframe-preview.html`
 *
 * @returns true if running inside the WSWG iframe preview
 *
 * @example
 * ```typescript
 * // In your main.ts:
 * import { isWswgIframePreview } from 'vue-wswg-editor';
 * import { createApp } from 'vue';
 * import App from './App.vue';
 *
 * // Guard against iframe preview mode
 * if (!isWswgIframePreview()) {
 *   const app = createApp(App);
 *   const router = createRouter({ ... });
 *   app.use(router);
 *   app.mount('#app');
 * }
 * ```
 */
export function isWswgIframePreview(): boolean {
   if (typeof window === "undefined") {
      return false;
   }

   // Check the flag set by the iframe preview HTML
   if ((window as any).__wswg_iframe_preview === true) {
      return true;
   }

   // Check URL path
   const { pathname } = window.location;
   if (pathname === "/__wswg-iframe-preview.html" || pathname.endsWith("/__wswg-iframe-preview.html")) {
      return true;
   }

   return false;
}
