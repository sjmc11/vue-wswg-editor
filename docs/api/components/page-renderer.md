# PageRenderer Component

Render pages without the editor interface. Useful for displaying pages in production.

## Props

| Prop         | Type                  | Default     | Description                                |
| ------------ | --------------------- | ----------- | ------------------------------------------ |
| `blocks`     | `Block[]`             | -           | Array of block data                        |
| `layout`     | `string`              | `"default"` | Layout name to use                         |
| `settings`   | `Record<string, any>` | `{}`        | Page settings object                       |
| `withLayout` | `boolean`             | `false`     | Whether to wrap blocks in layout component |

**Note:** `withLayout` defaults to `false` because headers and footers should be managed in your application, not within page builder layouts. Layouts with headers/footers should only be used for visual representation (preview purposes).

## Example

```vue
<template>
   <div>
      <!-- Your application header -->
      <header class="site-header">...</header>

      <!-- Page content (withLayout defaults to false) -->
      <main>
         <PageRenderer :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
      </main>

      <!-- Your application footer -->
      <footer class="site-footer">...</footer>
   </div>
</template>

<script setup lang="ts">
import { PageRenderer } from "vue-wswg-editor";

const pageData = {
   blocks: [
      {
         id: "block-1",
         type: "hero",
         heading: "Welcome",
         description: "This is a hero section",
      },
   ],
   settings: {
      layout: "default",
   },
};
</script>
```
