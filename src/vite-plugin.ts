// my-lib/src/plugin.ts
import type { Plugin } from "vite";

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

export function vueWswgEditorPlugin(options: VueWswgEditorPluginOptions): Plugin {
   const virtualModules = {
      blocks: "\0vue-wswg-editor:blocks",
      fields: "\0vue-wswg-editor:fields",
      layouts: "\0vue-wswg-editor:layouts",
      thumbnails: "\0vue-wswg-editor:thumbnails",
      themes: "\0vue-wswg-editor:themes",
   };

   const shouldSkip = (module: keyof typeof virtualModules) =>
      options.skipModules?.includes(module as SkipableModule) ?? false;

   return {
      name: "vue-wswg-editor-glob-plugin",
      enforce: "pre", // Run before other plugins to ensure import.meta.glob is processed correctly

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
