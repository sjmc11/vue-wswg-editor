// Import from virtual module created by vue-wswg-editor vite plugin
// Use lazy initialization to avoid circular dependency issues with createField
// The import is deferred until first access, ensuring createField is available when blocks load
import { type Component } from "vue";
import { getModuleDefault } from "../../util/registry";
import { markRaw } from "vue";
let _layoutModules: Record<string, Component> | null = null;

export async function loadLayoutModules(): Promise<Record<string, Component> | null> {
   if (!_layoutModules) {
      _layoutModules = {};
      // Lazy load virtual modules to prevent initialization order issues
      const { modules: discoveredModules } = await import("vue-wswg-editor:layouts");
      for (const [, module] of Object.entries(discoveredModules)) {
         let resolvedModule = module;
         // If module is a function (lazy-loaded), call it to get the actual module
         if (typeof module === "function") {
            resolvedModule = await module();
         }
         const component = getModuleDefault(resolvedModule);
         if (component && component.__name) {
            const layoutType = component.type || component.__name;
            _layoutModules[layoutType] = markRaw(component);
         }
      }
   }
   return _layoutModules;
}

export function getLayoutModule(type: string): Component | undefined {
   return _layoutModules?.[type];
}
