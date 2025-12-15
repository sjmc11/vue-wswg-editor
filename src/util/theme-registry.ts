import { shallowRef, markRaw, type Ref } from "vue";
import type { Theme } from "../types/Theme";
import type { Layout } from "../types/Layout";
import type { Block } from "../types/Block";
import { generateNameVariations, toCamelCase } from "./helpers";
import { EditorFieldConfig } from "./fieldConfig";

// Load all thumbnail images - Vite will process these as assets and provide URLs
// For images, Vite returns the URL as the default export when using eager: true
// const thumbnailModules = import.meta.glob("@page-builder/blocks/**/thumbnail.png", { eager: true });

/**
 * Registry of all page builder themes, blocks, layouts, fields & thumbnails
 */
export const pageBuilderThemes: Ref<Record<string, Theme>> = shallowRef({});
export const themeLayouts: Ref<Record<string, Layout>> = shallowRef({});
export const themeBlocks: Ref<Record<string, Block>> = shallowRef({});
export const themeBlockFields: Ref<Record<string, Record<string, EditorFieldConfig>>> = shallowRef({});
export const activeThemeId: Ref<string | undefined> = shallowRef(undefined);
let blockThumbnails: Record<string, any> | null = null; // non reactive cache of block thumbnails
let themeThumbnails: Record<string, any> | null = null; // non reactive cache of theme thumbnails

////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////

/**
 * Extract the default export from a module, handling different module formats
 * Works with both eager and lazy-loaded modules from import.meta.glob
 */
export function getModuleDefault(module: any): any {
   if (!module) return undefined;

   // If module is a function (lazy-loaded), we'd need to await it, but with eager: true it should be resolved
   if (typeof module === "function") {
      // This shouldn't happen with eager: true, but handle it just in case
      return undefined;
   }

   // Try .default first (standard ES module format)
   if (typeof module === "object") {
      // Check if it has .default property
      if ("default" in module && module.default !== undefined) {
         return module.default;
      }
      // If no .default but module has component-like properties (__name, etc.), maybe module itself is the component
      if ("__name" in module || "name" in module || "setup" in module || "render" in module) {
         return module;
      }
   }

   // Fallback: return the module as-is
   return module;
}

/**************************************************
 * THEMES
 **************************************************/
export async function initialiseThemeRegistry(): Promise<void> {
   // Clear existing registry
   Object.keys(pageBuilderThemes.value).forEach((key) => {
      delete pageBuilderThemes.value[key];
   });

   // Lazy load virtual modules to prevent initialization order issues
   const { modules: themeModules } = await import("vue-wswg-editor:themes");

   for (const [path, module] of Object.entries(themeModules)) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const themeConfig = getModuleDefault(resolvedModule);
      if (!themeConfig) continue;

      // Extract theme ID from directory name containing theme.config.js
      // Path format: "@page-builder/demo-theme/theme.config.js" -> theme ID is "demo-theme"
      const pathParts = path.split("/");
      // Remove the filename (theme.config.js) to get the directory path
      const directoryPath = path.replace(/\/[^/]+\.config\.js$/, "");
      // Get the directory name (second to last part of the path)
      const themeId = pathParts[pathParts.length - 2];

      if (!themeId) continue;

      const theme: Theme = {
         id: themeId,
         path: directoryPath,
         title: themeConfig.title || themeId,
         description: themeConfig.description || "",
         version: themeConfig.version || "1.0.0",
         author: themeConfig.author || "",
         authorWebsite: themeConfig.authorWebsite || "",
         tags: themeConfig.tags || [],
         license: themeConfig.license || "",
      };

      pageBuilderThemes.value[themeId] = theme;
   }

   // If there are no themes, throw an error
   if (Object.keys(pageBuilderThemes.value).length === 0) {
      console.error("[vue-wswg-editor:registry] No themes found");
      return;
   }
}

export function getThemes(): Theme[] {
   return Object.values(pageBuilderThemes.value);
}

export function getActiveTheme(): Theme {
   if (!activeThemeId.value) {
      throw new Error("No active theme found");
   }
   return pageBuilderThemes.value[activeThemeId.value];
}

export async function setActiveTheme(themeId?: string): Promise<void> {
   // If the themeID is not found, set the active theme ID to the first theme in the registry
   if (!themeId || !pageBuilderThemes.value[themeId]) {
      const firstThemeId = Object.keys(pageBuilderThemes.value)[0];
      if (!firstThemeId) {
         throw new Error("[vue-wswg-editor:registry] No themes found. Cannot set active theme.");
      }
      activeThemeId.value = firstThemeId;
      console.warn(
         `[vue-wswg-editor:registry] No theme found with ID: ${themeId}, setting active theme to: ${activeThemeId.value}`
      );
   } else {
      activeThemeId.value = themeId;
   }
}

/**************************************************
 * THEME THUMBNAILS
 **************************************************/
async function initialiseThemeThumbnailsRegistry(): Promise<void> {
   const { modules: thumbnailModules } = await import("vue-wswg-editor:thumbnails");
   themeThumbnails = thumbnailModules;
}

export function getThemeThumbnail(themeDirectory: string): string | undefined {
   if (!themeDirectory || !themeThumbnails) return undefined;

   // Try thumbnail.jpg first, then fall back to thumbnail.png
   const thumbnailPaths = [`${themeDirectory}/thumbnail.jpg`, `${themeDirectory}/thumbnail.png`];

   for (const thumbnailPath of thumbnailPaths) {
      const thumbnailModule = themeThumbnails[thumbnailPath];
      if (thumbnailModule) {
         try {
            const thumbnailUrl = (thumbnailModule as any)?.default;
            if (thumbnailUrl) {
               return thumbnailUrl as string;
            }
         } catch {
            // Silently continue to next format if this one fails
            continue;
         }
      }
   }

   // Return undefined if no thumbnail found
   return undefined;
}

/**************************************************
 * LAYOUTS
 **************************************************/
export async function initialiseLayoutRegistry(): Promise<void> {
   // Clear existing registry
   Object.keys(themeLayouts.value).forEach((key) => {
      delete themeLayouts.value[key];
   });

   // Get the active theme
   const activeTheme = getActiveTheme();

   // Use virtual module to load all layouts (scans all themes at build time)
   // Then filter to only process layouts from the active theme
   const { modules: layoutModules } = await import("vue-wswg-editor:layouts");

   // Filter to only layouts from the active theme
   const themeLayoutPath = `${activeTheme.path}/layout`;
   const themeLayoutModules = Object.entries(layoutModules).filter(([path]) => path.startsWith(themeLayoutPath));

   // Process only the active theme's layouts
   for (const [, module] of themeLayoutModules) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const layout = getModuleDefault(resolvedModule);
      // exclude modules without name or label
      if (!layout || !layout.label) {
         continue;
      }
      // Mark layout component as raw to prevent Vue from making it reactive
      themeLayouts.value[layout.__name] = markRaw(layout);
   }
   // If there are no layouts, warn
   if (Object.keys(themeLayouts.value).length === 0) {
      console.warn(`[vue-wswg-editor:registry] No layouts found for theme: ${activeTheme.id}`);
      return;
   }
}

export function getLayout(layoutType: string): Layout | undefined {
   // Generate name variations and try to find a match
   const nameVariations = generateNameVariations(layoutType);

   for (const variation of nameVariations) {
      const layout = themeLayouts.value[variation];
      if (layout) {
         return layout;
      }
   }

   return undefined;
}

/**************************************************
 * BLOCK FIELDS
 **************************************************/
async function initialiseBlockFieldsRegistry(): Promise<void> {
   // Clear existing registry
   Object.keys(themeBlockFields.value).forEach((key) => {
      delete themeBlockFields.value[key];
   });

   // Get the active theme
   const activeTheme = getActiveTheme();

   // Use virtual module to load all block fields (scans all themes at build time)
   // Then filter to only process block fields from the active theme
   const { modules: blockFieldsModules } = await import("vue-wswg-editor:fields");

   // Filter to only block fields from the active theme
   const themeBlockFieldsPath = `${activeTheme.path}/blocks`;
   const themeBlockFieldsModules = Object.entries(blockFieldsModules).filter(([path]) =>
      path.startsWith(themeBlockFieldsPath)
   );

   // Process only the active theme's block fields
   for (const [path, module] of themeBlockFieldsModules) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const blockFields = getModuleDefault(resolvedModule);
      // Mark block fields component as raw to prevent Vue from making it reactive
      themeBlockFields.value[path] = markRaw(blockFields);
   }
}

function getBlockFieldsFile(path: string): Record<string, EditorFieldConfig> {
   const fieldsPath = `${path}/fields.ts`;
   try {
      // Generate path for fields.ts file
      const blockField = themeBlockFields.value[fieldsPath];
      if (blockField) {
         return blockField;
      }
      return {};
   } catch (error) {
      console.error("Error getting block fields for block: ", fieldsPath, error);
      return {};
   }
}

/**************************************************
 * BLOCKS
 **************************************************/
export async function initialiseBlockRegistry(): Promise<void> {
   // Clear existing registry
   Object.keys(themeBlocks.value).forEach((key) => {
      delete themeBlocks.value[key];
   });

   // Get the active theme
   const activeTheme = getActiveTheme();

   // Use virtual module to load all layouts (scans all themes at build time)
   // Then filter to only process layouts from the active theme
   const { modules: blockModules } = await import("vue-wswg-editor:blocks");

   // Filter to only layouts from the active theme
   const themeBlockPath = `${activeTheme.path}/blocks`;
   const themeBlockModules = Object.entries(blockModules).filter(([path]) => path.startsWith(themeBlockPath));

   // Process only the active theme's layouts
   for (const [path, module] of themeBlockModules) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const blockModule = getModuleDefault(resolvedModule);
      // exclude modules without name or label
      if (!blockModule || !blockModule.__name) {
         continue;
      }

      // Format the block
      const blockType = toCamelCase(blockModule.type || blockModule.__name);
      // Extract directory path from component path (e.g., "@page-builder/my-theme/blocks/hero-section/hero-section.vue" -> "@page-builder/my-theme/blocks/hero-section")
      const directory = path.replace(/\/[^/]+\.vue$/, "");
      // Mark the component itself as raw before spreading
      const rawComponent = markRaw(blockModule);
      const block: Block = {
         fields: getBlockFieldsFile(directory), // Load the block fields file
         ...rawComponent, // Component can override fields if defined directly
         path: directory, // Path where the block component is located (e.g., "@page-builder/my-theme/blocks/hero-section")
         type: blockType,
      };

      // Add the block to the registry
      themeBlocks.value[blockType] = markRaw(block);
   }
   // If there are no blocks, warn
   if (Object.keys(themeBlocks.value).length === 0) {
      console.warn(`[vue-wswg-editor:registry] No blocks found for theme: ${activeTheme.id}`);
      return;
   }
}

export function getBlock(blockType: string): Block | undefined {
   // Generate name variations and try to find a match
   const nameVariations = generateNameVariations(blockType);

   for (const variation of nameVariations) {
      const block = themeBlocks.value[variation];
      if (block) {
         return block;
      }
   }

   return undefined;
}

/**************************************************
 * BLOCK THUMBNAILS
 **************************************************/
async function initialiseBlockThumbnailsRegistry(): Promise<void> {
   const { modules: thumbnailModules } = await import("vue-wswg-editor:thumbnails");
   blockThumbnails = thumbnailModules;
}

export function getBlockThumbnail(blockDirectory: string): string | undefined {
   if (!blockDirectory || !blockThumbnails) return undefined;
   const thumbnailPath = `${blockDirectory}/thumbnail.png`;
   const thumbnailModule = blockThumbnails[thumbnailPath];
   return (thumbnailModule as any).default as string | undefined;
}

/**************************************************
 * REGISTRY COMPOSERS
 **************************************************/

/** THEME BLOCK & FIELD REGISTRY */
async function initialiseThemeSubRegistries(useEditingRegistry?: boolean): Promise<void> {
   // Load the layouts that belong to the active theme
   await initialiseLayoutRegistry();
   // Load the additional theme fields and thumbnails if in edit mode
   if (useEditingRegistry) {
      await initialiseBlockFieldsRegistry();
      await initialiseBlockThumbnailsRegistry();
      await initialiseThemeThumbnailsRegistry();
   }
   // Load the blocks that belong to the active theme
   await initialiseBlockRegistry();
}

/**
 * Initialize the registry with a specific theme
 * @param themeId - The theme ID to load blocks/layouts from
 */
export async function initialiseRegistry(themeId?: string, useEditingRegistry: boolean = true): Promise<void> {
   try {
      // First, initialize theme registry to discover all available themes
      await initialiseThemeRegistry();

      // Set the active theme ID
      await setActiveTheme(themeId);

      // Load the theme sub registries (layouts, blocks, fields)
      await initialiseThemeSubRegistries(useEditingRegistry);
   } catch (error) {
      console.error("[vue-wswg-editor:registry] Error during registry initialization:", error);
      throw error;
   }
}
