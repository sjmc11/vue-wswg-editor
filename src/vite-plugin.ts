// my-lib/src/plugin.ts
import type { Plugin, ViteDevServer } from "vite";
import { IFRAME_PREVIEW_ROUTE, IFRAME_APP_VIRTUAL_MODULE } from "./constants";

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
 * Generate the iframe preview HTML content
 * This creates a standalone HTML page that loads Vue from CDN and the iframe app module
 */
function generateIframePreviewHTML(baseUrl: string): string {
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

   return {
      name: "vue-wswg-editor-glob-plugin",
      enforce: "pre", // Run before other plugins to ensure import.meta.glob is processed correctly

      configureServer(server: ViteDevServer) {
         // Add middleware to serve the iframe preview HTML
         // This keeps the iframe on the same origin, allowing module imports to work
         server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith(IFRAME_PREVIEW_ROUTE)) {
               // Get the base URL from the request
               const protocol = req.headers["x-forwarded-proto"] || "http";
               const host = req.headers.host || "localhost:5173";
               const baseUrl = `${protocol}://${host}`;

               res.setHeader("Content-Type", "text/html");
               res.end(generateIframePreviewHTML(baseUrl));
               return;
            }
            next();
         });
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
               // Re-export the createIframeApp from the library source
               // This ensures it goes through Vite's module resolution
               return `export { createIframeApp } from 'vue-wswg-editor/src/components/IframePreview/iframePreviewApp';`;
            default:
               return undefined;
         }
      },

      transform(_code, id) {
         // Ensure import.meta.glob in virtual modules is processed correctly by Vite
         // This hook ensures the code goes through Vite's transform pipeline
         if (Object.values(virtualModules).includes(id)) {
            // Return null to let Vite process the code normally - this ensures import.meta.glob is transformed
            return null;
         }
      },
   };
}
