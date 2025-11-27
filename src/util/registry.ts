import { ref, shallowRef, type Ref } from "vue";
import type { EditorFieldConfig } from "./fieldConfig";
import type { Block } from "../types/Block";
import type { Layout } from "../types/Layout";
import { generateNameVariations, generateFilePathPatterns, toCamelCase } from "./helpers";
// Dynamic imports for all page builder blocks and layouts
// IMPORTANT: These globs use the @page-builder alias which must be configured in the CONSUMING APP's vite.config.ts
// The globs are evaluated by the consuming app's Vite build, so they resolve relative to the consuming app's project root
// The consuming app should have: "@page-builder": fileURLToPath(new URL("../page-builder", import.meta.url))
// Using eager: true to load all modules immediately so we can access component metadata (name, props, icon)
const blockModules = import.meta.glob("@page-builder/blocks/**/*.vue", { eager: true });
const blockFieldsModules = import.meta.glob("@page-builder/blocks/**/fields.ts", { eager: true });
const layoutModules = import.meta.glob("@page-builder/layout/**/*.vue", { eager: true });
// Load all thumbnail images - Vite will process these as assets and provide URLs
// For images, Vite returns the URL as the default export when using eager: true
const thumbnailModules = import.meta.glob("@page-builder/blocks/**/thumbnail.png", { eager: true });

/**
 * Registry of all page builder blocks
 * Automatically populated from the /page-builder/blocks directory of your app
 */
export const pageBuilderBlocks: Ref<Record<string, Block>> = shallowRef({});
export const pageBuilderLayouts: Ref<Record<string, Layout>> = shallowRef({});
const pageBuilderBlockFields: Ref<Record<string, any>> = ref({});

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

function getBlockFields(blockName: string): any {
   try {
      // Generate path variations for options.ts file
      const pathVariations = generateFilePathPatterns("../page-builder/blocks/", blockName, "fields.ts");
      // Find the path that exists in the loaded modules
      const path = pathVariations.find((path) => blockFieldsModules[path]);
      if (path && blockFieldsModules[path]) {
         // Get the block fields
         const blockFields = (blockFieldsModules[path] as any).default;
         return blockFields || {};
      }
      return {};
   } catch (error) {
      console.error("Error getting block fields for block: ", blockName, error);
      return {};
   }
}

export function getLayoutFields(layoutName: string): Record<string, EditorFieldConfig> {
   // Get the data from availableLayouts
   const layout = Object.values(pageBuilderLayouts.value).find((layout) => layout.__name === layoutName);
   if (!layout) return {};

   return layout?.fields || {};
}

function initialiseBlockFieldsRegistry(): void {
   Object.keys(pageBuilderBlockFields.value).forEach((key) => {
      delete pageBuilderBlockFields.value[key];
   });
   Object.entries(blockFieldsModules).forEach(([path, module]) => {
      const blockFields = (module as any).default;
      pageBuilderBlockFields.value[path] = blockFields;
   });
}

function initialiseLayoutRegistry(): void {
   Object.keys(pageBuilderLayouts.value).forEach((key) => {
      delete pageBuilderLayouts.value[key];
   });
   Object.entries(layoutModules).forEach(([path, module]) => {
      const layout = (module as any).default;
      // exclude modules without name
      if (!layout.label) return;
      pageBuilderLayouts.value[path] = layout;
   });
}

function initialiseBlockRegistry(): void {
   // Clear existing registry
   Object.keys(pageBuilderBlocks.value).forEach((key) => {
      delete pageBuilderBlocks.value[key];
   });

   // Load all blocks from the glob pattern
   // With eager: true, module is the actual module object, not a loader function
   Object.entries(blockModules).forEach(([path, module]) => {
      const component = (module as any).default;
      if (component && component.__name) {
         const blockType = toCamelCase(component.type || component.__name);
         // Extract directory path from component path (e.g., "@page-builder/blocks/hero-section/hero-section.vue" -> "@page-builder/blocks/hero-section")
         const directory = path.replace(/\/[^/]+\.vue$/, "");
         const block: Block = {
            fields: getBlockFields(blockType),
            ...component, // Component can override fields
            directory: directory, // directory path where the block component is located (e.g., "@page-builder/blocks/hero-section")
            type: blockType,
         };
         pageBuilderBlocks.value[blockType] = block;
      }
   });
}

export function initialiseRegistry(): void {
   initialiseLayoutRegistry();
   initialiseBlockFieldsRegistry();
   initialiseBlockRegistry();
}

// Initialise the registry when the module is loaded
initialiseRegistry();
