import { defineConfig } from "vite";
import path from "path";

// Separate config for building the vite plugin
export default defineConfig({
   build: {
      emptyOutDir: false, // Don't clear dist folder - preserve files from main build
      lib: {
         entry: path.resolve(__dirname, "src/vite-plugin.ts"),
         name: "vueWswgEditorPlugin",
         formats: ["es"],
         fileName: () => `vite-plugin.js`,
      },
      rollupOptions: {
         external: ["vite"],
         output: {
            globals: {
               vite: "vite",
            },
         },
      },
      outDir: "dist",
   },
});
