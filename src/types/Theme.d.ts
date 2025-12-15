/**
 * Custom component type with additional layout-specific properties
 * These properties are set via defineOptions() in Vue components
 */
export type Theme = {
   id: string; // The ID of the theme
   path: string; // The path to the theme
   title: string; // The title of the theme
   description: string; // The description of the theme
   version: string; // The version of the theme
   author: string; // The author of the theme
   authorWebsite: string; // The author website of the theme
   tags: string[]; // The tags of the theme
   license: string; // The license of the theme
};
