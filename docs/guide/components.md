# Components

The library provides two main components for building and rendering pages:

1. **WswgJsonEditor** - The visual editor for building and editing pages
2. **PageRenderer** - A lightweight component for rendering pages without the editor interface

## WswgJsonEditor

The `WswgJsonEditor` component provides a full-featured visual editor for building pages. It includes:

- Drag-and-drop block management
- Sidebar editor for configuring block properties
- Real-time preview with responsive viewport controls
- Layout selection and configuration

### Basic Usage

```vue
<template>
   <WswgJsonEditor v-model="pageData" :editable="true" />
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

### Props

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

### Slots

- `header` - Custom header content above the editor
- `loading` - Custom loading state

### Events

- `update:modelValue` - Emitted when page data changes

### Example with Custom Header

Place action buttons in a header above the editor:

```vue
<template>
   <div>
      <header class="editor-header">
         <h1>Page Editor</h1>
         <div class="editor-actions">
            <button @click="handleSave" :disabled="saving">
               {{ saving ? "Saving..." : "Save" }}
            </button>
            <button @click="handlePublish" :disabled="publishing">
               {{ publishing ? "Publishing..." : "Publish" }}
            </button>
         </div>
      </header>
      <WswgJsonEditor v-model="pageData" :editable="true" :showBrowserBar="true" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgJsonEditor } from "vue-wswg-editor";

const pageData = ref({
   blocks: [],
   settings: {},
});

const saving = ref(false);
const publishing = ref(false);

async function handleSave() {
   saving.value = true;
   try {
      await fetch("/api/pages/123", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
   } finally {
      saving.value = false;
   }
}

async function handlePublish() {
   publishing.value = true;
   try {
      await fetch("/api/pages/123/publish", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
   } finally {
      publishing.value = false;
   }
}
</script>
```

### Edit and View Modes

Use the `editable` prop to switch between edit and view modes:

```vue
<template>
   <WswgJsonEditor v-model="pageData" :editable="isEditMode" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { WswgJsonEditor } from "vue-wswg-editor";

const route = useRoute();
const pageData = ref({ blocks: [], settings: {} });

const isEditMode = computed(() => route.query.mode === "edit");
</script>
```

For more details, see the [WswgJsonEditor API reference](/api/components/wswg-json-editor).

## PageRenderer

The `PageRenderer` component renders pages without the editor interface. It's designed for production use where you want to display pages without editing capabilities.

### Basic Usage

```vue
<template>
   <div>
      <!-- Your application header -->
      <header class="site-header">
         <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
         </nav>
      </header>

      <!-- Page content (withLayout defaults to false) -->
      <main>
         <PageRenderer :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
      </main>

      <!-- Your application footer -->
      <footer class="site-footer">
         <p>&copy; 2025 Your Company. All rights reserved.</p>
      </footer>
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

### Props

| Prop         | Type                  | Default     | Description                                |
| ------------ | --------------------- | ----------- | ------------------------------------------ |
| `blocks`     | `Block[]`             | -           | Array of block data                        |
| `layout`     | `string`              | `"default"` | Layout name to use                         |
| `settings`   | `Record<string, any>` | `{}`        | Page settings object                       |
| `withLayout` | `boolean`             | `false`     | Whether to wrap blocks in layout component |

### Using Layouts with PageRenderer

The `withLayout` prop controls whether blocks are wrapped in a layout component. By default, it's set to `false`, but both approaches are valid depending on your use case.

#### Approach 1: Application-Level Headers/Footers (Default)

When your site has consistent headers and footers across pages, manage them at the application level:

```vue
<template>
   <div>
      <!-- Your application header -->
      <header class="site-header">
         <nav>...</nav>
      </header>

      <!-- Page content (withLayout defaults to false) -->
      <main>
         <PageRenderer :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
      </main>

      <!-- Your application footer -->
      <footer class="site-footer">...</footer>
   </div>
</template>
```

**Benefits:**

- Headers and footers stay consistent across all pages
- Navigation elements are managed independently from page content
- Easier to maintain global navigation changes
- Better separation of concerns

**Use this approach when:**

- Your site has a consistent header/footer across pages
- Navigation is shared across multiple pages
- You want to manage branding elements separately from page content

#### Approach 2: Page-Specific Layouts (One-Off Pages)

For landing pages, funnel pages, or pages with unique headers/footers, include them in the layout:

```vue
<template>
   <!-- For pages with unique headers/footers -->
   <PageRenderer
      :blocks="pageData.blocks"
      :layout="pageData.settings.layout"
      :settings="pageData.settings"
      :with-layout="true"
   />
</template>
```

**Benefits:**

- Complete page control within the editor
- Unique headers/footers per page
- Everything editable in one place
- Perfect for marketing campaigns and landing pages

**Use this approach when:**

- Creating one-off landing pages or funnel pages
- Each page needs a unique header/footer design
- The header/footer is part of the page content, not site navigation
- You want everything editable through the page builder

::: tip Example Use Cases

- **Landing pages** - Unique hero sections, custom navigation, campaign-specific footers
- **Funnel pages** - Conversion-focused layouts with minimal navigation
- **Marketing pages** - Pages with entirely custom branding and navigation
- **Microsites** - Standalone pages with their own navigation structure
  :::

This allows editors to see how pages will look with headers/footers during editing, while maintaining application-level control in production.

### Loading Page Data

Typically, you'll load page data from an API:

```vue
<template>
   <div v-if="loading">Loading...</div>
   <PageRenderer v-else :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { PageRenderer } from "vue-wswg-editor";

const route = useRoute();
const pageData = ref({ blocks: [], settings: {} });
const loading = ref(true);

onMounted(async () => {
   try {
      const response = await fetch(`/api/pages/${route.params.id}`);
      const data = await response.json();
      pageData.value = data;
   } catch (error) {
      console.error("Failed to load page:", error);
   } finally {
      loading.value = false;
   }
});
</script>
```

### Error Handling

Handle cases where pages or blocks might not exist:

```vue
<template>
   <div v-if="error" class="error">
      {{ error }}
   </div>
   <PageRenderer
      v-else-if="pageData.blocks.length > 0"
      :blocks="pageData.blocks"
      :layout="pageData.settings.layout"
      :settings="pageData.settings"
   />
   <div v-else class="empty">No content available</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PageRenderer } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const error = ref<string | null>(null);

onMounted(async () => {
   try {
      const response = await fetch("/api/pages/123");
      if (!response.ok) {
         throw new Error("Page not found");
      }
      const data = await response.json();
      pageData.value = data;
   } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load page";
   }
});
</script>
```

For more details, see the [PageRenderer API reference](/api/components/page-renderer).

## When to Use Each Component

### Use WswgJsonEditor When:

- Building an admin/editor interface
- Users need to create or edit pages
- You need drag-and-drop functionality
- You need to configure block properties

### Use PageRenderer When:

- Displaying pages in production
- Rendering published content
- You don't need editing capabilities
- You want a lightweight, performant solution

## Complete Example: Editor and Renderer

Here's a complete example showing both components in action:

```vue
<template>
   <div>
      <!-- Editor view -->
      <WswgJsonEditor v-if="isEditing" v-model="pageData" :editable="true" :loading="loading" />

      <!-- Production view -->
      <PageRenderer v-else :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
   </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { WswgJsonEditor, PageRenderer } from "vue-wswg-editor";
import "vue-wswg-editor/style.css";

const route = useRoute();
const pageData = ref({ blocks: [], settings: {} });
const loading = ref(true);
const isEditing = computed(() => route.query.mode === "edit");

onMounted(async () => {
   loading.value = true;
   try {
      const response = await fetch(`/api/pages/${route.params.id}`);
      const data = await response.json();
      pageData.value = data;
   } catch (error) {
      console.error("Failed to load page:", error);
   } finally {
      loading.value = false;
   }
});
</script>
```

## See Also

- [WswgJsonEditor API Reference](/api/components/wswg-json-editor) - Complete API documentation
- [PageRenderer API Reference](/api/components/page-renderer) - Complete API documentation
- [Data Management Guide](/guide/data-management) - Learn about fetching and saving page data
- [Quick Start Guide](/guide/quick-start) - Get started with the library
