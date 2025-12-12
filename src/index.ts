// Export field configuration utilities first (before any side effects)
// This ensures createField is available immediately without waiting for CSS or component imports
export { createField } from "./util/fieldConfig";
export type { EditorFieldConfig, ValidatorFunction } from "./util/fieldConfig";
export { getLayouts, initialiseRegistry, initialiseLayoutRegistry, initialiseBlockRegistry } from "./util/registry";
export { validateField, validateAllFields, type ValidationResult } from "./util/validation";

// Export components (component exports don't cause side effects until used)
export { default as WswgPageBuilder } from "./components/WswgPageBuilder/WswgPageBuilder.vue";
// Export PageRenderer separately - it doesn't use the registry, so it won't trigger field loading
export { default as PageRenderer } from "./components/PageRenderer/PageRenderer.vue";
// Export iframe preview app for Vue app in iframe
export { createIframeApp, getIframeAppModuleUrl } from "./components/IframePreview/iframePreviewApp";
export type { IframeAppState, IframeAppCallbacks } from "./components/IframePreview/iframePreviewApp";

// Import CSS - Vite will extract this to dist/style.css during build
// Consuming apps should import "vue-wswg-editor/style.css"
import "./style.css";
