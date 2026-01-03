/**
 * Shared constants for the vue-wswg-editor library
 */

/**
 * The route path for the iframe preview HTML
 * This is served by the Vite dev server to keep the iframe on the same origin
 */
export const IFRAME_PREVIEW_ROUTE = "/__wswg-iframe-preview";

/**
 * Virtual module ID for the iframe app
 * This ensures the module is properly resolved by Vite even in WebContainer environments
 */
export const IFRAME_APP_VIRTUAL_MODULE = "virtual:wswg-iframe-app";

