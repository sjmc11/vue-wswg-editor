---
layout: home

hero:
   name: vue-wswg-editor
   text: WYSIWYG JSON Editor
   tagline: A powerful Vue 3 component library for building visual page builders
   image:
      src: /assets.hero.jpg
      alt: vue-wswg-editor
   actions:
      - theme: brand
        text: Get Started
        link: /guide/getting-started
      - theme: alt
        text: View on GitHub
        link: https://github.com/sjmc11/vue-wswg-editor

features:
   - icon: 🎨
     title: Visual Page Builder
     details: Intuitive drag-and-drop interface for building pages with a comprehensive sidebar editor
   - icon: 📝
     title: Rich Field Editor
     details: Support for multiple field types including text, textarea, select, color, repeater, and more
   - icon: 🎯
     title: Block Management
     details: Add, remove, reorder, and configure blocks with ease through a user-friendly interface
   - icon: 📱
     title: Responsive Preview
     details: Preview pages in desktop and mobile viewports with real-time updates
   - icon: 🎨
     title: Customizable Layouts
     details: Support for multiple page layouts with easy customization options
   - icon: 🔧
     title: Field Validation
     details: Built-in validation with support for custom validators
   - icon: 📦
     title: TypeScript Support
     details: Full TypeScript support with comprehensive type definitions
   - icon: 🔌
     title: Vite Plugin
     details: Automatic block, layout, and field discovery via Vite plugin
---

## Quick Start

Install the library and start building:

```bash
npm install vue-wswg-editor
```

```vue
<template>
   <WswgJsonEditor v-model="pageData" :editable="true" :showBrowserBar="true" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgJsonEditor } from "vue-wswg-editor";
import "vue-wswg-editor/style.css";

const pageData = ref({
   blocks: [],
   settings: {},
});
</script>
```

## Why vue-wswg-editor?

`vue-wswg-editor` provides a complete solution for building visual page editors in Vue 3 applications. It combines:

- **Ease of Use**: Simple API with sensible defaults
- **Flexibility**: Customizable blocks, layouts, and fields
- **Type Safety**: Full TypeScript support
- **Performance**: Optimized for large page configurations
- **Developer Experience**: Zero-config block discovery via Vite plugin

## Features

- 🎨 **Visual Page Builder** - Drag-and-drop interface
- 📝 **Rich Field Editor** - Comprehensive sidebar with multiple field types
- 🎯 **Block Management** - Easy block manipulation
- 📱 **Responsive Preview** - Desktop and mobile viewports
- 🎨 **Customizable Layouts** - Multiple layout support
- 🔧 **Field Validation** - Built-in and custom validators
- 📦 **TypeScript** - Full type definitions
- 🔌 **Vite Plugin** - Automatic component discovery

Ready to get started? Check out the [Getting Started Guide](/guide/getting-started).
