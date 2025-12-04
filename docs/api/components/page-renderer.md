# PageRenderer Component

Render pages without the editor interface. Useful for displaying pages in production.

## Props

| Prop         | Type                  | Default     | Description                                |
| ------------ | --------------------- | ----------- | ------------------------------------------ |
| `blocks`     | `Block[]`             | -           | Array of block data                        |
| `layout`     | `string`              | `"default"` | Layout name to use                         |
| `settings`   | `Record<string, any>` | `{}`        | Page settings object                       |
| `withLayout` | `boolean`             | `true`      | Whether to wrap blocks in layout component |

## Example

```vue
<template>
   <PageRenderer
      :blocks="pageData.blocks"
      :layout="pageData.settings.layout"
      :settings="pageData.settings"
      :with-layout="true"
   />
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

