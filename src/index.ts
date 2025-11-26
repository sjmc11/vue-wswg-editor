// Export field configuration utilities first (before any side effects)
// This ensures createField is available immediately without waiting for CSS or component imports
export { createField } from "./util/fieldConfig";
export type { EditorFieldConfig, ValidatorFunction } from "./util/fieldConfig";
export { getLayouts } from "./util/registry";
export { validateField, validateAllFields } from "./util/validation";

// Export components (component exports don't cause side effects until used)
export { default as WswgJsonEditor } from "./components/WswgJsonEditor/WswgJsonEditor.vue";

// Import CSS absolutely last to avoid initialization order issues
// CSS imports can trigger side effects that might cause circular dependencies
import "./assets/styles/main.css";
