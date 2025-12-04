// import.meta.glob must be at top level - it will be transformed by Vite plugin
// This file is separate from the Vue component to ensure the transform hook can intercept it
export const layoutModules = import.meta.glob("@page-builder/layout/**/*.vue", { eager: true });
