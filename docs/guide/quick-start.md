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

Create a `page-builder` directory in your project:

```
src/
  page-builder/
    blocks/          # Block components
    layout/          # Layout components
```

## 3. Create a Layout Component

Create your first layout component:

```vue
<!-- src/page-builder/layout/default.vue -->
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

## 4. Create a Block Component

Create your first block component:

```vue
<!-- src/page-builder/blocks/hero/Hero.vue -->
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

## 5. Define Block Fields (Optional)

Create a fields configuration file:

```typescript
// src/page-builder/blocks/hero/fields.ts
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

## 6. Use the Editor Component

Now use the editor in your application:

```vue
<template>
   <WswgJsonEditor
      v-model="pageData"
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
import { WswgJsonEditor } from "vue-wswg-editor";
import "vue-wswg-editor/style.css";

const pageData = ref({
   blocks: [],
   settings: {
      layout: "default",
   },
});
</script>
```

## 7. Handle Data (Optional)

The editor uses `v-model` for two-way data binding. You can watch for changes and save them:

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { WswgJsonEditor } from "vue-wswg-editor";

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

## 8. Render Pages (Production)

To display pages without the editor interface, use the `PageRenderer` component:

```vue
<template>
   <PageRenderer :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PageRenderer } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });

onMounted(async () => {
   const response = await fetch("/api/pages/123");
   const data = await response.json();
   pageData.value = data;
});
</script>
```

The `PageRenderer` component is lightweight and designed for production use. It renders pages without any editing capabilities.

For more details on components, see the [Components Guide](/guide/components).

## Next Steps

- Learn about [Components](/guide/components) - Editor and PageRenderer
- Learn more about [Blocks](/guide/blocks)
- Understand [Fields](/guide/fields)
- Explore [Data Management](/guide/data-management)
- Explore the [API Reference](/api)
