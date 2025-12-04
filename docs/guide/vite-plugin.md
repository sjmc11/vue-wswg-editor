# Vite Plugin

The `vueWswgEditorPlugin` is a Vite plugin that automatically discovers blocks, layouts, and fields from your project structure. It creates virtual modules that the library uses internally to load your components.

## Overview

The plugin scans your project directory structure and creates virtual modules that expose:

- **Layout components** - All `.vue` files in `layout/`
- **Block components** - All `.vue` files in `blocks/`
- **Field definitions** - All `fields.ts` files in `blocks/`
- **Block thumbnails** - All `thumbnail.png` files in `blocks/`

These virtual modules are automatically populated based on your file structure, eliminating the need for manual registration.

## Installation

The plugin is included with `vue-wswg-editor`. Import it from the package:

```typescript
import { vueWswgEditorPlugin } from "vue-wswg-editor/vite-plugin";
```

## Configuration

Add the plugin to your `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import { vueWswgEditorPlugin } from "vue-wswg-editor/vite-plugin";

export default defineConfig({
   plugins: [
      vue(),
      vueWswgEditorPlugin({
         rootDir: "@page-builder", // Path alias to your page-builder directory
      }),
   ],
   resolve: {
      alias: {
         "@page-builder": fileURLToPath(new URL("./src/page-builder", import.meta.url)),
      },
   },
});
```

### Plugin Options

The plugin accepts a single option:

```typescript
interface VueWswgEditorPluginOptions {
   /**
    * Root directory path (can use Vite aliases like "@page-builder")
    * Example: "@/features/homepage" or "@page-builder"
    */
   rootDir: string;
}
```

#### Using Path Aliases

The `rootDir` option supports Vite path aliases. This is recommended as it makes your configuration more maintainable:

```typescript
// vite.config.ts
export default defineConfig({
   plugins: [
      vueWswgEditorPlugin({
         rootDir: "@page-builder", // Use alias
      }),
   ],
   resolve: {
      alias: {
         "@page-builder": fileURLToPath(new URL("./src/page-builder", import.meta.url)),
      },
   },
});
```

#### Using Relative Paths

You can also use relative paths, though aliases are preferred:

```typescript
// vite.config.ts
export default defineConfig({
   plugins: [
      vueWswgEditorPlugin({
         rootDir: "./src/page-builder", // Relative path
      }),
   ],
});
```

#### Using Absolute Paths

Absolute paths work as well:

```typescript
import path from "path";

export default defineConfig({
   plugins: [
      vueWswgEditorPlugin({
         rootDir: path.resolve(__dirname, "./src/page-builder"), // Absolute path
      }),
   ],
});
```

## How It Works

The plugin creates four virtual modules that are automatically populated:

### Virtual Modules

1. **`vue-wswg-editor:blocks`** - All block components
   - Scans: `{rootDir}/blocks/**/*.vue`
   - Used by the library to discover and load block components

2. **`vue-wswg-editor:layouts`** - All layout components
   - Scans: `{rootDir}/layout/**/*.vue`
   - Used by the library to discover and load layout components

3. **`vue-wswg-editor:fields`** - All field definition files
   - Scans: `{rootDir}/blocks/**/fields.ts`
   - Used by the library to load field configurations for blocks

4. **`vue-wswg-editor:thumbnails`** - Block thumbnail images
   - Scans: `{rootDir}/blocks/**/thumbnail.png`
   - Used by the library to display block thumbnails in the editor

### Internal Implementation

The plugin uses Vite's `import.meta.glob` to scan your directory structure:

```typescript
// Generated virtual module code (simplified)
export const modules = import.meta.glob("@page-builder/blocks/**/*.vue", { eager: true });
```

The library then processes these modules to build the registry of available blocks, layouts, and fields.

## Directory Structure Requirements

The plugin expects a specific directory structure. The `blocks/` and `layout/` subdirectories are **required** and cannot be changed:

```
{rootDir}/
  blocks/              # Block components (required - cannot be renamed)
    {blockName}/        # Block directory (kebab-case)
      {BlockName}.vue   # Block component (PascalCase)
      fields.ts         # Field definitions (optional)
      thumbnail.png     # Block thumbnail (optional)
  layout/              # Layout components (required - cannot be renamed)
    {layoutName}.vue   # Layout component (kebab-case)
```

**Important:** While you can change the location of `rootDir` (the page-builder directory), the internal structure with `blocks/` and `layout/` subdirectories is fixed and cannot be customized.

### Example Structure

```
src/
  page-builder/
    blocks/
      hero-section/
        HeroSection.vue
        fields.ts
        thumbnail.png
      divider/
        Divider.vue
    layout/
      default.vue
      marketing.vue
```

## Plugin Behavior

### Execution Order

The plugin runs with `enforce: "pre"`, meaning it executes before other Vite plugins. This ensures:

- Virtual modules are resolved before other plugins try to process them
- `import.meta.glob` is processed correctly
- The library's dependency optimization works correctly

### Dependency Optimization

The plugin automatically configures Vite's dependency optimization to:

- Exclude `vue-wswg-editor` from optimization
- Mark virtual modules as external during esbuild optimization
- Prevent esbuild from trying to resolve virtual modules prematurely

This ensures the plugin works correctly with Vite's build system.

## Examples

### Basic Setup

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import { vueWswgEditorPlugin } from "vue-wswg-editor/vite-plugin";

export default defineConfig({
   plugins: [
      vue(),
      vueWswgEditorPlugin({
         rootDir: "@page-builder",
      }),
   ],
   resolve: {
      alias: {
         "@page-builder": fileURLToPath(new URL("./src/page-builder", import.meta.url)),
      },
   },
});
```

### Monorepo Setup

In a monorepo, you might have multiple page builders:

```typescript
// vite.config.ts
export default defineConfig({
   plugins: [
      vue(),
      vueWswgEditorPlugin({
         rootDir: "@features/homepage/page-builder",
      }),
   ],
   resolve: {
      alias: {
         "@features": fileURLToPath(new URL("./src/features", import.meta.url)),
      },
   },
});
```

### Custom Page-Builder Location

::: warning Experimental
Using a custom location for the page-builder directory (different from the standard `./src/page-builder/`) is supported but experimental. The internal structure (`blocks/` and `layout/` subdirectories) cannot be changed.
:::

If your page-builder directory is in a different location:

```typescript
// vite.config.ts
export default defineConfig({
   plugins: [
      vue(),
      vueWswgEditorPlugin({
         rootDir: "@/app/example-directory", // Custom page-builder location
      }),
   ],
   resolve: {
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
   },
});
```

**Important:** The `rootDir` must still contain `blocks/` and `layout/` subdirectories. For example:

- `@/app/example-directory/blocks/` ✅
- `@/app/example-directory/layout/` ✅
- `@/app/example-directory/components/` ❌ (not supported)

## Troubleshooting

### Blocks or Layouts Not Found

If blocks or layouts aren't being discovered:

1. **Check the directory structure** - Ensure your files match the expected structure
2. **Verify the `rootDir` path** - Make sure it points to the correct directory
3. **Check file naming** - Block components should match directory names (e.g., `hero-section/HeroSection.vue`)
4. **Restart the dev server** - Vite may need a restart to pick up plugin changes

### Virtual Module Errors

If you see errors about virtual modules:

1. **Ensure the plugin is configured** - The plugin must be added to your Vite config
2. **Check plugin order** - The plugin should run before other plugins (it uses `enforce: "pre"`)
3. **Verify path aliases** - If using aliases, ensure they're configured in `resolve.alias`

### Build Errors

If builds fail:

1. **Check for missing files** - Ensure all referenced files exist
2. **Verify TypeScript types** - Make sure your components have proper type definitions
3. **Check console output** - Look for specific error messages about missing modules

## Advanced Usage

### Custom File Patterns

The plugin uses fixed glob patterns:

- `{rootDir}/blocks/**/*.vue` for block components
- `{rootDir}/layout/**/*.vue` for layout components
- `{rootDir}/blocks/**/fields.ts` for field definitions
- `{rootDir}/blocks/**/thumbnail.png` for thumbnails

These patterns cannot be customized. The `blocks/` and `layout/` subdirectory names are required and cannot be changed.

### Development vs Production

The plugin works identically in development and production builds. Virtual modules are resolved at build time, so there's no runtime overhead.

### Hot Module Replacement (HMR)

The plugin supports HMR - when you add, remove, or modify blocks, layouts, or fields, the changes are automatically reflected in the editor without restarting the dev server.

## See Also

- [Blocks Guide](/guide/blocks) - Learn about creating blocks
- [Layouts Guide](/guide/layouts) - Learn about creating layouts
- [Fields Guide](/guide/fields) - Learn about defining fields
- [Quick Start Guide](/guide/quick-start) - Get started with the library
