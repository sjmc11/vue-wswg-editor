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
      // import.meta.glob doesn't support aliases, so we transform them to a pattern
      // that will be empty during library build but work when consumed as source
      {
         name: "transform-glob-aliases",
         transform(code, id) {
            if (id.includes("registry.ts")) {
               // Transform @page-builder alias to a relative path pattern
               // This will be empty during library build but resolved by consuming app
               return code.replace(
                  /import\.meta\.glob\(["']@page-builder\/([^"']+)["']/g,
                  (match, path) => {
                     // Use a pattern that won't match during library build
                     // The consuming app's Vite will resolve @page-builder alias correctly
                     return `import.meta.glob("../../page-builder/${path}"`;
                  }
               );
            }
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
         external: ["vue"],
         output: {
            globals: {
               vue: "Vue",
            },
         },
         plugins: [
            {
               name: "inject-css-import",
               generateBundle(options, bundle) {
                  // Inject CSS import at the top of the bundle
                  for (const fileName in bundle) {
                     const chunk = bundle[fileName];
                     if (chunk.type === "chunk" && fileName.endsWith(".es.js")) {
                        chunk.code = `import "vue-wswg-editor/style.css";\n${chunk.code}`;
                     }
                  }
               },
            },
         ],
      },
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
