# WswgPageBuilder Component

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
- `loading` - Custom loading state

## Events

- `update:modelValue` - Emitted when page data changes

## Example

```vue
<template>
   <div>
      <header class="editor-header">
         <h1>My Page Editor</h1>
         <button @click="save">Save</button>
      </header>
      <WswgPageBuilder v-model="pageData" :editable="true" :showBrowserBar="true" defaultBlockMargin="small" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({
   blocks: [],
   settings: {},
});

async function save() {
   try {
      const response = await fetch("/api/pages/123", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      if (!response.ok) throw new Error("Save failed");
      alert("Saved successfully!");
   } catch (error) {
      alert("Failed to save: " + error);
   }
}
</script>
```

## Data Management

The component uses Vue's `v-model` for two-way data binding. When the page data changes, the component emits `update:modelValue`. You can:

- **Watch for changes** and save automatically
- **Implement autosave** with debouncing
- **Handle versioning** and publishing workflows
- **Manage edit/view modes**

For comprehensive data management patterns, see the [Data Management Guide](/guide/data-management).
