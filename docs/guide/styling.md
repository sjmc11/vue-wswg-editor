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

## See Also

- [Components Guide](/guide/components) - Learn about using the editor and renderer components
- [Layouts Guide](/guide/layouts) - Learn about creating layouts
