import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath, URL } from "url";

// Separate config for building the iframe preview bundle
export default defineConfig({
   plugins: [
      vue({
         template: {
            compilerOptions: {
               hoistStatic: false,
            },
         },
      }),
   ],
   define: {
      // Vue feature flags for better tree-shaking
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
   },
   resolve: {
      dedupe: ["vue"],
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
   },
   build: {
      emptyOutDir: false, // Don't clear dist folder - preserve files from main build
      lib: {
         entry: path.resolve(__dirname, "src/iframe-preview-entry.ts"),
         name: "IframePreview",
         formats: ["es"],
         fileName: () => `iframe-preview.js`,
      },
      rollupOptions: {
         // Externalize dependencies that are provided by consuming apps or CDN
         external: (id) => {
            // Externalize Vue - will be loaded from CDN in iframe
            if (id === "vue") {
               return true;
            }
            // Externalize optional dependencies
            if (id === "@vueuse/head" || id === "vue-router") {
               return true;
            }
            // Virtual modules must be external - they're resolved by the consuming app's vite plugin
            // When the library is consumed as source, the consuming app's build will process
            // the iframe preview code and resolve these virtual modules
            if (id.startsWith("vue-wswg-editor:")) {
               return true;
            }
            return false;
         },
         output: {
            globals: {
               vue: "Vue",
            },
            assetFileNames: (assetInfo) => {
               // Use a different name for iframe preview CSS to avoid overwriting main style.css
               if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                  return "iframe-preview.css";
               }
               return assetInfo.name || "asset";
            },
         },
      },
      cssCodeSplit: false,
      outDir: "dist",
   },
   css: {
      preprocessorOptions: {
         scss: {
            api: "modern-compiler",
         },
      },
   },
});
