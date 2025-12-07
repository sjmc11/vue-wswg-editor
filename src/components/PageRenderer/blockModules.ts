// Import from virtual module created by vue-wswg-editor vite plugin
// Use lazy initialization to avoid circular dependency issues with createField
// The import is deferred until first access, ensuring createField is available when blocks load
import { type Component } from "vue";
import { getModuleDefault } from "../../util/registry";
import { markRaw } from "vue";
let _blockModules: Record<string, Component> | null = null;

export async function loadBlockModules(): Promise<Record<string, Component> | null> {
   if (!_blockModules) {
      _blockModules = {};
      // Lazy load virtual modules to prevent initialization order issues
      const { modules: discoveredModules } = await import("vue-wswg-editor:blocks");
      for (const [, module] of Object.entries(discoveredModules)) {
         let resolvedModule = module;
         // If module is a function (lazy-loaded), call it to get the actual module
         if (typeof module === "function") {
            resolvedModule = await module();
         }
         const component = getModuleDefault(resolvedModule);
         if (component && component.__name) {
            const blockType = component.type || component.__name;
            _blockModules[blockType] = markRaw(component);
         }
      }
   }
   return _blockModules;
}

export function getBlockModule(type: string): Component | undefined {
   return _blockModules?.[type];
}
