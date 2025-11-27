/// <reference types="vitest" />

import { fileURLToPath, URL } from "url";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [
      vue({
         template: {
            compilerOptions: {
               hoistStatic: false,
            },
         },
      }),
      // Plugin to transform @page-builder aliases in import.meta.glob
      // During library build, we transform globs to empty patterns to avoid processing page-builder files
      // When consumed as source by other apps, their transform plugin will override this with actual paths
      {
         name: "transform-glob-aliases",
         enforce: "pre", // Run before other plugins
         transform(code, id) {
            const cleanId = id.split("?")[0];
            // Transform globs in registry.ts, blockModules.ts, and other files that use @page-builder
            if (
               (cleanId.includes("registry.ts") ||
                  cleanId.includes("blockModules.ts") ||
                  cleanId.includes("PageRenderer")) &&
               code.includes("import.meta.glob") &&
               code.includes("@page-builder")
            ) {
               // During library build, transform to an empty glob pattern
               // This prevents Vite from processing page-builder files during library build
               // The consuming apps will override this with their own transform plugin
               const transformedCode = code.replace(
                  /import\.meta\.glob\s*\(\s*(["'])@page-builder\/([^"']+)\1\s*([^)]*)\s*\)/g,
                  (_match: string, quote: string, globPath: string, options: string) => {
                     // Use a pattern that matches nothing - this prevents Vite from processing files
                     // The consuming app's transform plugin will replace this with the actual path
                     return `import.meta.glob(${quote}./__empty__/**/*${quote}${options})`;
                  }
               );

               if (transformedCode !== code) {
                  return transformedCode;
               }
            }
            return null;
         },
      } as Plugin,
   ],
   resolve: {
      // Ensures these are sourced from the application's node_modules directory
      dedupe: ["vue"],
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
         // NOTE: @page-builder alias is NOT defined here - it must be provided by the consuming app
         // This library uses import.meta.glob with @page-builder paths, which will be resolved
         // by the consuming app's Vite build. The library should be consumed as SOURCE CODE,
         // not as a pre-built package, for the globs to work correctly.
         // @sano-ui-library is externalized but needs to be resolvable during build
         // For library dev builds, point to the sano-ui-library directory
         "@sano-ui-library": fileURLToPath(new URL("../../../sano/sano-ui-library", import.meta.url)),
      },
   },
   build: {
      copyPublicDir: false,
      lib: {
         entry: path.resolve(__dirname, "src/index.ts"),
         name: "VueWswgEditor",
         formats: ["es"],
         fileName: () => `vue-wswg-editor.es.js`,
      },
      rollupOptions: {
         // Externalize dependencies that are provided by consuming apps
         // These will be resolved at runtime from the consuming app's node_modules
         external: [
            "vue",
            "yup",
            // sano-ui-library is provided by consuming apps, not bundled with the library
            /^@sano-ui-library/,
         ],
         output: {
            globals: {
               vue: "Vue",
            },
            assetFileNames: (assetInfo) => {
               // Ensure CSS is named style.css
               if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                  return "style.css";
               }
               return assetInfo.name || "asset";
            },
         },
         plugins: [
            {
               name: "rename-css",
               generateBundle(options, bundle) {
                  // Rename any CSS files to style.css
                  for (const fileName in bundle) {
                     const chunk = bundle[fileName];
                     if (chunk.type === "asset" && fileName.endsWith(".css")) {
                        const newFileName = "style.css";
                        if (fileName !== newFileName) {
                           bundle[newFileName] = chunk;
                           delete bundle[fileName];
                        }
                     }
                  }
               },
            },
         ],
      },
      cssCodeSplit: false,
   },
   css: {
      preprocessorOptions: {
         scss: {
            api: "modern-compiler",
         },
      },
   },
   test: {
      environment: "jsdom",
      globals: true,
      include: ["**/*.test.ts", "**/*.test.tsx"],
      exclude: ["node_modules", "dist"],
      setupFiles: ["./test/setup.ts"],
   },
});
