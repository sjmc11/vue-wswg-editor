# Registry Utilities

The registry system manages blocks, layouts, and fields discovered by the Vite plugin. These utilities allow you to access and interact with the registry programmatically.

## Import

```typescript
import { getLayouts, getBlocks, initialiseRegistry } from "vue-wswg-editor";
```

## Functions

### getLayouts

Returns all registered layout components.

```typescript
function getLayouts(): Record<string, Layout>;
```

**Returns:** A record of layout names to layout components.

**Example:**

```typescript
import { getLayouts } from "vue-wswg-editor";

const layouts = getLayouts();
// {
//   default: LayoutComponent,
//   marketing: LayoutComponent,
//   ...
// }

// Get a specific layout
const defaultLayout = layouts.default;
```

### getBlocks

Returns all registered block components.

```typescript
function getBlocks(): Record<string, Block>;
```

**Returns:** A record of block types to block components.

**Example:**

```typescript
import { getBlocks } from "vue-wswg-editor";

const blocks = getBlocks();
// {
//   hero: BlockComponent,
//   divider: BlockComponent,
//   ...
// }

// Get a specific block
const heroBlock = blocks.hero;
```

### initialiseRegistry

Initializes the registry by loading blocks, layouts, and fields from virtual modules. This is called automatically by `WswgJsonEditor` on mount, but you can call it manually if needed.

```typescript
function initialiseRegistry(): Promise<void>;
```

**Example:**

```typescript
import { initialiseRegistry, getLayouts } from "vue-wswg-editor";

// Initialize registry before accessing layouts/blocks
await initialiseRegistry();

// Now layouts are available
const layouts = getLayouts();
```

**Note:** This function is async and should be awaited. It's typically called automatically by the editor component, but you may need to call it manually if you're accessing the registry outside of the editor.

## Internal Functions

These functions are used internally by the library but may be useful in advanced scenarios:

### getBlockThumbnailUrl

Gets the thumbnail URL for a block by its directory path.

```typescript
function getBlockThumbnailUrl(directory: string | undefined): string | undefined;
```

### getBlockComponent

Gets a block component by its type.

```typescript
function getBlockComponent(blockType: string): Block | undefined;
```

### getLayoutFields

Gets the field configuration for a layout.

```typescript
function getLayoutFields(layoutName: string): Record<string, EditorFieldConfig>;
```

## Usage Example

```typescript
import { initialiseRegistry, getLayouts, getBlocks } from "vue-wswg-editor";

async function setupPageBuilder() {
   // Initialize registry first
   await initialiseRegistry();

   // Get available layouts
   const layouts = getLayouts();
   console.log("Available layouts:", Object.keys(layouts));

   // Get available blocks
   const blocks = getBlocks();
   console.log("Available blocks:", Object.keys(blocks));

   // Use layouts/blocks in your application
   return { layouts, blocks };
}
```

## See Also

- [Vite Plugin Guide](/guide/vite-plugin) - Learn how the registry is populated
- [Blocks Guide](/guide/blocks) - Learn about creating blocks
- [Layouts Guide](/guide/layouts) - Learn about creating layouts
