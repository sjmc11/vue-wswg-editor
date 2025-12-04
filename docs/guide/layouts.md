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

A layout component must include a `<slot />` where blocks will be rendered:

```vue
<template>
   <div class="page-layout">
      <header>
         <h1>{{ title }}</h1>
      </header>
      <main>
         <slot />
      </main>
      <footer>
         <p>Footer content</p>
      </footer>
   </div>
</template>

<script setup lang="ts">
defineOptions({
   label: "Default Layout",
});

defineProps<{
   title?: string;
}>();
</script>
```

## Layout Naming Convention

- Layout files should use **kebab-case** (e.g., `default.vue`, `marketing.vue`)
- Layouts are referenced by their filename (without extension)
- Use `defineOptions` to set a `label` for display in the editor

## Layout Settings

Layouts can have settings that are editable through the page settings panel. Define these in your layout component's props.

