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

A block component is a standard Vue component:

```vue
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

## Block Naming Convention

- Block directories should use **kebab-case** (e.g., `hero-section`)
- Block components should use **PascalCase** matching the directory name (e.g., `HeroSection.vue`)
- The library automatically matches block types to components using name variations

## Block Fields

Blocks can define editable fields using a `fields.ts` file. See the [Fields Guide](/guide/fields) for more information.

## Block Thumbnails

You can add a `thumbnail.png` image to your block directory to display a preview in the block browser.

