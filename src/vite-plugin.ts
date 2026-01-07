// my-lib/src/plugin.ts
import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import { IFRAME_PREVIEW_ROUTE, IFRAME_APP_VIRTUAL_MODULE } from "./constants";
import * as fs from "fs";
import * as path from "path";

export type SkipableModule = "fields" | "thumbnails";

export interface VueWswgEditorPluginOptions {
   /**
    * Root directory in the host project.
    * Example: "@/features/homepage"
    */
   rootDir: string;
   /**
    * Array of module types to skip loading.
    * Skipped modules will return an empty object, preventing Vite from scanning those files.
    */
   skipModules?: SkipableModule[];
}

// Re-export constants for consuming apps
export { IFRAME_PREVIEW_ROUTE, IFRAME_APP_VIRTUAL_MODULE };

/**
 * Generate the iframe preview HTML content for development
 * Uses CDN-loaded Vue and dynamically imports the module
 */
function generateDevIframePreviewHTML(baseUrl: string): string {
   const vueCdnUrl = "https://unpkg.com/vue@3/dist/vue.esm-browser.js";
   const vueRouterCdnUrl = "https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js";
   // Use the virtual module which will be properly resolved by Vite
   const iframeAppUrl = `${baseUrl}/@id/__x00__${IFRAME_APP_VIRTUAL_MODULE}`;

   return `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Page Preview</title>
   <base href="${baseUrl}/">
   <!-- Import map to allow vue-router to resolve "vue" -->
   <!-- Stub for @vue/devtools-api to avoid loading devtools in iframe -->
   <script type="importmap">
   {
      "imports": {
         "vue": "${vueCdnUrl}",
         "vue-router": "${vueRouterCdnUrl}",
         "@vue/devtools-api": "data:text/javascript,export const setupDevtoolsPlugin=()=>{};export const on=()=>{};export const off=()=>{};export const once=()=>{};export const emit=()=>{};export const notifyComponentUpdate=()=>{};export const addTimelineLayer=()=>{};export const addCustomCommand=()=>{};export const addCustomTab=()=>{};"
      }
   }
   <\/script>
   <style>
      /* Base iframe styles */
      html, body {
         margin: 0;
         padding: 0;
         width: 100%;
         height: 100%;
         overflow-x: hidden;
      }
      
      #app {
         width: 100%;
         min-height: 100vh;
      }
      
      .page-renderer-wrapper {
         width: 100%;
      }
   </style>
</head>
<body>
   <div id="app"></div>
   <script>
      // Define Vue feature flags before Vue is loaded
      var __VUE_OPTIONS_API__ = true;
      var __VUE_PROD_DEVTOOLS__ = false;
      var __VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      window.__VUE_OPTIONS_API__ = true;
      window.__VUE_PROD_DEVTOOLS__ = false;
      window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
   <\/script>
   <script type="module">
      import { createApp } from 'vue';
      import * as VueRouter from 'vue-router';
      window.VueRouter = VueRouter;
      
      // Get module URL from query parameter or use the virtual module
      const urlParams = new URLSearchParams(window.location.search);
      const moduleUrl = urlParams.get('moduleUrl') || '${iframeAppUrl}';
      
      async function initApp(url) {
         try {
            const { createIframeApp } = await import(url);
            const appEl = document.getElementById('app');
            if (appEl) {
               await createIframeApp(appEl);
            }
         } catch (error) {
            console.error('Failed to load iframe app module:', error);
            const appEl = document.getElementById('app');
            if (appEl) {
               createApp({
                  template: '<div class="p-4 text-red-600">Failed to load preview: ' + error.message + '</div>'
               }).mount(appEl);
            }
         }
      }
      
      initApp(moduleUrl);
   <\/script>
</body>
</html>`;
}

/**
 * Generate the iframe preview HTML content for production
 *
 * CRITICAL: Uses import maps to load Vue and Vue Router from CDN.
 * This completely isolates the iframe from the parent app's Vue/Router instances,
 * preventing the parent app's route definitions from affecting the iframe.
 *
 * The iframe app chunk still gets bundled with the parent app (for blocks/layouts),
 * but Vue and Vue Router are loaded fresh from CDN with their own Symbol keys.
 */
function generateProdIframePreviewHTML(iframeAppChunkPath: string, base: string = "/"): string {
   // CDN URLs for Vue ecosystem - these are completely isolated from the parent app
   const vueCdnUrl = "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
   const vueRouterCdnUrl = "https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js";

   // Ensure base ends with /
   const normalizedBase = base.endsWith("/") ? base : `${base}/`;

   return `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Page Preview</title>
   <!-- 
      IMPORT MAP: Critical for iframe isolation!
      This makes the iframe use CDN versions of Vue and Vue Router,
      completely separate from the parent app's instances.
      The parent app's router (with all its route definitions) won't affect the iframe.
   -->
   <script type="importmap">
   {
      "imports": {
         "vue": "${vueCdnUrl}",
         "vue-router": "${vueRouterCdnUrl}",
         "@vue/devtools-api": "data:text/javascript,export const setupDevtoolsPlugin=()=>{};export const on=()=>{};export const off=()=>{};export const once=()=>{};export const emit=()=>{};export const notifyComponentUpdate=()=>{};export const addTimelineLayer=()=>{};export const addCustomCommand=()=>{};export const addCustomTab=()=>{};"
      }
   }
   <\/script>
   <style>
      /* Base iframe styles */
      html, body {
         margin: 0;
         padding: 0;
         width: 100%;
         height: 100%;
         overflow-x: hidden;
      }
      
      #app {
         width: 100%;
         min-height: 100vh;
      }
      
      .page-renderer-wrapper {
         width: 100%;
      }
      
      .iframe-preview-loading {
         display: flex;
         align-items: center;
         justify-content: center;
         min-height: 100vh;
         background: white;
         padding: 1.25rem;
      }
      
      .iframe-preview-loading__container {
         text-align: center;
         max-width: 28rem;
         padding-bottom: 1.75rem;
      }
      
      .iframe-preview-loading__spinner {
         width: 2rem;
         height: 2rem;
         margin: 0 auto;
         animation: spin 1s linear infinite;
         color: #2563eb;
      }
      
      .iframe-preview-loading__spinner-circle {
         opacity: 0.25;
      }
      
      .iframe-preview-loading__spinner-path {
         opacity: 0.75;
      }
      
      .iframe-preview-loading__text {
         display: block;
         margin-top: 1rem;
         color: #374151;
      }
      
      @keyframes spin {
         from { transform: rotate(0deg); }
         to { transform: rotate(360deg); }
      }
   </style>
</head>
<body>
   <div id="app"></div>
   <script>
      // Define Vue feature flags before Vue is loaded
      var __VUE_OPTIONS_API__ = true;
      var __VUE_PROD_DEVTOOLS__ = false;
      var __VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      window.__VUE_OPTIONS_API__ = true;
      window.__VUE_PROD_DEVTOOLS__ = false;
      window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      // CRITICAL: Mark this window as an iframe preview
      // This prevents the parent app's main.ts from initializing
      window.__wswg_iframe_preview = true;
   <\/script>
   <script type="module">
      // First, load Vue from CDN and put it on window
      // This ensures the iframe chunk uses our CDN Vue, not the parent's
      import * as Vue from 'vue';
      import * as VueRouter from 'vue-router';
      
      // Make available globally so the chunk can use them
      window.Vue = Vue;
      window.VueRouter = VueRouter;
      
      async function initApp() {
         try {
            // Import the bundled chunk - this contains blocks/layouts
            // but will use our CDN Vue/VueRouter thanks to the import map
            await import('${normalizedBase}${iframeAppChunkPath}');
            
            // Access createIframeApp from window (registered by iframePreviewEntry.ts)
            const createIframeApp = window.__wswg_createIframeApp;
            
            if (typeof createIframeApp !== 'function') {
               throw new Error('createIframeApp not found on window. The chunk may not have loaded correctly.');
            }
            
            // Get or create container
            let container = document.getElementById('app');
            if (!container) {
               container = document.createElement('div');
               container.id = 'app';
               document.body.appendChild(container);
            }
            
            await createIframeApp(container);
         } catch (error) {
            console.error('Failed to load iframe app module:', error);
            // Create error display
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 1rem; color: #dc2626;';
            errorDiv.textContent = 'Failed to load preview: ' + error.message;
            const app = document.getElementById('app');
            if (app) {
               app.innerHTML = '';
               app.appendChild(errorDiv);
            }
         }
      }
      
      initApp();
   <\/script>
</body>
</html>`;
}

export function vueWswgEditorPlugin(options: VueWswgEditorPluginOptions): Plugin {
   const virtualModules = {
      blocks: "\0vue-wswg-editor:blocks",
      fields: "\0vue-wswg-editor:fields",
      layouts: "\0vue-wswg-editor:layouts",
      thumbnails: "\0vue-wswg-editor:thumbnails",
      themes: "\0vue-wswg-editor:themes",
      iframeApp: `\0${IFRAME_APP_VIRTUAL_MODULE}`,
   };

   const shouldSkip = (module: keyof typeof virtualModules) =>
      options.skipModules?.includes(module as SkipableModule) ?? false;

   // Store resolved config for use in generateBundle
   let resolvedBase = "/";

   return {
      name: "vue-wswg-editor-glob-plugin",
      enforce: "pre", // Run before other plugins to ensure import.meta.glob is processed correctly

      // Store the resolved config
      configResolved(config) {
         resolvedBase = config.base || "/";
      },

      buildStart() {
         // Ensure virtual modules are included in the build graph
         // This is critical for production builds where import.meta.glob needs to be transformed
         // By calling this.resolve, we ensure the virtual modules are added to the module graph
         if (!shouldSkip("blocks")) {
            this.resolve(virtualModules.blocks).catch(() => {
               // Ignore errors - virtual modules will be resolved by resolveId
            });
         }
         if (!shouldSkip("layouts")) {
            this.resolve(virtualModules.layouts).catch(() => {
               // Ignore errors - virtual modules will be resolved by resolveId
            });
         }
         if (!shouldSkip("fields")) {
            this.resolve(virtualModules.fields).catch(() => {
               // Ignore errors - virtual modules will be resolved by resolveId
            });
         }
         if (!shouldSkip("themes")) {
            this.resolve(virtualModules.themes).catch(() => {
               // Ignore errors - virtual modules will be resolved by resolveId
            });
         }
      },

      configureServer(server: ViteDevServer) {
         // Add middleware to serve the iframe preview HTML (development only)
         // This keeps the iframe on the same origin, allowing module imports to work
         server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith(IFRAME_PREVIEW_ROUTE)) {
               // Get the base URL from the request
               const protocol = req.headers["x-forwarded-proto"] || "http";
               const host = req.headers.host || "localhost:5173";
               const baseUrl = `${protocol}://${host}`;

               res.setHeader("Content-Type", "text/html");
               res.end(generateDevIframePreviewHTML(baseUrl));
               return;
            }
            next();
         });
      },

      configurePreviewServer(server: PreviewServer) {
         // Add middleware to serve the iframe preview HTML in preview mode
         // By NOT returning a function, our middleware runs BEFORE built-in middleware
         // This ensures we handle the request before SPA fallback kicks in
         server.middlewares.use((req, res, next) => {
            // Check if this is a request for the iframe preview HTML
            const url = req.url?.split("?")[0]; // Remove query params
            if (url === IFRAME_PREVIEW_ROUTE) {
               // Get the output directory - build.outDir is relative to project root
               const outDir = server.config.build.outDir || "dist";
               // The HTML file is at the root of the output directory
               const htmlFileName = IFRAME_PREVIEW_ROUTE.replace(/^\//, "");
               const htmlPath = path.resolve(outDir, htmlFileName);

               try {
                  if (fs.existsSync(htmlPath)) {
                     const html = fs.readFileSync(htmlPath, "utf-8");
                     res.setHeader("Content-Type", "text/html");
                     res.setHeader("Cache-Control", "no-store");
                     res.end(html);
                     return;
                  } else {
                     console.warn("[vue-wswg-editor] Iframe preview HTML not found at:", htmlPath);
                  }
               } catch (e) {
                  console.error("[vue-wswg-editor] Error reading iframe preview HTML:", e);
               }
            }
            next();
         });
      },

      generateBundle(_outputOptions, bundle) {
         // Generate the iframe preview HTML file for production builds
         // Find the chunk that contains createIframeApp
         let iframeAppChunkPath: string | null = null;

         // Primary method: look for chunk that contains the iframe preview app code markers
         // This is the most reliable as it checks actual bundle content
         // IFRAME_READY is a unique message type only in the iframe preview app
         for (const [fileName, chunk] of Object.entries(bundle)) {
            if (chunk.type === "chunk" && chunk.code) {
               // Check for IFRAME_READY message (unique to iframe preview) and postMessage call
               if (chunk.code.includes("IFRAME_READY") && chunk.code.includes("postMessage")) {
                  iframeAppChunkPath = fileName;
                  break;
               }
            }
         }

         // Fallback: look for a dedicated vue-wswg-editor chunk (not virtual modules)
         if (!iframeAppChunkPath) {
            for (const [fileName, chunk] of Object.entries(bundle)) {
               if (chunk.type === "chunk") {
                  // Only match dedicated chunks, not virtual modules (which start with _vue-wswg-editor_)
                  const isDedicatedChunk =
                     chunk.name === "vue-wswg-editor" ||
                     (fileName.includes("vue-wswg-editor") && !fileName.startsWith("_vue-wswg-editor_"));

                  if (isDedicatedChunk) {
                     iframeAppChunkPath = fileName;
                     break;
                  }
               }
            }
         }

         // Last resort: look for any chunk with iframePreviewApp or iframePreviewEntry in its modules
         if (!iframeAppChunkPath) {
            for (const [fileName, chunk] of Object.entries(bundle)) {
               if (chunk.type === "chunk") {
                  const modules = Object.keys(chunk.modules || {});
                  if (modules.some((mod) => mod.includes("iframePreviewApp") || mod.includes("iframePreviewEntry"))) {
                     iframeAppChunkPath = fileName;
                     break;
                  }
               }
            }
         }

         // Generate the HTML file as a direct .html file (not directory/index.html)
         // This avoids SPA fallback issues in production servers
         // Remove the leading slash from IFRAME_PREVIEW_ROUTE
         const htmlFileName = IFRAME_PREVIEW_ROUTE.replace(/^\//, "");

         // If we found the chunk, generate the HTML file with correct path
         if (iframeAppChunkPath) {
            this.emitFile({
               type: "asset",
               fileName: htmlFileName,
               source: generateProdIframePreviewHTML(iframeAppChunkPath, resolvedBase),
            });
         } else {
            // Fallback: emit HTML with a guessed chunk path
            // The consuming app should configure manualChunks to name the vue-wswg-editor chunk
            console.warn(
               "[vue-wswg-editor] Could not find iframe app chunk. " +
                  "Make sure vue-wswg-editor is included in your build and exports createIframeApp."
            );

            this.emitFile({
               type: "asset",
               fileName: htmlFileName,
               source: generateProdIframePreviewHTML("assets/vue-wswg-editor.js", resolvedBase),
            });
         }
      },

      config(config) {
         // Exclude vue-wswg-editor from dependency optimization to prevent esbuild
         // from trying to resolve virtual modules before plugins run
         const optimizeDeps = config.optimizeDeps || {};
         const existingExclude = optimizeDeps.exclude;
         let exclude: string[];
         if (Array.isArray(existingExclude)) {
            exclude = [...existingExclude];
         } else if (typeof existingExclude === "string") {
            exclude = [existingExclude];
         } else {
            exclude = [];
         }
         // Exclude the package and virtual modules
         const itemsToExclude = [
            "vue-wswg-editor",
            "vue-wswg-editor:layouts",
            "vue-wswg-editor:blocks",
            "vue-wswg-editor:fields",
            "vue-wswg-editor:thumbnails",
            "vue-wswg-editor:themes",
            IFRAME_APP_VIRTUAL_MODULE,
         ];
         for (const item of itemsToExclude) {
            if (!exclude.includes(item)) {
               exclude.push(item);
            }
         }
         return {
            optimizeDeps: {
               ...optimizeDeps,
               exclude,
               esbuildOptions: {
                  ...optimizeDeps.esbuildOptions,
                  plugins: [
                     ...(optimizeDeps.esbuildOptions?.plugins || []),
                     {
                        name: "vue-wswg-editor-virtual-modules",
                        setup(build) {
                           // Mark virtual modules as external during esbuild optimization
                           build.onResolve({ filter: /^vue-wswg-editor:/ }, () => {
                              return { external: true };
                           });
                           build.onResolve({ filter: /^virtual:wswg-/ }, () => {
                              return { external: true };
                           });
                        },
                     },
                  ],
               },
            },
         };
      },

      resolveId(id) {
         // Handle virtual module imports like "vue-wswg-editor:layouts"
         if (id.startsWith("vue-wswg-editor:")) {
            const suffix = id.replace("vue-wswg-editor:", "");
            if (suffix in virtualModules) {
               return virtualModules[suffix as keyof typeof virtualModules];
            }
         }
         // Handle iframe app virtual module
         if (id === IFRAME_APP_VIRTUAL_MODULE) {
            return virtualModules.iframeApp;
         }
         // Handle already resolved virtual module IDs (with \0 prefix)
         const virtualModuleValues = Object.values(virtualModules);
         if (virtualModuleValues.includes(id)) {
            return id;
         }
      },

      load(id) {
         // Generate code that Vite will process - ensure import.meta.glob is at top level
         // Using a more explicit format to ensure Vite processes it correctly
         // In production builds, Vite will transform import.meta.glob into static imports
         // The alias resolution happens automatically during Vite's transform phase
         switch (id) {
            case virtualModules.layouts:
               return shouldSkip("layouts")
                  ? `export const modules = {};`
                  : `export const modules = import.meta.glob("${options.rootDir}/*/layout/**/*.vue", { eager: true });`;
            case virtualModules.blocks:
               return shouldSkip("blocks")
                  ? `export const modules = {};`
                  : `export const modules = import.meta.glob("${options.rootDir}/*/blocks/**/*.vue", { eager: true });`;
            case virtualModules.fields:
               return shouldSkip("fields")
                  ? `export const modules = {};`
                  : `export const modules = import.meta.glob("${options.rootDir}/*/blocks/**/fields.ts", { eager: false });`;
            case virtualModules.thumbnails:
               return shouldSkip("thumbnails")
                  ? `export const modules = {};`
                  : `export const modules = import.meta.glob(["${options.rootDir}/*/blocks/**/thumbnail.png", "${options.rootDir}/*/thumbnail.jpg", "${options.rootDir}/*/thumbnail.png"], { eager: true });`;
            case virtualModules.themes:
               return shouldSkip("themes")
                  ? `export const modules = {};`
                  : `export const modules = import.meta.glob("${options.rootDir}/**/theme.config.js", { eager: true });`;
            case virtualModules.iframeApp:
               // Re-export the createIframeApp from the isolated entry point
               // This entry point is designed to work with CDN-loaded Vue/VueRouter
               return `export { createIframeApp } from 'vue-wswg-editor/src/components/IframePreview/iframePreviewEntry';`;
            default:
               return undefined;
         }
      },

      transform(_code, id) {
         // Ensure import.meta.glob in virtual modules is processed correctly by Vite
         // This hook ensures the code goes through Vite's transform pipeline
         if (Object.values(virtualModules).includes(id)) {
            // Return null to let Vite process the code normally - this ensures import.meta.glob is transformed
            // In production builds, Vite will transform import.meta.glob into static imports
            return null;
         }
         // Also handle virtual modules that might be imported with query parameters
         if (
            id.includes("vue-wswg-editor:") &&
            Object.values(virtualModules).some((vm) => id.includes(vm.replace("\0", "")))
         ) {
            return null;
         }
      },
   };
}
