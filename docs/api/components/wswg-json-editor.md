# WswgJsonEditor Component

The main editor component for building and editing pages.

## Props

| Prop                     | Type                                       | Default      | Description                                     |
| ------------------------ | ------------------------------------------ | ------------ | ----------------------------------------------- |
| `modelValue` / `v-model` | `Record<string, any>`                      | -            | Page data object containing blocks and settings |
| `editable`               | `boolean`                                  | `false`      | Enable/disable editing mode                     |
| `loading`                | `boolean`                                  | `false`      | Show loading state                              |
| `url`                    | `string`                                   | `""`         | URL displayed in browser navigation bar         |
| `showBrowserBar`         | `boolean`                                  | `false`      | Show browser navigation bar in preview          |
| `blocksKey`              | `string`                                   | `"blocks"`   | Key in pageData for blocks array                |
| `settingsKey`            | `string`                                   | `"settings"` | Key in pageData for settings object             |
| `defaultBlockMargin`     | `"none" \| "small" \| "medium" \| "large"` | `"none"`     | Default margin for blocks                       |

## Slots

- `header` - Custom header content above the editor
- `toolbar` - Custom toolbar content
- `loading` - Custom loading state

## Events

- `update:modelValue` - Emitted when page data changes

## Example

```vue
<template>
   <WswgJsonEditor
      v-model="pageData"
      :editable="true"
      :showBrowserBar="true"
      defaultBlockMargin="small"
   >
      <template #header>
         <div class="custom-header">My Page Editor</div>
      </template>
      <template #toolbar>
         <button @click="save">Save</button>
      </template>
   </WswgJsonEditor>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgJsonEditor } from "vue-wswg-editor";

const pageData = ref({
   blocks: [],
   settings: {},
});

function save() {
   // Save logic here
}
</script>
```

