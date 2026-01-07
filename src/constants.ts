/**
 * Shared constants for the vue-wswg-editor library
 */

/**
 * The route path for the iframe preview HTML file
 * This is served by the Vite dev server middleware and generated as a static file in production
 * Using .html extension directly (not directory/index.html) to avoid SPA fallback issues
 */
export const IFRAME_PREVIEW_ROUTE = "/__wswg-iframe-preview.html";

/**
 * Virtual module ID for the iframe app
 * This ensures the module is properly resolved by Vite even in WebContainer environments
 */
export const IFRAME_APP_VIRTUAL_MODULE = "virtual:wswg-iframe-app";
