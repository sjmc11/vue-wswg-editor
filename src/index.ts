// Export field configuration utilities first (before any side effects)
// This ensures createField is available immediately without waiting for CSS or component imports
export { createField } from "./util/fieldConfig";
export type { EditorFieldConfig, ValidatorFunction } from "./util/fieldConfig";
export { getLayouts, initialiseRegistry, initialiseLayoutRegistry, initialiseBlockRegistry } from "./util/registry";
export { validateField, validateAllFields, type ValidationResult } from "./util/validation";

export { getActiveTheme, setActiveTheme, getThemeThumbnail, getThemes } from "./util/theme-registry";
export type { Theme } from "./types/Theme";
export type { Layout } from "./types/Layout";
export type { Block } from "./types/Block";

// Export iframe guard utility for consuming apps
// This helps prevent the parent app from initializing when running in the iframe preview
export { isWswgIframePreview } from "./util/iframe-guard";

// Export components (component exports don't cause side effects until used)
export { default as WswgPageBuilder } from "./components/WswgPageBuilder/WswgPageBuilder.vue";
// Export PageRenderer separately - it doesn't use the registry, so it won't trigger field loading
export { default as PageRenderer } from "./components/PageRenderer/PageRenderer.vue";
// Export iframe preview app for Vue app in iframe
export { createIframeApp } from "./components/IframePreview/iframePreviewEntry";
export type { IframeAppState } from "./components/IframePreview/iframePreviewEntry";

// Import CSS - Vite will extract this to dist/style.css during build
// Consuming apps should import "vue-wswg-editor/style.css"
import "./style.css";
