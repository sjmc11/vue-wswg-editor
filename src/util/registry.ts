import { ref, shallowRef, markRaw, type Ref } from "vue";
import type { EditorFieldConfig } from "./fieldConfig";
import type { Block } from "../types/Block";
import type { Layout } from "../types/Layout";
import { generateNameVariations, toCamelCase } from "./helpers";
// Dynamic imports for all page builder blocks and layouts
// IMPORTANT: These globs use the @page-builder alias which must be configured in the CONSUMING APP's vite.config.ts
// The globs are evaluated by the consuming app's Vite build, so they resolve relative to the consuming app's project root
// The consuming app should have: "@page-builder": fileURLToPath(new URL("../page-builder", import.meta.url))
import { modules as layoutModules } from "vue-wswg-editor:layouts";
import { modules as blockModules } from "vue-wswg-editor:blocks";
import { modules as fieldModules } from "vue-wswg-editor:fields";
import { modules as thumbnailModules } from "vue-wswg-editor:thumbnails";

// Load all thumbnail images - Vite will process these as assets and provide URLs
// For images, Vite returns the URL as the default export when using eager: true
// const thumbnailModules = import.meta.glob("@page-builder/blocks/**/thumbnail.png", { eager: true });

/**
 * Registry of all page builder blocks, layouts & fields
 */
export const pageBuilderBlocks: Ref<Record<string, Block>> = shallowRef({});
export const pageBuilderLayouts: Ref<Record<string, Layout>> = shallowRef({});
const pageBuilderBlockFields: Ref<Record<string, any>> = ref({});

////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////

/**
 * Recursively mark Vue components as raw to prevent reactivity
 * Components are identified by having __name, setup, or render properties
 */
function markComponentsAsRaw(obj: any): any {
   if (!obj || typeof obj !== "object") return obj;

   // Check if this is a Vue component
   if (obj.__name || obj.setup || obj.render) {
      return markRaw(obj);
   }

   // Recursively process objects and arrays
   if (Array.isArray(obj)) {
      return obj.map((item) => markComponentsAsRaw(item));
   }

   const result: any = {};
   for (const [key, value] of Object.entries(obj)) {
      result[key] = markComponentsAsRaw(value);
   }
   return result;
}

/**
 * Extract the default export from a module, handling different module formats
 * Works with both eager and lazy-loaded modules from import.meta.glob
 */
function getModuleDefault(module: any): any {
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

////////////////////////////////////////////////////////////
// Methods
////////////////////////////////////////////////////////////

export function getBlocks(): Record<string, Block> {
   return pageBuilderBlocks.value;
}

export function getLayouts(): Record<string, Layout> {
   return pageBuilderLayouts.value;
}

/**
 * Get the thumbnail URL for a block directory
 * @param directory - Block directory path (e.g., "@page-builder/blocks/hero-section")
 * @returns Thumbnail URL or undefined if not found
 */
export function getBlockThumbnailUrl(directory: string | undefined): string | undefined {
   if (!directory) return undefined;
   // Construct the thumbnail path from the directory
   const thumbnailPath = `${directory}/thumbnail.png`;
   // Look up the thumbnail in the preloaded modules
   const thumbnailModule = thumbnailModules[thumbnailPath];
   if (!thumbnailModule) return undefined;
   // For images, Vite returns an object with a default property containing the URL
   // When using eager: true, the module is already loaded
   return (thumbnailModule as any).default as string | undefined;
}

export function getBlockComponent(blockType: string): Block | undefined {
   // Generate name variations and try to find a match
   const nameVariations = generateNameVariations(blockType);

   for (const variation of nameVariations) {
      const block = pageBuilderBlocks.value[variation];
      if (block) {
         return block;
      }
   }

   return undefined;
}

function getBlockFields(directory: string): any {
   const fieldsPath = `${directory}/fields.ts`;
   try {
      // Generate path for fields.ts file
      const blockField = pageBuilderBlockFields.value[fieldsPath];
      if (blockField) {
         return blockField;
      }
      return {};
   } catch (error) {
      console.error("Error getting block fields for block: ", fieldsPath, error);
      return {};
   }
}

export function getLayoutFields(layoutName: string): Record<string, EditorFieldConfig> {
   // Get the data from availableLayouts
   const layout = Object.values(pageBuilderLayouts.value).find((layout) => layout.__name === layoutName);
   if (!layout) return {};

   return layout?.fields || {};
}

async function initialiseBlockFieldsRegistry(): Promise<void> {
   // Clear existing registry
   Object.keys(pageBuilderBlockFields.value).forEach((key) => {
      delete pageBuilderBlockFields.value[key];
   });

   for (const [path, module] of Object.entries(fieldModules)) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const blockFieldModule = getModuleDefault(resolvedModule);
      // Mark as raw to prevent Vue from making it reactive
      pageBuilderBlockFields.value[path] = markRaw(blockFieldModule);
   }
}

async function initialiseLayoutRegistry(): Promise<void> {
   Object.keys(pageBuilderLayouts.value).forEach((key) => {
      delete pageBuilderLayouts.value[key];
   });

   // Use layoutModules if available (from vite plugin), otherwise fall back to layoutModules
   const modulesToUse = layoutModules;

   // Handle both eager-loaded modules and lazy-loaded modules (functions)
   for (const [, module] of Object.entries(modulesToUse)) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const layout = getModuleDefault(resolvedModule);
      // exclude modules without name
      if (!layout || !layout.label) return;
      // Mark layout component as raw to prevent Vue from making it reactive
      pageBuilderLayouts.value[layout.__name] = markRaw(layout);
   }
}

async function initialiseBlockRegistry(): Promise<void> {
   // Clear existing registry
   Object.keys(pageBuilderBlocks.value).forEach((key) => {
      delete pageBuilderBlocks.value[key];
   });

   // Load all blocks from the glob pattern
   // With eager: true, module is the actual module object, not a loader function
   for (const [path, module] of Object.entries(blockModules)) {
      let resolvedModule = module;
      // If module is a function (lazy-loaded), call it to get the actual module
      if (typeof module === "function") {
         resolvedModule = await module();
      }
      const component = getModuleDefault(resolvedModule);
      if (component && component.__name) {
         const blockType = toCamelCase(component.type || component.__name);
         // Extract directory path from component path (e.g., "@page-builder/blocks/hero-section/hero-section.vue" -> "@page-builder/blocks/hero-section")
         const directory = path.replace(/\/[^/]+\.vue$/, "");
         // Mark the component itself as raw before spreading
         const rawComponent = markRaw(component);
         const block: Block = {
            fields: markComponentsAsRaw(getBlockFields(directory)), // Mark any components in fields as raw
            ...rawComponent, // Component can override fields
            directory: directory, // directory path where the block component is located (e.g., "@page-builder/blocks/hero-section")
            type: blockType,
         };
         pageBuilderBlocks.value[blockType] = block;
      }
   }
}

export async function initialiseRegistry(): Promise<void> {
   await initialiseLayoutRegistry();
   await initialiseBlockFieldsRegistry();
   await initialiseBlockRegistry();
}

// Initialise the registry when the module is loaded
// Use void to handle the promise without blocking
void initialiseRegistry();
