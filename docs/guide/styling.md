# Styling

The library provides limited styling customization options. Most styling should be handled through your own CSS and component styles.

## CSS Custom Properties

The editor uses CSS custom properties that you can override:

| Property                   | Default Value | Description                                    |
| -------------------------- | ------------- | ---------------------------------------------- |
| `--editor-height`          | `calc(100vh)` | Height of the editor container                 |
| `--editor-bg-color`        | `#6a6a6a`     | Background color of the editor                 |
| `--block-margin-sm`        | `2rem`        | Small block margin gap                         |
| `--block-margin-md`        | `4rem`        | Medium block margin gap                        |
| `--block-margin-lg`        | `6rem`        | Large block margin gap                         |
| `--block-badge-color`      | `#638ef1`     | Color for the "Editing" badge on active blocks |
| `--block-backdrop-color`   | `transparent` | Backdrop/overlay color for blocks              |
| `--block-border-color`     | `#638ef1`     | Border color for block overlays                |
| `--block-border-width`     | `4px`         | Border width for block overlays                |
| `--block-border-style`     | `solid`       | Border style for block overlays                |
| `--partial-backdrop-color` | `transparent` | Backdrop/overlay color for partials            |
| `--partial-border-color`   | `#638ef1`     | Border color for partial overlays              |
| `--partial-border-width`   | `4px`         | Border width for partial overlays              |
| `--partial-border-style`   | `solid`       | Border style for partial overlays              |
| `--margin-color`           | `#faf6d5e0`   | Background color for margin spacing indicators |
| `--margin-border-width`    | `2px`         | Border width for margin spacing indicators     |
| `--margin-border-style`    | `dashed`      | Border style for margin spacing indicators     |
| `--margin-border-color`    | `#cbc59c`     | Border color for margin spacing indicators     |

## Editor Height

When you have your own header or footer in your application and want to maintain a full-page editor experience, you can customize the editor height using CSS custom properties.

### Default Behavior

By default, the editor uses `100vh` (full viewport height):

```css
.wswg-page-builder {
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

      <WswgPageBuilder v-model="pageData" :editable="true" class="custom-editor-height" />
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
.wswg-page-builder {
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

## Overlay Colors and Borders

You can customize the visual feedback colors for blocks and partials (layout elements) using CSS custom properties:

### Block Overlays

Customize the backdrop and border styles for blocks:

```css
.wswg-page-builder {
   --block-backdrop-color: transparent; /* Backdrop/overlay color */
   --block-border-color: #638ef1; /* Border color */
   --block-border-width: 4px; /* Border width */
   --block-border-style: solid; /* Border style */
   --block-badge-color: #638ef1; /* "Editing" badge color */
}
```

### Partial Overlays

Customize the backdrop and border styles for layout elements (partials) that are marked with `data-partial`:

```css
.wswg-page-builder {
   --partial-backdrop-color: transparent; /* Backdrop/overlay color */
   --partial-border-color: #638ef1; /* Border color */
   --partial-border-width: 4px; /* Border width */
   --partial-border-style: solid; /* Border style */
}
```

### Margin Spacing Indicators

Customize the colors and styles for the margin spacing indicators shown between blocks:

```css
.wswg-page-builder {
   --margin-color: #faf6d5e0; /* Background color */
   --margin-border-width: 2px; /* Border width */
   --margin-border-style: dashed; /* Border style */
   --margin-border-color: #cbc59c; /* Border color */
}
```

### Example: Custom Theme

```css
.wswg-page-builder {
   /* Block overlays - purple theme */
   --block-backdrop-color: rgba(219, 117, 190, 0.1);
   --block-border-color: #9b59b6;
   --block-border-width: 3px;
   --block-border-style: dashed;

   /* Partial overlays - green theme */
   --partial-backdrop-color: rgba(159, 246, 165, 0.1);
   --partial-border-color: rgb(63, 165, 76);
   --partial-border-width: 2px;
   --partial-border-style: solid;

   /* Margin indicators - yellow theme */
   --margin-color: rgba(250, 246, 213, 0.88);
   --margin-border-width: 2px;
   --margin-border-style: dashed;
   --margin-border-color: #cbc59c;
}
```

## Container Styling and Responsive Design

When styling your page content, you can use standard media queries and responsive breakpoints. The editor preview automatically responds to the preview container size, so your responsive styles will work correctly in both the editor view and the product preview.

### Standard Media Queries

You can use standard CSS media queries for responsive styling:

```vue
<template>
   <div id="page-viewport">
      <div class="content-wrapper">
         <!-- Your content -->
      </div>
   </div>
</template>

<style scoped>
.content-wrapper {
   padding: 1rem;
}

@media (min-width: 768px) {
   .content-wrapper {
      padding: 2rem;
   }
}

@media (min-width: 1024px) {
   .content-wrapper {
      padding: 3rem;
   }
}
</style>
```

The editor preview container automatically adjusts breakpoints to match the preview size, so your responsive styles will behave correctly during editing without needing container queries.

## See Also

- [Components Guide](/guide/components) - Learn about using the editor and renderer components
- [Layouts Guide](/guide/layouts) - Learn about creating layouts
