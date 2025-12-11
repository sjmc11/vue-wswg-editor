# Layouts

Layouts are page templates that wrap blocks. They define the overall structure and styling of a page.

## Creating a Layout

Layouts are Vue components located in your `page-builder/layout` directory:

```
src/page-builder/layout/
  default.vue
  marketing.vue
```

## Layout Component Structure

A layout component must include a `<slot />` where blocks will be rendered and **must** define a `label` in `defineOptions`:

```vue
<template>
   <div class="page-layout">
      <main>
         <slot />
      </main>
   </div>
</template>

<script setup lang="ts">
defineOptions({
   label: "Default Layout", // Required: Used for display in the editor
});

defineProps<{
   title?: string;
}>();
</script>
```

### Required: Label in defineOptions

The `label` property in `defineOptions` is **required**. It's used to display the layout name in the editor interface. Without it, the layout won't be properly registered.

```vue
<script setup lang="ts">
defineOptions({
   label: "Default Layout", // Required
});
</script>
```

### Organizing Layout Components

You can organize your layout directory structure to include additional components like partials for headers and footers:

```
src/page-builder/
  layout/
    default.vue
    marketing.vue
  partials/              # Optional: Additional components
    Header.vue
    Footer.vue
```

This allows you to:

- Keep layout components focused on their primary purpose
- Reuse header and footer components across layouts
- Maintain separation of concerns

Example with partials:

```vue
<!-- src/page-builder/layout/default.vue -->
<template>
   <div class="page-layout">
      <Header />
      <main>
         <slot />
      </main>
      <Footer />
   </div>
</template>

<script setup lang="ts">
import Header from "../partials/Header.vue";
import Footer from "../partials/Footer.vue";

defineOptions({
   label: "Default Layout",
});
</script>
```

### Headers and Footers in Layouts

::: tip Important
Headers and footers included in layouts should be used **for editor experience only** - they provide visual representation during editing and preview.
:::

::: info Valid Use Case
There is a valid exception: for **one-off landing pages or funnel pages** where the header and footer are entirely unique to that specific page. In these cases, it's appropriate to include the header and footer in the layout and use `PageRenderer` with `withLayout: true` in production, since the header and footer are part of the page content rather than application-level navigation.
:::

**Why:**

- **Separation of concerns** - Headers and footers are application-level concerns and should be managed independently in your application
- **Editor preview** - Layout headers/footers help visualize how pages will look in production during editing
- **Production rendering** - In production, use `PageRenderer` with `withLayout: false` (the default) and manage headers/footers at the application level

**Recommended approach:**

1. **In layouts (for editor preview):** Include headers/footers for visual representation
2. **In production:** Use `PageRenderer` without layout wrapper and manage headers/footers in your application

```vue
<!-- Layout with header/footer for editor preview -->
<template>
   <div class="page-layout">
      <header class="layout-header">
         <!-- Visual representation for editor -->
         <nav>...</nav>
      </header>
      <main>
         <slot />
      </main>
      <footer class="layout-footer">
         <!-- Visual representation for editor -->
         <p>Footer content</p>
      </footer>
   </div>
</template>

<script setup lang="ts">
defineOptions({
   label: "Default Layout",
});
</script>
```

```vue
<!-- Production rendering -->
<template>
   <div>
      <!-- Your actual application header -->
      <header class="site-header">...</header>

      <!-- Page content without layout wrapper -->
      <main>
         <PageRenderer :blocks="pageData.blocks" :layout="pageData.settings.layout" :settings="pageData.settings" />
      </main>

      <!-- Your actual application footer -->
      <footer class="site-footer">...</footer>
   </div>
</template>
```

This approach maintains proper separation of concerns - your application handles headers/footers independently, while layouts provide visual context during the editing experience.

## Layout Naming Convention

- Layout files should use **kebab-case** (e.g., `default.vue`, `marketing.vue`)
- Layouts are referenced by their filename (without extension)
- **Required:** Use `defineOptions` to set a `label` for display in the editor (this is mandatory)

## Layout Settings

Layouts can have settings that are editable through the page settings panel. Define these in your layout component's props.

## Interactive Layout Elements with `data-partial`

You can make specific elements in your layout interactive in the editor by adding the `data-partial` attribute. This allows users to click on layout elements (like headers, footers, or other sections) in the layout to quickly navigate to their corresponding settings in the page settings panel.

### Basic Usage

Add `data-partial` to any element in your layout to make it interactive:

```vue
<template>
   <div class="page-layout">
      <header data-partial>
         <!-- Header content -->
         <nav>...</nav>
      </header>
      <main>
         <slot />
      </main>
      <footer data-partial>
         <!-- Footer content -->
         <p>Footer content</p>
      </footer>
   </div>
</template>
```

### Linking to Field Groups

To link a partial element to a specific field group in your layout settings, add a value to the `data-partial` attribute that matches the field group name:

```vue
<template>
   <div class="page-layout">
      <header data-partial="header">
         <!-- Header content -->
         <nav>...</nav>
      </header>
      <main>
         <slot />
      </main>
      <footer data-partial="footer">
         <!-- Footer content -->
         <p>Footer content</p>
      </footer>
   </div>
</template>

<script setup lang="ts">
defineOptions({
   label: "Default Layout",
   fields: {
      headerTitle: {
         type: "text",
         label: "Header Title",
         group: "header", // This group will be activated when header is clicked
      },
      headerLogo: {
         type: "text",
         label: "Logo URL",
         group: "header",
      },
      footerText: {
         type: "textarea",
         label: "Footer Text",
         group: "footer", // This group will be activated when footer is clicked
      },
   },
});
</script>
```

### How It Works

1. **Visual Feedback**: Elements with `data-partial` are highlighted in the editor, making it clear which parts of the layout are editable
2. **Click Interaction**: Clicking a partial element opens the page settings sidebar
3. **Tab Navigation**: If the partial has a value (e.g., `data-partial="header"`), the editor automatically switches to the matching field group tab in the settings panel
4. **Hover States**: Partial elements show overlay colors on hover, indicating they're interactive

### Example: Complete Layout with Partials

```vue
<template>
   <div class="page-layout">
      <!-- Header partial - links to "header" field group -->
      <header data-partial="header" class="site-header">
         <div class="container">
            <img :src="headerLogo" :alt="headerTitle" />
            <h1>{{ headerTitle }}</h1>
         </div>
      </header>

      <main>
         <slot />
      </main>

      <!-- Footer partial - links to "footer" field group -->
      <footer data-partial="footer" class="site-footer">
         <div class="container">
            <p>{{ footerText }}</p>
         </div>
      </footer>
   </div>
</template>

<script setup lang="ts">
defineOptions({
   label: "Marketing Layout",
   fields: {
      headerTitle: {
         type: "text",
         label: "Header Title",
         group: "header",
         default: "My Site",
      },
      headerLogo: {
         type: "text",
         label: "Logo URL",
         group: "header",
      },
      footerText: {
         type: "textarea",
         label: "Footer Text",
         group: "footer",
         default: "© 2024 My Company",
      },
   },
});

const props = defineProps<{
   headerTitle?: string;
   headerLogo?: string;
   footerText?: string;
}>();
</script>
```

In this example:

- Clicking the header element opens the page settings and automatically switches to the "header" tab
- Clicking the footer element opens the page settings and automatically switches to the "footer" tab
- Users can quickly navigate to edit specific sections of the layout without manually finding the right tab
