# Quick Start

This guide will walk you through creating your first page builder with `vue-wswg-editor`.

## 1. Configure Vite

First, configure your `vite.config.ts` to use the vue-wswg-editor plugin:

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

## 2. Create the Page Builder Directory Structure

Create a `page-builder` directory in your project. Themes are organized as directories within this folder. If you're only using one theme, create a `default` theme directory:

```
src/
  page-builder/
    default/              # Default theme (fallback if no theme specified)
      theme.config.js     # Theme configuration file
      blocks/             # Block components
      layout/             # Layout components
      fields/             # Custom field components (optional)
```

**For multiple themes**, organize them as separate directories:

```
src/
  page-builder/
    default/              # Default theme
      theme.config.js
      blocks/
      layout/
    marketing-theme/      # Another theme
      theme.config.js
      blocks/
      layout/
```

The `page-builder` directory serves as the central location for all your themes:

- **Themes** - Each theme directory contains its own blocks, layouts, and fields
- **Blocks** (`blocks/`) - Reusable page sections like hero sections, feature lists, testimonials, etc.
- **Layouts** (`layout/`) - Page templates that wrap blocks and define overall page structure
- **Fields** (`fields/`) - Custom field components for specialized input types (optional)

💡 **Tip**: If you're not using multiple themes, just create a `default` theme directory. The library will automatically use it when no theme is specified.

💡 **Tip**: Need a complete example? Check out the [page builder example theme](https://github.com/sjmc11/vue-wswg-demos/tree/main/src/page-builder/wswg-demo-theme) for a reference implementation with example blocks, layouts, and directory structure.

## 3. Create a Theme Configuration (Optional)

If you're creating a custom theme (not using `default`), create a `theme.config.js` file:

```javascript
// src/page-builder/my-theme/theme.config.js
export default {
   title: "My Theme",
   description: "A custom theme",
   version: "1.0.0",
   author: "Your Name",
   tags: ["custom"],
   license: "MIT",
};
```

If you're using the `default` theme, you can skip this step for now.

## 4. Create a Layout Component

Create your first layout component inside your theme directory:

```vue
<!-- src/page-builder/default/layout/default.vue -->
<template>
   <div class="page-layout">
      <slot />
   </div>
</template>

<script setup lang="ts">
defineOptions({
   label: "Default Layout",
});
</script>
```

## 5. Create a Block Component

Create your first block component inside your theme's blocks directory:

```vue
<!-- src/page-builder/default/blocks/hero/Hero.vue -->
<template>
   <section class="hero-section">
      <h1>{{ heading }}</h1>
      <p>{{ description }}</p>
   </section>
</template>

<script setup lang="ts">
defineOptions({
   label: "Hero Section", // Display name in the block browser
});

defineProps<{
   heading: string;
   description: string;
}>();
</script>
```

## 6. Define Block Fields (Optional)

Create a fields configuration file:

```typescript
// src/page-builder/default/blocks/hero/fields.ts
import { createField } from "vue-wswg-editor";

export default {
   heading: createField({
      type: "text",
      label: "Heading",
      required: true,
      default: "Welcome",
   }),
   description: createField({
      type: "textarea",
      label: "Description",
      rows: 4,
   }),
};
```

## 7. Use the Editor Component

Now use the editor in your application. Pass the `theme` prop to specify which theme to use:

```vue
<template>
   <WswgPageBuilder
      v-model="pageData"
      :theme="currentThemeId"
      blocksKey="blocks"
      settingsKey="settings"
      :url="`/page`"
      :showBrowserBar="true"
      :editable="true"
      defaultBlockMargin="small"
   />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";
import "vue-wswg-editor/style.css";

const currentThemeId = ref("default"); // Theme ID - store separately from pageData
const pageData = ref({
   blocks: [],
   settings: {
      layout: "default",
   },
});
</script>
```

**Important**: The `theme` prop should be stored separately from `pageData` in your application state or database. Themes are not stored in page data, allowing you to apply the same theme to multiple pages.

## 8. Handle Data (Optional)

The editor uses `v-model` for two-way data binding. You can watch for changes and save them:

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({
   blocks: [],
   settings: { layout: "default" },
});

// Watch for changes and save
watch(
   pageData,
   async (newData) => {
      await fetch("/api/pages/123", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(newData),
      });
   },
   { deep: true }
);
</script>
```

For more advanced data management patterns (autosaving, versioning, publishing), see the [Data Management Guide](/guide/data-management).

## 9. Render Pages (Production)

To display pages without the editor interface, use the `PageRenderer` component. Pass the `theme` prop to match the theme used during editing:

```vue
<template>
   <PageRenderer
      :blocks="pageData.blocks"
      :layout="pageData.settings.layout"
      :settings="pageData.settings"
      :theme="currentThemeId"
   />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PageRenderer } from "vue-wswg-editor";

const currentThemeId = ref("default"); // Load from your application state
const pageData = ref({ blocks: [], settings: {} });

onMounted(async () => {
   const response = await fetch("/api/pages/123");
   const data = await response.json();
   pageData.value = data;
   // Load theme ID from your application settings
   const settingsResponse = await fetch("/api/settings");
   const settings = await settingsResponse.json();
   currentThemeId.value = settings.themeId || "default";
});
</script>
```

The `PageRenderer` component is lightweight and designed for production use. It renders pages without any editing capabilities.

For more details on components, see the [Components Guide](/guide/components).

## Example Theme

Want to get started faster? Check out the [page builder example theme](https://github.com/sjmc11/vue-wswg-demos/tree/main/src/page-builder/wswg-demo-theme), which provides a complete reference implementation with example blocks, custom fields, and layouts. This example theme is part of the [vue-wswg-demos](https://github.com/sjmc11/vue-wswg-demos) project and includes everything you need to start building pages with vue-wswg-editor.

You can also try the [Live Demo on StackBlitz](https://stackblitz.com/github/sjmc11/vue-wswg-demos?embed=1&view=preview) to explore the library in action.

## Next Steps

- Learn about [Themes](/guide/themes) - Understanding theme-based architecture
- Learn about [Components](/guide/components) - Editor and PageRenderer
- Learn more about [Blocks](/guide/blocks)
- Understand [Fields](/guide/fields)
- Explore [Data Management](/guide/data-management)
- Explore the [API Reference](/api/)
