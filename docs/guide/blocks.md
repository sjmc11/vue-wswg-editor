# Blocks

Blocks are reusable components that make up a page. Each block represents a section of content that users can add, configure, and arrange.

## Creating a Block

Blocks are Vue components located in your `page-builder/blocks` directory. Each block should be in its own directory:

```
src/page-builder/blocks/
  hero/
    Hero.vue
    fields.ts      # Optional
    thumbnail.png  # Optional
```

## Block Component Structure

A block component is a standard Vue component that **should** define a `label` in `defineOptions` for display in the editor:

```vue
<template>
   <section class="hero-section">
      <h1>{{ heading }}</h1>
      <p>{{ description }}</p>
   </section>
</template>

<script setup lang="ts">
defineOptions({
   label: "Hero Section", // Used for display in the block browser
});

defineProps<{
   heading: string;
   description: string;
}>();
</script>
```

### Label in defineOptions

The `label` property in `defineOptions` is used to display the block name in the editor's block browser. While not strictly required (the block will still work without it), providing a label improves the user experience by showing a friendly name instead of the block type.

```vue
<script setup lang="ts">
defineOptions({
   label: "Hero Section", // Display name in block browser
   // Optional: emoji for visual identification
   emoji: "🎯",
});
</script>
```

**Benefits:**

- **Better UX** - Users see friendly names like "Hero Section" instead of "heroSection"
- **Consistency** - Matches the pattern used by layouts
- **Accessibility** - Clearer identification for screen readers

## Block Naming Convention

- Block directories should use **kebab-case** (e.g., `hero-section`)
- Block components should use **PascalCase** matching the directory name (e.g., `HeroSection.vue`)
- The library automatically matches block types to components using name variations
- **Recommended:** Use `defineOptions` with a `label` property for display in the editor

## Block Fields

Blocks can define editable fields using a `fields.ts` file. See the [Fields Guide](/guide/fields) for more information.

## Block Thumbnails

You can add a `thumbnail.png` image to your block directory to display a preview in the block browser.
