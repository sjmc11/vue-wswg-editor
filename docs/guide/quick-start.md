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

## Next Steps

- Learn more about [Blocks](/guide/blocks)
- Understand [Fields](/guide/fields)
- Explore the [API Reference](/api/components)

