# Styling

The library provides limited styling customization options. Most styling should be handled through your own CSS and component styles.

## CSS Custom Properties

The editor uses CSS custom properties that you can override:

| Property            | Default Value | Description                    |
| ------------------- | ------------- | ------------------------------ |
| `--editor-height`   | `calc(100vh)` | Height of the editor container |
| `--editor-bg-color` | `#6a6a6a`     | Background color of the editor |
| `--block-margin-sm` | `2rem`        | Small block margin gap         |
| `--block-margin-md` | `4rem`        | Medium block margin gap        |
| `--block-margin-lg` | `6rem`        | Large block margin gap         |

## Editor Height

When you have your own header or footer in your application and want to maintain a full-page editor experience, you can customize the editor height using CSS custom properties.

### Default Behavior

By default, the editor uses `100vh` (full viewport height):

```css
.wswg-json-editor {
   --editor-height: calc(100vh);
}
```

### Customizing Editor Height

To account for your application's header, override the `--editor-height` CSS variable:

```vue
<template>
   <div class="page-editor-wrapper">
      <header class="app-header">
         <!-- Your application header -->
         <nav>...</nav>
      </header>

      <WswgJsonEditor v-model="pageData" :editable="true" class="custom-editor-height" />
   </div>
</template>

<style scoped>
.page-editor-wrapper {
   display: flex;
   flex-direction: column;
   height: 100vh;
}

.app-header {
   height: 64px; /* Your header height */
   flex-shrink: 0;
}

.custom-editor-height {
   --editor-height: calc(100vh - 64px); /* Subtract header height */
   flex: 1;
   min-height: 0;
}
</style>
```

## Editor Background Color

You can customize the editor background color using the `--editor-bg-color` CSS custom property:

```css
.wswg-json-editor {
   --editor-bg-color: #f5f5f5;
}
```

## Block Margin Classes

The library provides margin utility classes for blocks:

- `margin-top-none`, `margin-top-sm`, `margin-top-md`, `margin-top-lg`
- `margin-bottom-none`, `margin-bottom-sm`, `margin-bottom-md`, `margin-bottom-lg`

These classes are applied automatically based on block margin settings.

### Customizing Block Margin Sizes

You can customize the margin sizes using CSS custom properties:

```css
.block-wrapper {
   --block-margin-sm: 1rem; /* Small margin (default: 2rem) */
   --block-margin-md: 2rem; /* Medium margin (default: 4rem) */
   --block-margin-lg: 3rem; /* Large margin (default: 6rem) */
}
```

Or customize globally:

```css
:root {
   --block-margin-sm: 1rem;
   --block-margin-md: 2rem;
   --block-margin-lg: 3rem;
}
```

## Tailwind CSS Integration

The library uses Tailwind CSS for its internal styling. If you're using Tailwind in your project, the editor will inherit your Tailwind configuration.

To avoid conflicts with Tailwind v4, the library wraps its Tailwind utilities in a custom layer (`vue-wswg-editor-library`), ensuring your Tailwind v4 utilities take precedence.

## Container Styling and Responsive Design

When styling your page content, it's important to understand how container sizes and media queries work differently in the editor view versus the product preview.

### The Challenge

Media queries respond to the browser viewport size, which works fine for the product preview. However, when rendering elements in the editor view, they are displayed in a different container alongside the sidebar and editor controls. This means:

- The preview container in the editor has less width than the full browser viewport
- Media queries based on browser width won't match the actual container width in the editor
- Your responsive design may not behave as expected during editing

### Solution 1: Container Queries (Recommended)

The recommended approach is to use container queries instead of media queries. The main wrapper element `#page-viewport` already acts as a container that can be used for container queries.

If using Tailwind CSS, use container query variants instead of media query variants:

```vue
<template>
   <div id="page-viewport">
      <div class="@3xl:p-12 p-4">
         <!-- Your content -->
      </div>
   </div>
</template>
```

In this example, `@3xl:p-12` responds to the container size (the `#page-viewport` element), while `md:p-12` would respond to the browser viewport size. Container queries ensure your styles adapt correctly in both the editor view and the product preview.

### Solution 2: Custom Container with CSS Override (Simple)

A simpler alternative is to use a custom container class and override its max-width specifically for the editor view.

First, define your container styles in your custom CSS:

```css
.my-container {
   width: 100%;
   margin: 0 auto;
   padding: 0 1rem;
}

@media (min-width: 768px) {
   .my-container {
      max-width: 1600px;
   }
}
```

Then, where you use the `WswgJsonEditor` component, override the max container width just for the editor experience:

```vue
<template>
   <WswgJsonEditor v-model="pageData" class="page-editor" />
</template>

<style lang="scss" scoped>
.page-editor {
   :deep(.my-container) {
      max-width: 992px;
   }
}
</style>
```

This approach allows you to use standard media queries in your CSS while ensuring the editor view displays correctly with a narrower container. But it does not affect other responsive classes.

## See Also

- [Components Guide](/guide/components) - Learn about using the editor and renderer components
- [Layouts Guide](/guide/layouts) - Learn about creating layouts
